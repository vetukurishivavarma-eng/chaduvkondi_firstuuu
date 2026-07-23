import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateMasteryScore, calculateSpacedRepetitionInterval } from "@/lib/utils";

// ─── Mood-Based Meme Reactions ────────────────────────────────────────────────
const MOOD_MEMES: Record<string, { correct: string[]; wrong: string[]; encouragement: string[] }> = {
  hype: {
    correct: [
      "LET'S GOOOOO! 🔥 YOU'RE ON FIRE!",
      "ABSOLUTE LEGEND! 💪 THAT'S HOW IT'S DONE!",
      "BOOM! Headshot! 🎯 You're unstoppable!",
      "MAIN CHARACTER ENERGY! ⚡ Keep crushing it!",
      "EAT. SLEEP. CODE. REPEAT. ✅ NAILED IT!",
    ],
    wrong: [
      "NOT TODAY! But we GO AGANE! 🔄 You got this!",
      "It's just a setback for the COMEBACK! 💥",
      "Even LeBron misses shots. NEXT ONE'S YOURS! 🏀",
      "ERROR 404: Correct answer not found. TRY AGAIN! 🔧",
    ],
    encouragement: [
      "KEEP THAT ENERGY UP! 🚀",
      "YOU'RE BUILDING SOMETHING GREAT! 🏗️",
      "HUSTLE MODE: ACTIVATED! ⚡",
    ],
  },
  chill: {
    correct: [
      "No worries, you got this 🌊 Smooth sailing.",
      "Easy peasy lemon squeezy 🍋",
      "Vibes are immaculate ✨ Nailed it.",
      "Just another day of being awesome 😎",
      "Smooth operator right here 🎵",
    ],
    wrong: [
      "All good, that's what learning's about 🌱",
      "Take a breath, it's part of the journey 🧘",
      "Mistakes are just proof you're trying ✌️",
      "No stress — the next one's yours 🎯",
    ],
    encouragement: [
      "Stay in your flow state 🌊",
      "Progress, not perfection 🌱",
      "Good vibes only, keep going ✨",
    ],
  },
  focused: {
    correct: [
      "Target acquired ✅ Direct hit!",
      "Precision execution. Well calculated. 🎯",
      "Another concept conquered. 📈",
      "System: Optimized. Result: Correct. 🤖",
      "Locked in. Loaded. Correct. 🎯",
    ],
    wrong: [
      "Re-calibrating... Let's analyze this. 🔍",
      "Data point collected. Adjusting strategy. 📊",
      "Noted. This gap will be filled. ⚡",
      "Logging error for future reference. 📝",
    ],
    encouragement: [
      "Maintaining optimal learning trajectory 📈",
      "Efficiency is key. You're building knowledge. 🧠",
      "Stay locked in. Mastery incoming. 🎯",
    ],
  },
  tired: {
    correct: [
      "Coffee-powered brain still works! ☕✅",
      "Tired but TALENTED! 😴💪",
      "Sleep is for the weak. (But go to bed anyway) 🛌",
      "Somehow... someway... you got it right! 🎉",
      "Fourth cup of coffee energy! ☕☕☕☕",
    ],
    wrong: [
      "Brain fog is real 🌫️ Take a break maybe?",
      "Maybe refill that coffee first ☕",
      "It's okay, your CPU needs rest too 💤",
      "Sleep > Code. But also... try again? 😅",
    ],
    encouragement: [
      "You're doing great for someone running on fumes 💪",
      "Rest is productive too! But you're still going! 🌟",
      "Power nap energy coming soon! ⚡",
    ],
  },
  stressed: {
    correct: [
      "Wait... you actually got that right! NICE! 😅✅",
      "CRUSHED IT under pressure! 🏆",
      "Imposter syndrome who? YOU BELONG HERE! 💪",
      "The stress is working! (But please take breaks) 🧘",
      "ONE LESS THING TO WORRY ABOUT! 🎉",
    ],
    wrong: [
      "Breathe in... breathe out... you're learning 🧘",
      "This is just part of the process. You're okay. 🌿",
      "Rome wasn't built in a day. Neither is mastery. 🏛️",
      "It's okay to not know everything. That's why we're here. 🤗",
    ],
    encouragement: [
      "You're doing better than you think. Trust the process. 🌟",
      "Small steps compound. You've got this. 🐢",
      "Be kind to yourself. Learning IS progress. 🌱",
    ],
  },
  confused: {
    correct: [
      "Wait, you got it right? NICE! 🤯✅",
      "The confusion cleared! Look at you go! 🌟",
      "It's starting to click! 🖱️🤯",
      "Light bulb moment! 💡 You got it!",
      "From 'what?' to 'aha!' in record time! ⚡",
    ],
    wrong: [
      "Yeah, this stuff IS confusing. Let's break it down. 🧩",
      "Welcome to the confusion club. We have snacks. 🍪",
      "If it's confusing, that means you're learning something new! 🧠",
      "The fog will clear. Keep pushing! 🌫️➡️☀️",
    ],
    encouragement: [
      "Confusion is the first step to understanding! 🧠",
      "Every expert was once confused. Keep going! 🌟",
      "The dots will connect. Trust the process. 🔗",
    ],
  },
};

function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

function getMoodReaction(mood: string, isCorrect: boolean): { message: string; emoji: string } {
  const moodMemes = MOOD_MEMES[mood] || MOOD_MEMES.chill;
  if (isCorrect) {
    return {
      message: getRandomMessage(moodMemes.correct),
      emoji: mood === "hype" ? "🔥" : mood === "chill" ? "✨" : mood === "tired" ? "😴" : mood === "stressed" ? "😅" : mood === "confused" ? "🤯" : "✅",
    };
  }
  return {
    message: getRandomMessage(moodMemes.wrong),
    emoji: mood === "hype" ? "💪" : mood === "chill" ? "🌱" : mood === "tired" ? "☕" : mood === "stressed" ? "🧘" : mood === "confused" ? "🧩" : "💪",
  };
}

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
    const { questionId, choiceId, timeSpent } = await request.json();

    // Get the quiz attempt
    const quizAttempt = await prisma.quizAttempt.findUnique({
      where: { id },
    });

    if (!quizAttempt || quizAttempt.userId !== session.id) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
    }

    // Get the question and correct choice
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        choices: true,
        concept: {
          include: {
            subDomain: true,
            resources: { take: 3 },
          },
        },
      },
    });

    if (!question) {
      return NextResponse.json({ success: false, error: "Question not found" }, { status: 404 });
    }

    const selectedChoice = question.choices.find((c) => c.id === choiceId);
    if (!selectedChoice) {
      return NextResponse.json({ success: false, error: "Invalid choice" }, { status: 400 });
    }

    const isCorrect = selectedChoice.isCorrect;

    // Record the answer
    await prisma.answerLog.create({
      data: {
        quizAttemptId: id,
        questionId,
        choiceId,
        isCorrect,
        timeSpent: timeSpent ? Math.round(timeSpent) : null,
      },
    });

    // Update or create mastery score for this concept
    const existingMastery = await prisma.masteryScore.findUnique({
      where: {
        userId_conceptId: {
          userId: session.id,
          conceptId: question.conceptId,
        },
      },
    });

    if (existingMastery) {
      const newAttempts = existingMastery.attempts + 1;
      const newCorrect = existingMastery.correctCount + (isCorrect ? 1 : 0);
      const newScore = calculateMasteryScore(newCorrect, newAttempts, existingMastery.lastTestedAt);

      await prisma.masteryScore.update({
        where: { id: existingMastery.id },
        data: {
          attempts: newAttempts,
          correctCount: newCorrect,
          score: newScore,
          lastTestedAt: new Date(),
        },
      });
    } else {
      const newScore = calculateMasteryScore(isCorrect ? 1 : 0, 1, new Date());
      await prisma.masteryScore.create({
        data: {
          userId: session.id,
          conceptId: question.conceptId,
          score: newScore,
          attempts: 1,
          correctCount: isCorrect ? 1 : 0,
          lastTestedAt: new Date(),
        },
      });
    }

    // Update spaced repetition
    const existingSpaced = await prisma.spacedRepetition.findUnique({
      where: {
        userId_conceptId: {
          userId: session.id,
          conceptId: question.conceptId,
        },
      },
    });

    if (isCorrect) {
      if (existingSpaced) {
        const { newInterval, newEaseFactor } = calculateSpacedRepetitionInterval(
          existingSpaced.interval,
          existingSpaced.easeFactor,
          true
        );

        const nextReviewAt = new Date();
        nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

        await prisma.spacedRepetition.update({
          where: { id: existingSpaced.id },
          data: {
            interval: newInterval,
            easeFactor: newEaseFactor,
            nextReviewAt,
          },
        });
      } else {
        const nextReviewAt = new Date();
        nextReviewAt.setDate(nextReviewAt.getDate() + 1);

        await prisma.spacedRepetition.create({
          data: {
            userId: session.id,
            conceptId: question.conceptId,
            interval: 1,
            easeFactor: 2.5,
            nextReviewAt,
          },
        });
      }
    } else {
      // Reset interval for incorrect answer
      const nextReviewAt = new Date();
      nextReviewAt.setMinutes(nextReviewAt.getMinutes() + 10); // Review in 10 minutes

      if (existingSpaced) {
        const { newInterval, newEaseFactor } = calculateSpacedRepetitionInterval(
          existingSpaced.interval,
          existingSpaced.easeFactor,
          false
        );

        await prisma.spacedRepetition.update({
          where: { id: existingSpaced.id },
          data: {
            interval: newInterval,
            easeFactor: newEaseFactor,
            nextReviewAt,
          },
        });
      } else {
        await prisma.spacedRepetition.create({
          data: {
            userId: session.id,
            conceptId: question.conceptId,
            interval: 1,
            easeFactor: 2.5,
            nextReviewAt,
          },
        });
      }
    }

    // Update tier based on overall mastery
    await updateUserTier(session.id);

    // Determine next question difficulty adjustment
    const masteryScore = await prisma.masteryScore.findUnique({
      where: {
        userId_conceptId: {
          userId: session.id,
          conceptId: question.conceptId,
        },
      },
    });

    const difficultyAdjustment = isCorrect ? 0.1 : -0.1;

    // Get remediation resources if wrong
    const remediation = isCorrect
      ? null
      : question.concept.resources.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description,
          url: r.url,
          type: r.type,
        }));

    // ─── Mood-based meme reaction ───────────────────────────────────────
    const userWithMood = await prisma.user.findUnique({
      where: { id: session.id },
      select: { mood: true },
    });
    const userMood = userWithMood?.mood || "chill";
    const moodReaction = getMoodReaction(userMood, isCorrect);

    return NextResponse.json({
      success: true,
      data: {
        isCorrect,
        explanation: question.explanation,
        correctChoice: question.choices.find((c) => c.isCorrect)?.text || "",
        conceptName: question.concept.name,
        subDomain: question.concept.subDomain.name,
        currentMastery: masteryScore?.score || 0,
        difficultyAdjustment,
        remediation,
        moodReaction,
        nextReviewAt: await getNextReviewAt(session.id, question.conceptId),
      },
    });
  } catch (error) {
    console.error("Quiz answer error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

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

    const quizAttempt = await prisma.quizAttempt.findUnique({
      where: { id },
      include: {
        answerLogs: {
          include: {
            question: {
              include: {
                concept: true,
                choices: true,
              },
            },
            choice: true,
          },
        },
      },
    });

    if (!quizAttempt || quizAttempt.userId !== session.id) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
    }

    const correctCount = quizAttempt.answerLogs.filter((a) => a.isCorrect).length;
    const totalCount = quizAttempt.answerLogs.length;
    const score = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        id: quizAttempt.id,
        type: quizAttempt.type,
        completed: quizAttempt.completed,
        score: Math.round(score),
        correctCount,
        totalCount,
        startedAt: quizAttempt.startedAt,
        completedAt: quizAttempt.completedAt,
        answers: quizAttempt.answerLogs.map((a) => ({
          questionId: a.questionId,
          questionText: a.question.text,
          explanation: a.question.explanation,
          isCorrect: a.isCorrect,
          selectedChoice: a.choice.text,
          correctChoice: a.question.choices.find((c) => c.isCorrect)?.text || "",
          conceptName: a.question.concept.name,
        })),
      },
    });
  } catch (error) {
    console.error("Quiz results error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const quizAttempt = await prisma.quizAttempt.findUnique({
      where: { id },
      include: { answerLogs: true },
    });

    if (!quizAttempt || quizAttempt.userId !== session.id) {
      return NextResponse.json({ success: false, error: "Quiz not found" }, { status: 404 });
    }

    const correctCount = quizAttempt.answerLogs.filter((a) => a.isCorrect).length;
    const totalWeight = quizAttempt.answerLogs.reduce(
      (sum, a) => sum + (a.isCorrect ? 1 : 0),
      0
    );

    await prisma.quizAttempt.update({
      where: { id },
      data: {
        completed: true,
        completedAt: new Date(),
        score: quizAttempt.answerLogs.length > 0
          ? (correctCount / quizAttempt.answerLogs.length) * 100
          : 0,
        totalWeight,
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: "Quiz completed" },
    });
  } catch (error) {
    console.error("Quiz complete error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

async function updateUserTier(userId: string) {
  const masteryScores = await prisma.masteryScore.findMany({ where: { userId } });
  const totalScore = masteryScores.reduce((sum, ms) => sum + ms.score, 0);
  const overallScore = masteryScores.length > 0 ? totalScore / masteryScores.length : 0;

  const tiers = await prisma.tierDefinition.findMany({ orderBy: { minScore: "desc" } });

  let newTierId: string | null = null;
  for (const tier of tiers) {
    if (overallScore >= tier.minScore) {
      newTierId = tier.id;
      break;
    }
  }

  if (newTierId) {
    await prisma.user.update({
      where: { id: userId },
      data: { tierId: newTierId },
    });
  }
}

async function getNextReviewAt(userId: string, conceptId: string): Promise<string | null> {
  const spaced = await prisma.spacedRepetition.findUnique({
    where: {
      userId_conceptId: { userId, conceptId },
    },
  });
  return spaced?.nextReviewAt.toISOString() || null;
}
