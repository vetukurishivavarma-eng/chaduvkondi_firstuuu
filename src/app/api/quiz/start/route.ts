import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface QuestionWithRelations {
  id: string;
  text: string;
  difficultyWeight: number;
  explanation: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  conceptId: string;
  concept: {
    id: string;
    name: string;
    subDomain: {
      name: string;
    } | null;
  };
  choices: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { type = "practice", conceptIds, count = 10, trackId } = body;

    // Validate quiz type
    if (!["diagnostic", "practice", "spaced_repetition", "code_challenge"].includes(type)) {
      return NextResponse.json({ success: false, error: "Invalid quiz type" }, { status: 400 });
    }

    let questions: QuestionWithRelations[] = [];

    if (type === "spaced_repetition") {
      // Get due concepts for spaced repetition
      const dueSpaced = await prisma.spacedRepetition.findMany({
        where: {
          userId: session.id,
          nextReviewAt: { lte: new Date() },
        },
        include: {
          concept: {
            include: {
              questions: {
                where: { isActive: true },
                include: {
                  choices: { orderBy: { text: "asc" } },
                  concept: { include: { subDomain: true } },
                },
                orderBy: { difficultyWeight: "asc" },
                take: 2,
              },
            },
          },
        },
      });

      questions = dueSpaced.flatMap((s) => s.concept.questions).slice(0, count) as unknown as QuestionWithRelations[];
    } else if (conceptIds && conceptIds.length > 0) {
      // Specific concepts
      questions = (await prisma.question.findMany({
        where: {
          conceptId: { in: conceptIds },
          isActive: true,
        },
        include: {
          choices: { orderBy: { text: "asc" } },
          concept: { include: { subDomain: true } },
        },
        orderBy: { difficultyWeight: "asc" },
        take: count,
      })) as unknown as QuestionWithRelations[];
    } else {
      // Build filter for questions - optionally filter by track
      const trackFilter = trackId ? { concept: { subDomain: { trackId } } } : {};
      // Select questions based on weakest concepts (mastery-based adaptive)
      const masteryScores = await prisma.masteryScore.findMany({
        where: { userId: session.id },
        orderBy: { score: "asc" },
        include: {
          concept: {
            include: {
              subDomain: { select: { name: true, trackId: true } },
              questions: {
                where: { isActive: true },
                include: {
                  choices: { orderBy: { text: "asc" } },
                  concept: { include: { subDomain: { select: { name: true, trackId: true } } } },
                },
                take: 3,
              },
            },
          },
        },
      });

      // Collect questions from weakest concepts first
      const questionIds = new Set<string>();
      const collectedQuestions: QuestionWithRelations[] = [];

      for (const ms of masteryScores) {
        // Skip if track filter is active and concept doesn't belong to the track
        if (trackId && ms.concept.subDomain?.trackId !== trackId) continue;
        for (const q of ms.concept.questions) {
          if (!questionIds.has(q.id)) {
            questionIds.add(q.id);
            collectedQuestions.push(q as unknown as QuestionWithRelations);
          }
        }
      }

      // Fill remaining from untested concepts
      if (collectedQuestions.length < count) {
        const testedConceptIds = masteryScores.map((ms) => ms.conceptId);
        const untestedWhere: any = {
          conceptId: { notIn: testedConceptIds },
          isActive: true,
        };
        if (trackId) {
          untestedWhere.concept = { subDomain: { trackId } };
        }
        const untestedQuestions = await prisma.question.findMany({
          where: untestedWhere,
          include: {
            choices: { orderBy: { text: "asc" } },
            concept: { include: { subDomain: true } },
          },
          orderBy: { difficultyWeight: "asc" },
          take: count - collectedQuestions.length,
        });

        for (const q of untestedQuestions) {
          if (!questionIds.has(q.id)) {
            questionIds.add(q.id);
            collectedQuestions.push(q as unknown as QuestionWithRelations);
          }
        }
      }

      // If still not enough, get random questions
      if (collectedQuestions.length < count) {
        const remainingCount = count - collectedQuestions.length;
        const existingIds = Array.from(questionIds);
        const randomWhere: any = {
          id: { notIn: existingIds },
          isActive: true,
        };
        if (trackId) {
          randomWhere.concept = { subDomain: { trackId } };
        }
        const randomQuestions = await prisma.question.findMany({
          where: randomWhere,
          take: remainingCount,
          orderBy: { difficultyWeight: "asc" },
          include: {
            choices: { orderBy: { text: "asc" } },
            concept: { include: { subDomain: true } },
          },
        });

        for (const q of randomQuestions) {
          if (!questionIds.has(q.id)) {
            questionIds.add(q.id);
            collectedQuestions.push(q as unknown as QuestionWithRelations);
          }
        }
      }

      questions = collectedQuestions;
    }

    if (questions.length === 0) {
      return NextResponse.json(
        { success: false, error: "No questions available. Please contact an admin." },
        { status: 404 }
      );
    }

    // Create quiz attempt with optional track
    const quizAttempt = await prisma.quizAttempt.create({
      data: {
        userId: session.id,
        trackId: trackId || undefined,
        type: type as any,
        completed: false,
      },
    });

    // Shuffle questions
    const shuffled = [...questions].sort(() => Math.random() - 0.5).slice(0, Math.min(count, questions.length));

    // Return questions without correct answer
    const quizQuestions = shuffled.map((q) => ({
      id: q.id,
      text: q.text,
      difficultyWeight: q.difficultyWeight,
      explanation: q.explanation,
      concept: {
        id: q.concept.id,
        name: q.concept.name,
        subDomain: q.concept.subDomain?.name || "",
      },
      choices: (q.choices || []).map((c) => ({
        id: c.id,
        text: c.text,
      })),
    }));

    return NextResponse.json({
      success: true,
      data: {
        quizId: quizAttempt.id,
        type,
        questions: quizQuestions,
        totalQuestions: quizQuestions.length,
      },
    });
  } catch (error) {
    console.error("Quiz start error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
