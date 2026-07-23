import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateOverallMastery } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "current"; // current, all, weekly, monthly
    const seasonId = searchParams.get("seasonId");
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));

    // Get all seasons for the selector
    const seasons = await prisma.leaderboardSeason.findMany({
      orderBy: { startDate: "desc" },
      select: { id: true, name: true, period: true, startDate: true, endDate: true, isActive: true, isFinished: true },
    });

    // Get current active season or determine from period
    let activeSeason = null;
    if (seasonId) {
      activeSeason = await prisma.leaderboardSeason.findUnique({ where: { id: seasonId } });
    } else if (period && period !== "all" && period !== "current") {
      const now = new Date();
      activeSeason = await prisma.leaderboardSeason.findFirst({
        where: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
          period: period,
        },
      });
    }

    // Get all learners with their mastery scores
    const users = await prisma.user.findMany({
      where: { role: "learner" },
      include: {
        masteryScores: true,
        tier: true,
      },
    });

    // Calculate scores
    const userScores = users
      .map((u) => {
        const overallScore = calculateOverallMastery(u.masteryScores);
        const conceptsCount = u.masteryScores.length;
        const correctRate =
          conceptsCount > 0
            ? u.masteryScores.reduce((sum, ms) => sum + ms.correctCount, 0) /
              u.masteryScores.reduce((sum, ms) => sum + ms.attempts, 0)
            : 0;

        return {
          id: u.id,
          name: u.name,
          overallScore,
          conceptsCount,
          correctRate: Math.round(correctRate * 100),
          tier: u.tier
            ? { name: u.tier.name, color: u.tier.color, icon: u.tier.icon }
            : null,
        };
      })
      .sort((a, b) => b.overallScore - a.overallScore || b.conceptsCount - a.conceptsCount);

    // Find current user's rank
    const currentUserIndex = userScores.findIndex((u) => u.id === session.id);
    const currentUserRank = currentUserIndex >= 0 ? currentUserIndex + 1 : userScores.length;
    const totalLearners = userScores.length;

    // Calculate percentile
    const percentile =
      totalLearners > 0
        ? Math.round(((totalLearners - currentUserRank) / totalLearners) * 100)
        : 0;

    // Get top ranked users
    const topRanked = userScores.slice(0, limit).map((u, i) => ({
      rank: i + 1,
      ...u,
      isCurrentUser: u.id === session.id,
    }));

    // Get season info for the current user if there's an active season
    let userSeasonRank = null;
    if (activeSeason) {
      const seasonScore = await prisma.userSeasonScore.findUnique({
        where: { userId_seasonId: { userId: session.id, seasonId: activeSeason.id } },
      });
      if (seasonScore) {
        userSeasonRank = seasonScore.rank || null;
      }
    }

    // Streak data for the current user (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId: session.id,
        completed: true,
        completedAt: { gte: thirtyDaysAgo },
      },
      orderBy: { completedAt: "asc" },
      select: { completedAt: true },
    });

    // Build daily activity map for streak heatmap
    const dailyActivity: Record<string, number> = {};
    for (const a of recentAttempts) {
      if (a.completedAt) {
        const day = a.completedAt.toISOString().split("T")[0];
        dailyActivity[day] = (dailyActivity[day] || 0) + 1;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: topRanked,
        currentUser: {
          rank: currentUserRank,
          ...(userScores[currentUserIndex] || null),
          percentile,
          totalLearners,
          seasonRank: userSeasonRank,
        },
        seasons,
        activeSeason: activeSeason
          ? { id: activeSeason.id, name: activeSeason.name, period: activeSeason.period, startDate: activeSeason.startDate, endDate: activeSeason.endDate }
          : null,
        dailyActivity,
      },
    });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
