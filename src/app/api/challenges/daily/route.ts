import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/challenges/daily — Get today's challenge + user progress
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;

    // Get or create today's challenge
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let challenge = await prisma.dailyChallenge.findFirst({
      where: { date: today, isActive: true },
    });

    // If no challenge for today, create one (cycling through types)
    if (!challenge) {
      const challengeTypes = [
        { title: "Quiz Marathon", description: "Answer 10 questions today", type: "quiz", target: 10, reward: 100, icon: "🧠" },
        { title: "Perfect Score", description: "Get 100% on a quiz", type: "perfect_score", target: 1, reward: 150, icon: "⭐" },
        { title: "Streak Saver", description: "Complete 3 quizzes today", type: "quiz_count", target: 3, reward: 75, icon: "🔥" },
        { title: "Concept Explorer", description: "Master 2 new concepts", type: "concepts", target: 2, reward: 120, icon: "📚" },
        { title: "Speed Round", description: "Answer 15 questions", type: "quiz", target: 15, reward: 130, icon: "⚡" },
        { title: "Focus Session", description: "Complete a diagnostic quiz", type: "diagnostic", target: 1, reward: 200, icon: "🎯" },
        { title: "Beat Your Best ⚡", description: "Beat your personal best Q/min in a speed test", type: "speed_test_beat_best", target: 1, reward: 250, icon: "🏆" },
      ];

      // Cycle based on day of year
      const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
      const typeIndex = dayOfYear % challengeTypes.length;
      const ct = challengeTypes[typeIndex];

      // For speed test beat best challenges, show the user's current best in the description
      let challengeDescription = ct.description;
      if (ct.type === "speed_test_beat_best") {
        const allSpeedAttempts = await prisma.quizAttempt.findMany({
          where: {
            userId,
            type: "speed_test",
            completed: true,
          },
          include: { answerLogs: { select: { isCorrect: true } } },
        });
        const bestHistorical = allSpeedAttempts
          .filter((a) => a.completedAt && a.completedAt < today)
          .reduce((best, a) => {
            const answered = a.answerLogs.length;
            if (answered === 0) return best;
            const qpm = answered * 2;
            return qpm > best ? qpm : best;
          }, 0);
        if (bestHistorical > 0) {
          challengeDescription = `Beat your personal best of ${bestHistorical} Q/min in a speed test!`;
        }
      }

      challenge = await prisma.dailyChallenge.create({
        data: {
          date: today,
          title: ct.title,
          description: challengeDescription,
          type: ct.type,
          target: ct.target,
          reward: ct.reward,
          icon: ct.icon,
        },
      });
    }

    // Get user's progress on today's challenge
    let userProgress = await prisma.userDailyChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId: challenge.id } },
    });

    if (!userProgress) {
      userProgress = await prisma.userDailyChallenge.create({
        data: { userId, challengeId: challenge.id },
      });
    }

    // Auto-calculate progress if not completed yet
    if (!userProgress.completed) {
      let progress = 0;
      const todayStart = new Date(today);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);

      switch (challenge.type) {
        case "quiz":
        case "quiz_count": {
          const count = await prisma.quizAttempt.count({
            where: {
              userId,
              completed: true,
              completedAt: { gte: todayStart, lte: todayEnd },
            },
          });
          progress = challenge.type === "quiz" ? count * 3 : count; // Each quiz = ~3 questions
          break;
        }
        case "perfect_score": {
          const perfect = await prisma.quizAttempt.count({
            where: {
              userId,
              completed: true,
              completedAt: { gte: todayStart, lte: todayEnd },
              score: 100,
            },
          });
          progress = perfect;
          break;
        }
        case "concepts": {
          const masteredToday = await prisma.masteryScore.count({
            where: {
              userId,
              score: { gte: 80 },
              updatedAt: { gte: todayStart, lte: todayEnd },
            },
          });
          progress = masteredToday;
          break;
        }
        case "diagnostic": {
          const diagCount = await prisma.quizAttempt.count({
            where: {
              userId,
              type: "diagnostic",
              completed: true,
              completedAt: { gte: todayStart, lte: todayEnd },
            },
          });
          progress = diagCount;
          break;
        }
        case "speed_test_beat_best": {
          // Get all speed test attempts ever
          const allSpeedAttempts = await prisma.quizAttempt.findMany({
            where: {
              userId,
              type: "speed_test",
              completed: true,
            },
            include: { answerLogs: { select: { isCorrect: true } } },
          });

          // Best Q/min from today
          const todayBestQpm = allSpeedAttempts
            .filter((a) => a.completedAt && a.completedAt >= todayStart && a.completedAt <= todayEnd)
            .reduce((best, a) => {
              const answered = a.answerLogs.length;
              if (answered === 0) return best;
              const qpm = answered * 2;
              return qpm > best ? qpm : best;
            }, 0);

          // Best Q/min before today
          const historicalBestQpm = allSpeedAttempts
            .filter((a) => !a.completedAt || a.completedAt < todayStart)
            .reduce((best, a) => {
              const answered = a.answerLogs.length;
              if (answered === 0) return best;
              const qpm = answered * 2;
              return qpm > best ? qpm : best;
            }, 0);

          // Beat their best if today's best > historical best
          if (todayBestQpm > historicalBestQpm) {
            progress = 1;
          } else if (todayBestQpm > 0 && historicalBestQpm === 0) {
            // First speed test ever — that counts as beating your best!
            progress = 1;
          }
          break;
        }
      }

      const completed = progress >= challenge.target;

      if (progress !== userProgress.progress || completed !== userProgress.completed) {
        userProgress = await prisma.userDailyChallenge.update({
          where: { id: userProgress.id },
          data: {
            progress,
            completed,
            completedAt: completed ? new Date() : null,
          },
        });
      }
    }

    // Calculate all today's quiz activity for the streak display
    const todayStart = new Date(today);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todayAttempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        completed: true,
        completedAt: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { completedAt: "desc" },
      select: { id: true, score: true, type: true },
    });

    const quizzesToday = todayAttempts.length;
    const questionsAnswered = todayAttempts.length * 3; // rough estimate

    return NextResponse.json({
      success: true,
      data: {
        challenge: {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          type: challenge.type,
          target: challenge.target,
          reward: challenge.reward,
          icon: challenge.icon,
        },
        progress: userProgress.progress,
        completed: userProgress.completed,
        claimed: userProgress.claimed,
        stats: {
          quizzesToday,
          questionsAnswered,
        },
      },
    });
  } catch (error) {
    console.error("Daily challenge error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/challenges/daily — Claim challenge reward
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;
    const body = await request.json();
    const { challengeId } = body;

    const progress = await prisma.userDailyChallenge.findUnique({
      where: { userId_challengeId: { userId, challengeId } },
    });

    if (!progress) {
      return NextResponse.json({ success: false, error: "Challenge not found" }, { status: 404 });
    }

    if (!progress.completed) {
      return NextResponse.json({ success: false, error: "Challenge not completed yet" }, { status: 400 });
    }

    if (progress.claimed) {
      return NextResponse.json({ success: false, error: "Reward already claimed" }, { status: 400 });
    }

    // Claim the reward — mark as claimed
    await prisma.userDailyChallenge.update({
      where: { id: progress.id },
      data: { claimed: true, claimedAt: new Date() },
    });

    // Also update the user's streak badge progress
    const challenge = await prisma.dailyChallenge.findUnique({ where: { id: challengeId } });

    return NextResponse.json({
      success: true,
      data: {
        message: `Reward claimed! +${challenge?.reward || 50} XP`,
        reward: challenge?.reward || 50,
      },
    });
  } catch (error) {
    console.error("Claim challenge error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
