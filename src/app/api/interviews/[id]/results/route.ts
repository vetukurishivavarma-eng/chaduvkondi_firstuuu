import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";

// GET /api/interviews/[id]/results — Get detailed results for a completed interview
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;

    const interview = await prisma.mockInterview.findUnique({
      where: { id },
      include: {
        company: { select: { name: true, slug: true, logoUrl: true } },
        problems: {
          include: {
            problem: {
              select: { title: true, slug: true, difficulty: true, solutionPython: true },
            },
          },
          orderBy: { order: "asc" },
        },
        questions: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!interview) {
      return errorResponse("Interview not found", 404);
    }

    if (interview.userId !== session.id) {
      const user = await prisma.user.findUnique({ where: { id: session.id }, select: { role: true } });
      if (user?.role !== "admin") {
        return errorResponse("Forbidden", 403);
      }
    }

    if (!interview || (interview.status !== "completed" && interview.status !== "evaluated")) {
      return errorResponse("Interview not yet completed", 400);
    }

    const questions = interview.questions;

    // Calculate per-category scores
    const mcqQuestions = questions.filter((q) => q.type === "mcq");
    const sqlQuestions = questions.filter((q) => q.type === "sql");
    const debuggingQuestions = questions.filter((q) => q.type === "debugging");
    const outputPredQuestions = questions.filter((q) => q.type === "output_prediction");
    const lldQuestions = questions.filter((q) => q.type === "lld");
    const systemDesignQuestions = questions.filter((q) => q.type === "system_design");

    function calcScore(qs: typeof questions) {
      if (qs.length === 0) return { correct: 0, total: 0, percentage: 0 };
      const correct = qs.filter((q) => q.isCorrect).length;
      return { correct, total: qs.length, percentage: Math.round((correct / qs.length) * 100) };
    }

    const categoryScores = {
      mcq: calcScore(mcqQuestions),
      sql: calcScore(sqlQuestions),
      debugging: calcScore(debuggingQuestions),
      outputPrediction: calcScore(outputPredQuestions),
      lld: calcScore(lldQuestions),
      systemDesign: calcScore(systemDesignQuestions),
    };

    // Coding problem scores
    const problemScores = interview.problems.map((p) => ({
      title: p.problem.title,
      slug: p.problem.slug,
      difficulty: p.problem.difficulty,
      solved: p.solved,
      score: p.score,
      feedback: p.feedback,
    }));

    const totalProblems = interview.problems.length;
    const solvedProblems = interview.problems.filter((p) => p.solved).length;

    return successResponse({
      id: interview.id,
      title: interview.title,
      company: interview.company,
      score: interview.score,
      feedback: interview.feedback,
      experienceYears: interview.experienceYears,
      durationMinutes: interview.durationMinutes,
      timeTaken: interview.completedAt && interview.startedAt
        ? Math.round((interview.completedAt.getTime() - interview.startedAt.getTime()) / 60000)
        : null,
      completedAt: interview.completedAt?.toISOString(),
      breakdown: {
        overall: interview.score,
        problems: {
          total: totalProblems,
          solved: solvedProblems,
          progress: totalProblems > 0 ? Math.round((solvedProblems / totalProblems) * 100) : 0,
          items: problemScores,
        },
        categories: categoryScores,
      },
      questions: interview.questions.map((q) => ({
        id: q.id,
        text: q.questionText,
        type: q.type,
        choices: JSON.parse(q.choices),
        userAnswer: q.userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect: q.isCorrect,
        explanation: q.explanation,
        score: q.score,
        order: q.order,
      })),
    });
  } catch (error) {
    console.error("Interview results error:", error);
    return handleApiError(error);
  }
}
