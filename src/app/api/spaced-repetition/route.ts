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
    const filter = searchParams.get("filter") || "due"; // due, all, history

    // Get all spaced repetition entries for this user
    const allSpaced = await prisma.spacedRepetition.findMany({
      where: { userId },
      include: {
        concept: {
          include: {
            subDomain: {
              include: { track: true },
            },
          },
        },
      },
      orderBy: { nextReviewAt: "asc" },
    });

    // Calculate stats
    const now = new Date();
    const dueEntries = allSpaced.filter((s) => s.nextReviewAt <= now);
    const upcomingEntries = allSpaced.filter((s) => s.nextReviewAt > now);
    const totalEntries = allSpaced.length;

    // Group by track
    const trackGroups: Record<string, { name: string; icon: string; color: string; due: number; upcoming: number; total: number }> = {};
    for (const s of allSpaced) {
      const track = s.concept.subDomain.track;
      if (!trackGroups[track.id]) {
        trackGroups[track.id] = { name: track.name, icon: track.icon, color: track.color, due: 0, upcoming: 0, total: 0 };
      }
      trackGroups[track.id].total++;
      if (s.nextReviewAt <= now) trackGroups[track.id].due++;
      else trackGroups[track.id].upcoming++;
    }

    // Review history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAnswers = await prisma.answerLog.findMany({
      where: {
        quizAttempt: { userId },
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        question: { select: { conceptId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Build daily review stats
    const dailyReviews: Record<string, { total: number; correct: number }> = {};
    for (const a of recentAnswers) {
      const day = a.createdAt.toISOString().split("T")[0];
      if (!dailyReviews[day]) dailyReviews[day] = { total: 0, correct: 0 };
      dailyReviews[day].total++;
      if (a.isCorrect) dailyReviews[day].correct++;
    }

    // Retention stats
    const totalReviewed = recentAnswers.length;
    const correctReviewed = recentAnswers.filter((a) => a.isCorrect).length;
    const retentionRate = totalReviewed > 0 ? Math.round((correctReviewed / totalReviewed) * 100) : 0;

    // Interval distribution
    const intervalBuckets = { "1-3d": 0, "4-7d": 0, "8-14d": 0, "15-30d": 0, "30d+": 0 };
    for (const s of allSpaced) {
      if (s.interval <= 3) intervalBuckets["1-3d"]++;
      else if (s.interval <= 7) intervalBuckets["4-7d"]++;
      else if (s.interval <= 14) intervalBuckets["8-14d"]++;
      else if (s.interval <= 30) intervalBuckets["15-30d"]++;
      else intervalBuckets["30d+"]++;
    }

    // Format due concepts
    const dueConcepts = filter === "due" || filter === "all"
      ? (filter === "due" ? dueEntries : allSpaced).slice(0, 50).map((s) => ({
          id: s.id,
          conceptId: s.concept.id,
          conceptName: s.concept.name,
          subDomain: s.concept.subDomain.name,
          trackName: s.concept.subDomain.track.name,
          trackIcon: s.concept.subDomain.track.icon,
          trackColor: s.concept.subDomain.track.color,
          interval: s.interval,
          easeFactor: Math.round(s.easeFactor * 100) / 100,
          nextReviewAt: s.nextReviewAt.toISOString(),
          due: s.nextReviewAt <= now,
        }))
      : [];

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalEntries,
          dueEntries: dueEntries.length,
          upcomingEntries: upcomingEntries.length,
          retentionRate,
          totalReviewed,
          correctReviewed,
        },
        dueConcepts,
        trackGroups: Object.values(trackGroups),
        dailyReviews,
        intervalBuckets,
      },
    });
  } catch (error) {
    console.error("Spaced repetition API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
