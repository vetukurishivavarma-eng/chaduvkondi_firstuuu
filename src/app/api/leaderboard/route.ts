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
    const period = searchParams.get("period") || "all"; // all, weekly, monthly
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));

    // Get all users with their mastery scores
    const users = await prisma.user.findMany({
      where: { role: "learner" },
      include: {
        masteryScores: true,
        tier: true,
      },
    });

    // Calculate scores for all users
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

    // Calculate percentile (0-100, higher is better)
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

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: topRanked,
        currentUser: {
          rank: currentUserRank,
          ...userScores[currentUserIndex] || null,
          percentile,
          totalLearners,
        },
      },
    });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
