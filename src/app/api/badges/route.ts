import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/badges — List all badges with user's progress and earned status
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;

    // Fetch all badges
    const allBadges = await prisma.badge.findMany({
      orderBy: { createdAt: "asc" },
    });

    // Fetch user's progress on each badge
    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
    });

    const userBadgeMap = new Map(userBadges.map((ub) => [ub.badgeId, ub]));

    // Gather stats for auto-calculating progress
    const [quizCount, conceptMasteredCount, allMasteryScores, challengePassed] = await Promise.all([
      // Total completed quizzes
      prisma.quizAttempt.count({
        where: { userId, completed: true },
      }),
      // Concepts with 90%+ mastery
      prisma.masteryScore.count({
        where: { userId, score: { gte: 90 } },
      }),
      // All mastery scores for track stats and overall score
      prisma.masteryScore.findMany({
        where: { userId },
        include: { concept: { include: { subDomain: { include: { track: true } } } } },
      }),
      // Code challenges passed
      prisma.challengeSubmission.count({
        where: { userId, passed: true },
      }),
    ]);

    // Build track-level stats for polyglot/full-stack badges
    const trackMasteryMap = new Map<string, { name: string; totalScore: number; count: number }>();
    for (const ms of allMasteryScores) {
      const track = ms.concept.subDomain.track;
      const existing = trackMasteryMap.get(track.id) || { name: track.name, totalScore: 0, count: 0 };
      existing.totalScore += ms.score;
      existing.count++;
      trackMasteryMap.set(track.id, existing);
    }

    const trackAvgScores = Array.from(trackMasteryMap.values()).map((t) => ({
      name: t.name,
      avgScore: t.count > 0 ? t.totalScore / t.count : 0,
    }));

    const tracksAbove50 = trackAvgScores.filter((t) => t.avgScore >= 50).length;
    const tracksAbove70 = trackAvgScores.filter((t) => t.avgScore >= 70).length;
    const totalTracksWithQuizzes = trackAvgScores.length;

    // Compute progress and earned status for each badge
    const results = await Promise.all(
      allBadges.map(async (badge) => {
        let progress = 0;
        let earned = false;
        let earnedAt: string | null = null;

        const ub = userBadgeMap.get(badge.id);

        switch (badge.name) {
          // Quiz badges
          case "First Quiz":
            progress = Math.min(quizCount, badge.maxProgress);
            earned = quizCount >= badge.maxProgress;
            break;
          case "Quiz Whiz":
            progress = Math.min(quizCount, badge.maxProgress);
            earned = quizCount >= badge.maxProgress;
            break;
          case "Quiz Master":
            progress = Math.min(quizCount, badge.maxProgress);
            earned = quizCount >= badge.maxProgress;
            break;
          case "Century Club":
            progress = Math.min(quizCount, badge.maxProgress);
            earned = quizCount >= badge.maxProgress;
            break;
          case "Challenge Accepted":
            progress = Math.min(challengePassed, badge.maxProgress);
            earned = challengePassed >= badge.maxProgress;
            break;

          // Mastery badges
          case "Perfect Score":
            // Check if any quiz attempt had 100% score
            const perfectQuiz = await prisma.quizAttempt.findFirst({
              where: { userId, completed: true, score: 100 },
            });
            progress = perfectQuiz ? 1 : 0;
            earned = !!perfectQuiz;
            break;
          case "Concept Master":
            progress = Math.min(conceptMasteredCount, badge.maxProgress);
            earned = conceptMasteredCount >= badge.maxProgress;
            break;
          case "Tier Climber":
            // Check user's tier
            const user = await prisma.user.findUnique({
              where: { id: userId },
              include: { tier: true },
            });
            const specialistMinScore = 40; // Specialist tier minimum
            const overallScore = allMasteryScores.length > 0
              ? allMasteryScores.reduce((s, ms) => s + ms.score, 0) / allMasteryScores.length
              : 0;
            progress = Math.min(Math.round(overallScore / specialistMinScore * 100), 100);
            earned = overallScore >= specialistMinScore;
            break;

          // Streak badges — use consecutive day activity counts
          case "Streak Starter": {
            const activeDays = await countRecentActiveDays(userId, 30);
            const hasStreak3 = activeDays >= 3;
            progress = hasStreak3 ? 1 : Math.min(activeDays, 3);
            earned = hasStreak3;
            break;
          }
          case "Streak Warrior": {
            const activeDays = await countRecentActiveDays(userId, 30);
            const hasStreak7 = activeDays >= 7;
            progress = hasStreak7 ? 1 : Math.min(activeDays, 7);
            earned = hasStreak7;
            break;
          }
          case "Streak Legend": {
            const activeDays = await countRecentActiveDays(userId, 30);
            const hasStreak30 = activeDays >= 30;
            progress = hasStreak30 ? 1 : Math.min(activeDays, 30);
            earned = hasStreak30;
            break;
          }
          case "Perfect Week":
            // Check for 7+ unique active days in the last 7 days
            const recentWeekDays = await countRecentActiveDays(userId, 7);
            progress = Math.min(recentWeekDays, badge.maxProgress);
            earned = recentWeekDays >= badge.maxProgress;
            break;

          // Special badges
          case "Polyglot":
            progress = Math.min(tracksAbove50, badge.maxProgress);
            earned = tracksAbove50 >= badge.maxProgress;
            break;
          case "Full Stack":
            progress = Math.min(tracksAbove70, badge.maxProgress);
            earned = tracksAbove70 >= badge.maxProgress;
            break;
          case "Early Adopter":
            // Check if user created account within first 30 days of platform
            const userInfo = await prisma.user.findUnique({
              where: { id: userId },
              select: { createdAt: true },
            });
            const earlyThreshold = new Date("2026-02-01");
            earned = userInfo ? userInfo.createdAt <= earlyThreshold : false;
            progress = earned ? 1 : 0;
            break;
          case "Knowledge Seeker":
            // Quizzed in all 6+ tracks
            progress = Math.min(totalTracksWithQuizzes, badge.maxProgress);
            earned = totalTracksWithQuizzes >= badge.maxProgress;
            break;

          // Social badges (follow-based)
          case "Helping Hand": {
            const followingCount = await prisma.follow.count({
              where: { followerId: userId },
            });
            progress = Math.min(followingCount, badge.maxProgress);
            earned = followingCount >= badge.maxProgress;
            break;
          }
          case "Social Butterfly": {
            const followerCount = await prisma.follow.count({
              where: { followingId: userId },
            });
            progress = Math.min(followerCount, badge.maxProgress);
            earned = followerCount >= badge.maxProgress;
            break;
          }

          default:
            // Use existing progress if badge not auto-computable
            progress = ub?.progress || 0;
            earned = ub?.earned || false;
        }

        // Auto-mark as earned and update DB if progress meets target
        if (earned && (!ub || !ub.earned)) {
          const updated = await prisma.userBadge.upsert({
            where: {
              userId_badgeId: { userId, badgeId: badge.id },
            },
            create: {
              userId,
              badgeId: badge.id,
              progress: Math.min(progress, badge.maxProgress),
              earned: true,
              earnedAt: new Date(),
            },
            update: {
              progress: Math.min(progress, badge.maxProgress),
              earned: true,
              earnedAt: earned ? new Date() : undefined,
            },
          });
          earnedAt = updated.earnedAt?.toISOString() || new Date().toISOString();
        } else if (ub) {
          earnedAt = ub.earnedAt?.toISOString() || null;
        }

        return {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          color: badge.color,
          category: badge.category,
          criteria: badge.criteria,
          maxProgress: badge.maxProgress,
          progress: Math.min(progress, badge.maxProgress),
          earned,
          earnedAt,
          progressPercent: badge.maxProgress > 0
            ? Math.round((Math.min(progress, badge.maxProgress) / badge.maxProgress) * 100)
            : earned ? 100 : 0,
        };
      })
    );

    // Sort: earned first, then by progress descending, then by category
    results.sort((a, b) => {
      if (a.earned !== b.earned) return a.earned ? -1 : 1;
      if (a.progressPercent !== b.progressPercent) return b.progressPercent - a.progressPercent;
      return a.category.localeCompare(b.category);
    });

    const earnedCount = results.filter((r) => r.earned).length;
    const totalCount = results.length;

    // Group by category
    const grouped = results.reduce(
      (acc, badge) => {
        const cat = badge.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(badge);
        return acc;
      },
      {} as Record<string, typeof results>
    );

    return NextResponse.json({
      success: true,
      data: {
        badges: results,
        grouped,
        stats: {
          earnedCount,
          totalCount,
          completionPercent: totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0,
        },
      },
    });
  } catch (error) {
    console.error("Badges API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

/** Count how many unique days the user was active in the last N days */
async function countRecentActiveDays(userId: string, days: number): Promise<number> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  const logs = await prisma.answerLog.findMany({
    where: {
      quizAttempt: { userId },
      createdAt: { gte: since },
    },
    select: { createdAt: true },
  });
  const uniqueDays = new Set(logs.map((a) => a.createdAt.toISOString().split("T")[0]));
  return uniqueDays.size;
}
