import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const battle = await prisma.battle.findUnique({
      where: { id },
      include: {
        track: {
          include: {
            subDomains: {
              include: {
                concepts: {
                  include: {
                    questions: {
                      where: { isActive: true },
                      include: {
                        choices: { orderBy: { text: "asc" } },
                        concept: { select: { name: true } },
                      },
                    },
                  },
                },
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
    const isChallenger = battle.challengerId === userId;

    if (!isChallenger && battle.opponentId !== userId) {
      return NextResponse.json({ success: false, error: "Not a participant" }, { status: 403 });
    }

    // Mark this player as ready
    if (isChallenger) {
      await prisma.battle.update({ where: { id }, data: { readyChallenger: true } });
    } else {
      await prisma.battle.update({ where: { id }, data: { readyOpponent: true } });
    }

    // Get updated battle to check both ready
    const updatedBattle = await prisma.battle.findUnique({ where: { id } });

    if (!updatedBattle) {
      return NextResponse.json({ success: false, error: "Battle not found" }, { status: 404 });
    }

    const bothReady = updatedBattle.readyChallenger && updatedBattle.readyOpponent;

    if (bothReady && updatedBattle.status === "ready") {
      // Both are ready! Start the battle by selecting questions
      const allQuestions = battle.track.subDomains.flatMap((sd) =>
        sd.concepts.flatMap((c) => c.questions)
      );

      if (allQuestions.length === 0) {
        return NextResponse.json({ success: false, error: "No questions available for this track" }, { status: 400 });
      }

      // Shuffle and pick questions
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(battle.questionCount || 10, shuffled.length));

      // Create BattleQuestion records
      await prisma.battleQuestion.createMany({
        data: selected.map((q, i) => ({
          battleId: id,
          questionId: q.id,
          order: i,
        })),
      });

      // Start the battle
      await prisma.battle.update({
        where: { id },
        data: {
          status: "active",
          currentQuestion: 0,
          startedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        status: updatedBattle.status,
        bothReady,
        currentQuestion: updatedBattle.currentQuestion,
      },
    });
  } catch (error) {
    console.error("Ready error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
