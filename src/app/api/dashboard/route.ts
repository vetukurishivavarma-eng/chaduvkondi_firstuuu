import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;
    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get("trackId");

    // Get all available tracks
    const allTracks = await prisma.track.findMany({
      where: { isActive: true },
      orderBy: { popularity: "desc" },
    });

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tier: true, currentTrack: true },
    });

    // Determine which track to show stats for
    const activeTrackId = trackId || user?.currentTrackId || allTracks[0]?.id;

    // Get concepts - either for a specific track or all tracks
    const conceptFilter = activeTrackId
      ? { subDomain: { trackId: activeTrackId } }
      : {};

    const totalConcepts = await prisma.concept.count({
      where: activeTrackId ? conceptFilter : undefined,
    });

    // Get all mastery scores for this user
    const masteryScores = await prisma.masteryScore.findMany({
      where: { userId },
      include: {
        concept: {
          include: { subDomain: { select: { name: true, trackId: true } } },
        },
      },
    });

    // Filter mastery scores by track if specified
    const filteredMastery = activeTrackId
      ? masteryScores.filter((ms) => ms.concept.subDomain.trackId === activeTrackId)
      : masteryScores;

    const overallScore = calculateOverallMastery(filteredMastery);

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
    const weakConcepts = filteredMastery
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
    const conceptsMastered = filteredMastery.filter((ms) => ms.score >= 80).length;

    // Recent quiz activity (filtered by track if specified)
    const recentQuizFilter: any = { userId, completed: true };
    if (activeTrackId) {
      recentQuizFilter.trackId = activeTrackId;
    }

    const recentQuizzes = await prisma.quizAttempt.findMany({
      where: recentQuizFilter,
      orderBy: { completedAt: "desc" },
      take: 10,
      include: {
        answerLogs: { select: { id: true } },
        track: { select: { name: true, icon: true, color: true } },
      },
    });

    const recentActivity = recentQuizzes.map((q) => ({
      id: q.id,
      type: q.type,
      score: q.score || 0,
      completedAt: q.completedAt?.toISOString() || q.startedAt.toISOString(),
      conceptCount: q.answerLogs.length,
      trackName: q.track?.name || null,
      trackIcon: q.track?.icon || null,
    }));

    // Sub-domain scores
    const subDomainMastery: Record<string, { totalScore: number; count: number }> = {};
    for (const ms of filteredMastery) {
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
      "Python Fundamentals": "#3776AB",
      "Object-Oriented Python": "#FFD43B",
      "Web Development & Data Science": "#306998",
      "JavaScript Fundamentals": "#F7DF1E",
      "Async JavaScript & TypeScript": "#3178C6",
      "Node.js & React": "#61DAFB",
      "Java Fundamentals": "#ED8B00",
      "Java OOP & Collections": "#BDB76B",
      "Spring Boot & Testing": "#6DB33F",
      "Go Fundamentals": "#00ADD8",
      "Concurrency & HTTP": "#5DC9E2",
      "Rust Fundamentals": "#DEA584",
      "Traits & Error Handling": "#CE422B",
      "Advanced Rust": "#000000",
    };

    const subDomainScores = Object.entries(subDomainMastery).map(([name, data]) => ({
      name,
      score: Math.round(data.totalScore / data.count),
      color: subDomainColors[name] || "#6366f1",
    }));

    // Current streak
    const streak = await calculateStreak(userId);

    // Spaced repetition due (filtered by track if specified)
    const spacedFilter: any = { userId, nextReviewAt: { lte: new Date() } };
    if (activeTrackId) {
      const trackConceptIds = (
        await prisma.concept.findMany({
          where: { subDomain: { trackId: activeTrackId } },
          select: { id: true },
        })
      ).map((c) => c.id);
      spacedFilter.conceptId = { in: trackConceptIds };
    }

    const spacedDue = await prisma.spacedRepetition.count({ where: spacedFilter });

    // Per-track progress summary
    const trackProgress = await Promise.all(
      allTracks.map(async (track) => {
        const trackConceptIds = (
          await prisma.concept.findMany({
            where: { subDomain: { trackId: track.id } },
            select: { id: true },
          })
        ).map((c) => c.id);

        const trackMastery = masteryScores.filter((ms) =>
          trackConceptIds.includes(ms.conceptId)
        );
        const trackScore = calculateOverallMastery(trackMastery);
        const trackConceptsTotal = trackConceptIds.length;
        const trackConceptsMastered = trackMastery.filter((ms) => ms.score >= 80).length;

        return {
          id: track.id,
          name: track.name,
          icon: track.icon,
          color: track.color,
          score: trackScore,
          conceptsMastered: trackConceptsMastered,
          totalConcepts: trackConceptsTotal,
          isActive: track.id === activeTrackId,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        user: {
          name: user?.name || session.name,
          email: session.email,
          tier: user?.tier || null,
          avatarUrl: user?.avatarUrl || null,
          currentTrackId: user?.currentTrackId,
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
        tracks: trackProgress,
        allTracks,
        activeTrackId,
      },
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

function calculateOverallMastery(scores: { score: number }[]): number {
  if (scores.length === 0) return 0;
  const total = scores.reduce((sum, s) => sum + s.score, 0);
  return Math.round(total / scores.length);
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
