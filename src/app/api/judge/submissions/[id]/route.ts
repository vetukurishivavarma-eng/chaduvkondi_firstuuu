import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";

// GET /api/judge/submissions/[id] — Get submission status
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

    const submission = await prisma.problemSubmission.findUnique({
      where: { id },
      include: {
        problem: { select: { title: true, slug: true } },
        language: { select: { name: true, slug: true, icon: true } },
      },
    });

    if (!submission) {
      return errorResponse("Submission not found", 404);
    }

    if (submission.userId !== session.id && session.role !== "admin") {
      return errorResponse("Forbidden", 403);
    }

    return successResponse({
      id: submission.id,
      status: submission.status,
      testCasesPassed: submission.testCasesPassed,
      totalTestCases: submission.totalTestCases,
      executionTimeMs: submission.executionTimeMs,
      memoryUsedKb: submission.memoryUsedKb,
      errorMessage: submission.errorMessage,
      score: submission.score,
      code: submission.code,
      problem: submission.problem,
      language: submission.language,
      createdAt: submission.createdAt.toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
