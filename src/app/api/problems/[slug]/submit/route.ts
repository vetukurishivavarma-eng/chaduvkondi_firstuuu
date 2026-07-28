import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";
import { evaluateSubmission } from "@/lib/judge";

// POST /api/problems/[slug]/submit — Submit a solution
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const { slug } = await params;
    const { code, language } = await request.json();

    if (!code || !language) {
      return errorResponse("Code and language are required", 400);
    }

    const problem = await prisma.codingProblem.findUnique({
      where: { slug },
      include: { language: true },
    });

    if (!problem) {
      return errorResponse("Problem not found", 404);
    }

    // Parse test cases
    const testCases = JSON.parse(problem.testCases || "[]");
    const hiddenTestCases = JSON.parse(problem.hiddenTestCases || "[]");

    if (testCases.length === 0 && hiddenTestCases.length === 0) {
      return errorResponse("This problem has no test cases", 400);
    }

    // Evaluate the submission
    const judgeResult = await evaluateSubmission(
      code,
      language,
      testCases,
      hiddenTestCases,
      5000
    );

    // Find language ID
    const langRecord = await prisma.programmingLanguage.findUnique({
      where: { slug: language },
    });

    // Save submission
    const submission = await prisma.problemSubmission.create({
      data: {
        userId: session.id,
        problemId: problem.id,
        languageId: langRecord?.id || "",
        code,
        status: judgeResult.status,
        testCasesPassed: judgeResult.testsPassed,
        totalTestCases: judgeResult.totalTests,
        executionTimeMs: judgeResult.executionTimeMs,
        errorMessage: judgeResult.testResults.find((r) => r.error)?.error || null,
        score: judgeResult.score,
      },
    });

    // Update problem stats
    await prisma.codingProblem.update({
      where: { id: problem.id },
      data: {
        totalSubmissions: { increment: 1 },
        ...(judgeResult.status === "accepted" ? { totalAccepted: { increment: 1 } } : {}),
        acceptanceRate: problem.totalSubmissions > 0
          ? ((problem.totalAccepted + (judgeResult.status === "accepted" ? 1 : 0)) / (problem.totalSubmissions + 1)) * 100
          : (judgeResult.status === "accepted" ? 100 : 0),
      },
    });

    // Update user progress
    await prisma.userProblemProgress.upsert({
      where: {
        userId_problemId: { userId: session.id, problemId: problem.id },
      },
      update: {
        attempts: { increment: 1 },
        ...(judgeResult.status === "accepted" ? {
          solved: true,
          lastSolvedAt: new Date(),
          bestScore: judgeResult.score,
          bestCode: code,
        } : {}),
      },
      create: {
        userId: session.id,
        problemId: problem.id,
        attempts: 1,
        solved: judgeResult.status === "accepted",
        lastSolvedAt: judgeResult.status === "accepted" ? new Date() : undefined,
        bestScore: judgeResult.score,
        bestCode: code,
      },
    });

    return successResponse({
      submissionId: submission.id,
      status: judgeResult.status,
      testCasesPassed: judgeResult.testsPassed,
      totalTestCases: judgeResult.totalTests,
      executionTimeMs: judgeResult.executionTimeMs,
      score: judgeResult.score,
      testResults: judgeResult.testResults,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
