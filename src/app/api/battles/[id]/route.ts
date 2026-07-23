import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const battle = await prisma.battle.findUnique({
      where: { id },
      include: {
        challenger: { select: { id: true, name: true, avatarUrl: true, mood: true } },
        opponent: { select: { id: true, name: true, avatarUrl: true, mood: true } },
        track: { select: { id: true, name: true, icon: true, color: true } },
        questions: {
          orderBy: { order: "asc" },
          include: {
            question: {
              include: {
                concept: { select: { name: true } },
                choices: { orderBy: { text: "asc" } },
              },
            },
            answers: {
              include: {
                user: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!battle) {
      return NextResponse.json({ success: false, error: "Battle not found" }, { status: 404 });
    }

    const userId = session.id;
    const isChallenger = battle.challenger.id === userId;
    const isOpponent = battle.opponent.id === userId;

    if (!isChallenger && !isOpponent) {
      return NextResponse.json({ success: false, error: "Not a participant" }, { status: 403 });
    }

    const isAi = battle.isAi;

    // Format questions without correct answers (hide correct answer from choices)
    const questions = battle.questions.map((bq) => {
      const myAns = bq.answers.find((a) => a.userId === userId);
      const oppAns = bq.answers.find((a) => a.userId !== userId);
      return {
        id: bq.id,
        questionId: bq.question.id,
        order: bq.order,
        text: bq.question.text,
        conceptName: bq.question.concept.name,
        choices: bq.question.choices.map((c) => ({
          id: c.id,
          text: c.text,
        })),
        myAnswer: myAns ? { choiceId: myAns.choiceId, isCorrect: myAns.isCorrect, points: myAns.points } : null,
        opponentAnswer: oppAns ? { choiceId: oppAns.choiceId, isCorrect: oppAns.isCorrect, points: oppAns.points } : null,
        answerCount: bq.answers.length,
        allAnswers: battle.status === "completed"
          ? bq.answers.map((a) => ({
              userId: a.userId,
              userName: a.user.name,
              choiceId: a.choiceId,
              isCorrect: a.isCorrect,
              points: a.points,
            }))
          : [],
      };
    });

    // Calculate current scores (recalculate from answers for accuracy)
    const challengerPoints = battle.questions.reduce((sum, bq) => {
      const answer = bq.answers.find((a) => a.userId === battle.challenger.id);
      return sum + (answer?.points || 0);
    }, 0);

    // AI battles: look up opponent score by ai-bot-ceo sentinel ID
    const opponentPoints = battle.isAi
      ? battle.questions.reduce((sum, bq) => {
          const answer = bq.answers.find((a) => a.userId === "ai-bot-ceo");
          return sum + (answer?.points || 0);
        }, 0)
      : battle.questions.reduce((sum, bq) => {
          const answer = bq.answers.find((a) => a.userId === battle.opponent.id);
          return sum + (answer?.points || 0);
        }, 0);

    // Determine if current player has answered the current question
    const currentBq = battle.questions.find((bq) => bq.order === battle.currentQuestion);
    const myCurrentAnswer = currentBq?.answers.find((a) => a.userId === userId);

    return NextResponse.json({
      success: true,
      data: {
        id: battle.id,
        status: battle.status,
        currentQuestion: battle.currentQuestion,
        questionCount: battle.questionCount,
        readyChallenger: battle.readyChallenger,
        readyOpponent: battle.readyOpponent,
        isChallenger,
        isAi,
        myName: isChallenger ? battle.challenger.name : battle.opponent.name,
        opponentName: isAi && isChallenger
          ? battle.aiCeoName
          : isChallenger
          ? battle.opponent.name
          : battle.challenger.name,
        opponentAvatar: isAi ? null : (isChallenger ? battle.opponent.avatarUrl : battle.challenger.avatarUrl),
        opponentMood: isChallenger ? battle.opponent.mood : battle.challenger.mood,
        aiCeoName: isAi ? battle.aiCeoName : null,
        aiDifficulty: isAi ? battle.aiDifficulty : null,
        track: {
          name: battle.track.name,
          icon: battle.track.icon,
          color: battle.track.color,
        },
        myScore: isChallenger ? challengerPoints : opponentPoints,
        opponentScore: isChallenger ? opponentPoints : challengerPoints,
        currentQuestionData: currentBq && battle.status === "active" ? questions.find((q) => q.order === battle.currentQuestion) || null : null,
        questions: battle.status === "completed" ? questions : [],
        hasAnsweredCurrent: !!myCurrentAnswer,
        bothAnsweredCurrent: currentBq?.answers.length === 2,
        myPoints: isChallenger ? challengerPoints : opponentPoints,
        opponentPoints: isChallenger ? opponentPoints : challengerPoints,
        startedAt: battle.startedAt?.toISOString(),
        completedAt: battle.completedAt?.toISOString(),
        createdAt: battle.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Battle status error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
