import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAiAnswer } from "@/lib/ai-battle";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { battleQuestionId, choiceId } = await request.json();
    const userId = session.id;

    if (!battleQuestionId || !choiceId) {
      return NextResponse.json({ success: false, error: "Missing answer data" }, { status: 400 });
    }

    // Use a transaction for atomic scoring
    const result = await prisma.$transaction(async (tx) => {
      const battle = await tx.battle.findUnique({ where: { id } });
      if (!battle) throw new Error("Battle not found");
      if (battle.status !== "active") throw new Error("Battle is not active");

      const isChallenger = battle.challengerId === userId;
      if (!isChallenger && battle.opponentId !== userId) {
        throw new Error("Not a participant");
      }

      const battleQuestion = await tx.battleQuestion.findUnique({
        where: { id: battleQuestionId },
        include: {
          question: { include: { choices: true } },
          answers: true,
        },
      });

      if (!battleQuestion) throw new Error("Question not found");
      if (battleQuestion.order !== battle.currentQuestion) throw new Error("Not the current question");
      if (battleQuestion.answers.some((a) => a.userId === userId)) throw new Error("Already answered");

      const choice = battleQuestion.question.choices.find((c) => c.id === choiceId);
      if (!choice) throw new Error("Invalid choice");

      const isCorrect = choice.isCorrect;

      // Record user's answer with temp points
      await tx.battleAnswer.create({
        data: {
          battleId: id,
          battleQuestionId,
          userId,
          choiceId,
          isCorrect,
          points: 0,
        },
      });

      // If this is an AI battle, generate the AI's answer automatically
      if (battle.isAi) {
        const aiChoices = battleQuestion.question.choices.map((c) => ({
          id: c.id,
          isCorrect: c.isCorrect,
        }));
        const aiAnswer = generateAiAnswer(battle.aiCeoName, battle.aiDifficulty, aiChoices);

        // Record AI answer with sentinel userId to avoid unique constraint collision
        // Only insert if not already recorded (another simultaneous request might have)
        const existingAi = await tx.battleAnswer.findFirst({
          where: { battleQuestionId, userId: "ai-bot-ceo" },
        });
        if (!existingAi) {
          await tx.$executeRawUnsafe(
            `INSERT INTO "BattleAnswer" ("id", "battleId", "battleQuestionId", "userId", "choiceId", "isCorrect", "points", "answeredAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            crypto.randomUUID(), id, battleQuestionId, "ai-bot-ceo", aiAnswer.choiceId, aiAnswer.isCorrect, 0
          );
        }
      }

      // Count all answers (including AI) to determine when to advance
      const answerCount = await tx.battleAnswer.count({ where: { battleQuestionId } });

      // Recalculate points for all answers based on order
      const allAnswers = await tx.battleAnswer.findMany({
        where: { battleQuestionId },
        orderBy: { answeredAt: "asc" },
      });

      for (let i = 0; i < allAnswers.length; i++) {
        const ans = allAnswers[i];
        let points: number;
        if (ans.isCorrect) {
          points = i === 0 ? 2 : 1; // First = +2, subsequent = +1
        } else {
          points = -1;
        }
        await tx.battleAnswer.update({
          where: { id: ans.id },
          data: { points },
        });
      }

      // AI battles: advance automatically (both already answered)
      const totalQuestions = await tx.battleQuestion.count({ where: { battleId: id } });
      const nextQuestion = battle.currentQuestion + 1;

      if (nextQuestion >= totalQuestions) {
        // Battle is complete
        const finalAnswers = await tx.battleAnswer.findMany({ where: { battleId: id } });
        const challengerScore = finalAnswers
          .filter((a) => a.userId === battle.challengerId)
          .reduce((sum, a) => sum + a.points, 0);
        const opponentScore = battle.isAi
          ? finalAnswers
              .filter((a) => a.userId === "ai-bot-ceo")
              .reduce((sum, a) => sum + a.points, 0)
          : finalAnswers
              .filter((a) => a.userId === battle.opponentId)
              .reduce((sum, a) => sum + a.points, 0);

        await tx.battle.update({
          where: { id },
          data: {
            status: "completed",
            currentQuestion: nextQuestion,
            challengerScore,
            opponentScore,
            completedAt: new Date(),
          },
        });
      } else {
        await tx.battle.update({
          where: { id },
          data: { currentQuestion: nextQuestion },
        });
      }

      return { isCorrect, points: allAnswers.length > 0 ? allAnswers[0].points : 0, bothAnswered: true };
    });

    // Calculate scores for response
    const allMyAnswers = await prisma.battleAnswer.findMany({ where: { battleId: id, userId } });
    const myTotalPoints = allMyAnswers.reduce((sum, a) => sum + a.points, 0);

    const battle = await prisma.battle.findUnique({ where: { id } });
    if (!battle) throw new Error("Battle not found");
    const opponentId = battle.challengerId === userId ? battle.opponentId : battle.challengerId;
    const allOpponentAnswers = await prisma.battleAnswer.findMany({
      where: { battleId: id, userId: opponentId },
    });
    const opponentTotalPoints = allOpponentAnswers.reduce((sum, a) => sum + a.points, 0);

    return NextResponse.json({
      success: true,
      data: {
        isCorrect: result.isCorrect,
        points: result.points,
        myTotalPoints,
        opponentTotalPoints,
        bothAnswered: result.bothAnswered,
        isAi: battle.isAi,
      },
    });
  } catch (error: any) {
    const message = error.message || "Internal server error";
    if (["Already answered", "Battle not found", "Battle is not active", "Not the current question", "Invalid choice", "Not a participant"].includes(message)) {
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
    console.error("Battle answer error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
