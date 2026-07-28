import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";

export const runtime = "nodejs";
export const maxDuration = 60;

// GET /api/interviews/[id] — Get full interview details with all problems and questions
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
        company: { select: { name: true, slug: true, logoUrl: true, description: true } },
        problems: {
          include: {
            problem: {
              select: {
                id: true,
                title: true,
                slug: true,
                difficulty: true,
                problemStatement: true,
                story: true,
                inputFormat: true,
                outputFormat: true,
                constraints: true,
                examples: true,
                tags: true,
              },
            },
          },
          orderBy: { order: "asc" },
        },
        questions: {
          select: {
            id: true,
            questionText: true,
            type: true,
            choices: true,
            userAnswer: true,
            isCorrect: true,
            explanation: true,
            score: true,
            order: true,
          },
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

    return successResponse({
      id: interview.id,
      title: interview.title,
      company: interview.company,
      status: interview.status,
      score: interview.score,
      feedback: interview.feedback,
      experienceYears: interview.experienceYears,
      durationMinutes: interview.durationMinutes,
      problems: interview.problems.map((ip) => ({
        id: ip.id,
        problemId: ip.problemId,
        order: ip.order,
        userCode: ip.userCode,
        score: ip.score,
        feedback: ip.feedback,
        solved: ip.solved,
        detail: {
          title: ip.problem.title,
          slug: ip.problem.slug,
          difficulty: ip.problem.difficulty,
          problemStatement: ip.problem.problemStatement,
          story: ip.problem.story,
          inputFormat: ip.problem.inputFormat,
          outputFormat: ip.problem.outputFormat,
          constraints: ip.problem.constraints,
          examples: JSON.parse(ip.problem.examples || "[]"),
          tags: JSON.parse(ip.problem.tags || "[]"),
        },
      })),
      questions: interview.questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        type: q.type,
        choices: JSON.parse(q.choices),
        userAnswer: q.userAnswer,
        isCorrect: q.isCorrect,
        explanation: q.explanation,
        score: q.score,
        order: q.order,
      })),
      startedAt: interview.startedAt?.toISOString() || null,
      completedAt: interview.completedAt?.toISOString() || null,
      createdAt: interview.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Get interview error:", error);
    return handleApiError(error);
  }
}

// PATCH /api/interviews/[id] — Update interview (start, answer question, complete)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    const interview = await prisma.mockInterview.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    });

    if (!interview) {
      return errorResponse("Interview not found", 404);
    }
    if (interview.userId !== session.id) {
      return errorResponse("Forbidden", 403);
    }

    switch (action) {
      case "start": {
        if (interview.status !== "pending") {
          return errorResponse("Interview already started or completed", 400);
        }
        const updated = await prisma.mockInterview.update({
          where: { id },
          data: { status: "in_progress", startedAt: new Date() },
        });
        return successResponse({
          id: updated.id,
          status: "in_progress",
          startedAt: updated.startedAt?.toISOString(),
          message: "Interview started! Good luck!",
        });
      }

      case "answer": {
        if (interview.status !== "in_progress") {
          return errorResponse("Interview is not in progress", 400);
        }
        const { questionId, choiceId } = body;
        if (!questionId || !choiceId) {
          return errorResponse("questionId and choiceId are required", 400);
        }

        const question = await prisma.interviewQuestion.findUnique({
          where: { id: questionId },
        });
        if (!question || question.interviewId !== id) {
          return errorResponse("Question not found in this interview", 404);
        }
        if (question.userAnswer) {
          return errorResponse("Question already answered", 400);
        }

        const isCorrect = question.correctAnswer === choiceId;
        await prisma.interviewQuestion.update({
          where: { id: questionId },
          data: {
            userAnswer: choiceId,
            isCorrect,
            score: isCorrect ? 100 : 0,
          },
        });

        return successResponse({
          questionId,
          isCorrect,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
        });
      }

      case "submit-code": {
        if (interview.status !== "in_progress") {
          return errorResponse("Interview is not in progress", 400);
        }
        const { problemEntryId, code } = body;
        if (!problemEntryId) {
          return errorResponse("problemEntryId is required", 400);
        }

        const problemEntry = await prisma.interviewProblem.findUnique({
          where: { id: problemEntryId },
        });
        if (!problemEntry || problemEntry.interviewId !== id) {
          return errorResponse("Problem not found in this interview", 404);
        }

        await prisma.interviewProblem.update({
          where: { id: problemEntryId },
          data: {
            userCode: code,
            solved: true,
            score: 80, // Auto-score for submitting code
          },
        });

        return successResponse({
          message: "Code submitted successfully",
          problemEntryId,
        });
      }

      case "complete": {
        if (interview.status !== "in_progress") {
          return errorResponse("Interview is not in progress", 400);
        }

        // Calculate score
        const [questions, problems] = await Promise.all([
          prisma.interviewQuestion.findMany({ where: { interviewId: id } }),
          prisma.interviewProblem.findMany({ where: { interviewId: id } }),
        ]);

        const mcqCorrect = questions.filter((q) => q.isCorrect).length;
        const mcqTotal = questions.length;
        const mcqScore = mcqTotal > 0 ? (mcqCorrect / mcqTotal) * 100 : 0;

        const problemSolved = problems.filter((p) => p.solved).length;
        const problemTotal = problems.length;
        const problemScore = problemTotal > 0 ? (problemSolved / problemTotal) * 100 : 0;

        const totalWeightedScore = mcqTotal + problemTotal * 3;
        const totalWeightedEarned = (mcqCorrect * 100) + (problemSolved * 300);
        const finalScore = totalWeightedScore > 0
          ? Math.round((totalWeightedEarned / (totalWeightedScore * 100)) * 100)
          : 0;

        // Generate feedback
        const feedback = generateFeedback({ mcqCorrect, mcqTotal, problemSolved, problemTotal, finalScore });

        const updated = await prisma.mockInterview.update({
          where: { id },
          data: {
            status: "completed",
            score: finalScore,
            feedback,
            completedAt: new Date(),
          },
        });

        return successResponse({
          id: updated.id,
          status: "completed",
          score: finalScore,
          feedback,
          breakdown: {
            questions: { correct: mcqCorrect, total: mcqTotal, score: Math.round(mcqScore) },
            problems: { solved: problemSolved, total: problemTotal, score: Math.round(problemScore) },
            overall: finalScore,
          },
        });
      }

      default:
        return errorResponse("Invalid action. Use: start, answer, submit-code, or complete", 400);
    }
  } catch (error) {
    console.error("Update interview error:", error);
    return handleApiError(error);
  }
}

function generateFeedback(stats: {
  mcqCorrect: number;
  mcqTotal: number;
  problemSolved: number;
  problemTotal: number;
  finalScore: number;
}): string {
  const { mcqCorrect, mcqTotal, problemSolved, problemTotal, finalScore } = stats;

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (mcqCorrect >= mcqTotal * 0.7) {
    strengths.push("Strong theoretical knowledge across core CS concepts");
  } else {
    improvements.push("Review core CS fundamentals — focus on data structures, algorithms, and system design basics");
  }

  if (problemSolved >= 1) {
    strengths.push("Practical coding skills demonstrated through problem solutions");
  } else {
    improvements.push("Practice more coding problems, especially on the array/string and algorithm topics");
  }

  const overallGrade = finalScore >= 80 ? "Excellent" : finalScore >= 60 ? "Good" : finalScore >= 40 ? "Needs Work" : "Strong Improvement Needed";

  let feedback = `## Interview Performance Summary\n\n`;
  feedback += `**Overall Score:** ${finalScore}/100 (${overallGrade})\n\n`;
  feedback += `**Knowledge Assessment:** ${mcqCorrect}/${mcqTotal} questions correct (${Math.round((mcqCorrect / mcqTotal) * 100)}%)\n`;
  feedback += `**Coding Assessment:** ${problemSolved}/${problemTotal} problems solved\n\n`;

  if (strengths.length > 0) {
    feedback += `### ✅ Strengths\n`;
    strengths.forEach((s) => (feedback += `- ${s}\n`));
    feedback += "\n";
  }

  if (improvements.length > 0) {
    feedback += `### 📈 Areas for Improvement\n`;
    improvements.forEach((s) => (feedback += `- ${s}\n`));
    feedback += "\n";
  }

  feedback += `### 💡 Interview Tips\n`;
  feedback += `- Focus on communicating your thought process clearly\n`;
  feedback += `- Always start with brute force before optimizing\n`;
  feedback += `- Ask clarifying questions about constraints and edge cases\n`;
  feedback += `- Practice time management — pace yourself across questions\n`;
  feedback += `- Review company-specific preparation materials on our platform\n`;

  return feedback;
}
