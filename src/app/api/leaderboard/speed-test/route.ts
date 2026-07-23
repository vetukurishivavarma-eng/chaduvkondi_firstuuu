import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));

    // Get all completed speed test attempts with answer logs
    const speedTestAttempts = await prisma.quizAttempt.findMany({
      where: {
        type: "speed_test",
        completed: true,
      },
      include: {
        user: {
          select: { id: true, name: true, tier: { select: { name: true, color: true, icon: true } } },
        },
        answerLogs: {
          select: { isCorrect: true },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    // Group by user and find their best Q/min attempt
    const userBestMap = new Map<string, {
      userId: string;
      name: string;
      tier: { name: string; color: string; icon: string } | null;
      bestQpm: number;
      bestCorrectCount: number;
      bestTotalAnswered: number;
      bestAttemptId: string;
      bestCompletedAt: Date;
      totalAttempts: number;
    }>();

    for (const attempt of speedTestAttempts) {
      const answered = attempt.answerLogs.length;
      if (answered === 0) continue;

      // Q/min = (answered / 30) * 60 = answered * 2
      const qpm = answered * 2;
      const correctCount = attempt.answerLogs.filter((l) => l.isCorrect).length;

      const existing = userBestMap.get(attempt.userId);
      if (!existing || qpm > existing.bestQpm) {
        userBestMap.set(attempt.userId, {
          userId: attempt.userId,
          name: attempt.user.name,
          tier: attempt.user.tier
            ? { name: attempt.user.tier.name, color: attempt.user.tier.color, icon: attempt.user.tier.icon }
            : null,
          bestQpm: qpm,
          bestCorrectCount: correctCount,
          bestTotalAnswered: answered,
          bestAttemptId: attempt.id,
          bestCompletedAt: attempt.completedAt || attempt.startedAt,
          totalAttempts: (existing?.totalAttempts || 0) + 1,
        });
      } else {
        existing.totalAttempts += 1;
      }
    }

    // Sort by best Q/min descending
    const sorted = Array.from(userBestMap.values())
      .sort((a, b) => b.bestQpm - a.bestQpm || b.bestCorrectCount - a.bestCorrectCount)
      .slice(0, limit);

    // Build leaderboard with ranks
    const leaderboard = sorted.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      name: entry.name,
      tier: entry.tier,
      bestQpm: entry.bestQpm,
      bestCorrectCount: entry.bestCorrectCount,
      bestTotalAnswered: entry.bestTotalAnswered,
      bestAccuracy: entry.bestTotalAnswered > 0
        ? Math.round((entry.bestCorrectCount / entry.bestTotalAnswered) * 100)
        : 0,
      totalAttempts: entry.totalAttempts,
      bestCompletedAt: entry.bestCompletedAt.toISOString(),
      isCurrentUser: entry.userId === session.id,
    }));

    // Find current user's rank
    const currentUserEntry = sorted.find((e) => e.userId === session.id);
    const totalParticipants = sorted.length;

    // Get current user's personal best
    const myBest = userBestMap.get(session.id);

    return NextResponse.json({
      success: true,
      data: {
        leaderboard,
        currentUser: currentUserEntry
          ? {
              ...currentUserEntry,
              rank: leaderboard.findIndex((e) => e.userId === session.id) + 1,
              totalParticipants,
              percentile: totalParticipants > 0
                ? Math.round(((totalParticipants - (leaderboard.findIndex((e) => e.userId === session.id) + 1)) / totalParticipants) * 100)
                : 0,
            }
          : myBest
            ? {
                rank: null,
                userId: session.id,
                name: myBest.name,
                tier: myBest.tier,
                bestQpm: myBest.bestQpm,
                bestCorrectCount: myBest.bestCorrectCount,
                bestTotalAnswered: myBest.bestTotalAnswered,
                bestAccuracy: myBest.bestTotalAnswered > 0
                  ? Math.round((myBest.bestCorrectCount / myBest.bestTotalAnswered) * 100)
                  : 0,
                totalAttempts: myBest.totalAttempts,
                totalParticipants,
                percentile: 0,
              }
            : null,
        totalParticipants,
      },
    });
  } catch (error) {
    console.error("Speed test leaderboard API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
