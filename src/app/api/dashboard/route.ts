import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateOverallMastery, calculateMasteryScore } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;

    // Get total concepts
    const totalConcepts = await prisma.concept.count();

    // Get all mastery scores for this user
    const masteryScores = await prisma.masteryScore.findMany({
      where: { userId },
      include: {
        concept: {
          include: { subDomain: { select: { name: true } } },
        },
      },
    });

    const overallScore = calculateOverallMastery(masteryScores);

    // Determine tier
    const tiers = await prisma.tierDefinition.findMany({ orderBy: { minScore: "asc" } });
    let currentTier = tiers[0];
    let nextTier = null;
    for (let i = 0; i < tiers.length; i++) {
      if (overallScore >= tiers[i].minScore) {
        currentTier = tiers[i];
        nextTier = tiers[i + 1] || null;
      }
    }

    const tierProgress = nextTier
      ? ((overallScore - currentTier.minScore) / (nextTier.minScore - currentTier.minScore)) * 100
      : 100;

    // Weak concepts (bottom 5 by score)
    const weakConcepts = masteryScores
      .filter((ms) => ms.score < 60)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map((ms) => ({
        id: ms.concept.id,
        name: ms.concept.name,
        subDomain: ms.concept.subDomain.name,
        score: Math.round(ms.score),
      }));

    // Concepts mastered (> 80%)
    const conceptsMastered = masteryScores.filter((ms) => ms.score >= 80).length;

    // Recent quiz activity
    const recentQuizzes = await prisma.quizAttempt.findMany({
      where: { userId, completed: true },
      orderBy: { completedAt: "desc" },
      take: 10,
      include: {
        answerLogs: { select: { id: true } },
      },
    });

    const recentActivity = recentQuizzes.map((q) => ({
      id: q.id,
      type: q.type,
      score: q.score || 0,
      completedAt: q.completedAt?.toISOString() || q.startedAt.toISOString(),
      conceptCount: q.answerLogs.length,
    }));

    // Sub-domain scores
    const subDomainMastery: Record<string, { totalScore: number; count: number }> = {};
    for (const ms of masteryScores) {
      const subDomainName = ms.concept.subDomain.name;
      if (!subDomainMastery[subDomainName]) {
        subDomainMastery[subDomainName] = { totalScore: 0, count: 0 };
      }
      subDomainMastery[subDomainName].totalScore += ms.score;
      subDomainMastery[subDomainName].count += 1;
    }

    const subDomainColors: Record<string, string> = {
      "Admin & Configuration": "#6366f1",
      "Apex Programming": "#8b5cf6",
      "Lightning Web Components": "#3b82f6",
      "Flow & Automation": "#22c55e",
      "Data Modeling": "#f59e0b",
      "Integration & APIs": "#ef4444",
      "Deployment & DevOps": "#06b6d4",
    };

    const subDomainScores = Object.entries(subDomainMastery).map(([name, data]) => ({
      name,
      score: Math.round(data.totalScore / data.count),
      color: subDomainColors[name] || "#6366f1",
    }));

    // Current streak
    const streak = await calculateStreak(userId);

    // Spaced repetition due
    const spacedDue = await prisma.spacedRepetition.count({
      where: { userId, nextReviewAt: { lte: new Date() } },
    });

    // Get user with tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tier: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          name: user?.name || session.name,
          email: session.email,
          tier: user?.tier || null,
        },
        stats: {
          overallScore,
          conceptsMastered,
          totalConcepts,
          totalQuizzes: recentQuizzes.length,
          currentStreak: streak,
          tierProgress: Math.min(100, Math.max(0, tierProgress)),
          nextTier: nextTier
            ? { name: nextTier.name, minScore: nextTier.minScore, color: nextTier.color }
            : null,
        },
        weakConcepts,
        recentActivity,
        subDomainScores,
        spacedDue,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

async function calculateStreak(userId: string): Promise<number> {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId, completed: true },
    orderBy: { completedAt: "desc" },
    select: { completedAt: true },
    take: 365,
  });

  if (attempts.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates: Set<string> = new Set();
  for (const a of attempts) {
    if (a.completedAt) {
      const d = new Date(a.completedAt);
      d.setHours(0, 0, 0, 0);
      dates.add(d.toISOString().split("T")[0]);
    }
  }

  const checkDate = new Date(today);
  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (dates.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
