import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";

// POST /api/problems/[slug]/bookmark — Toggle bookmark
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

    const problem = await prisma.codingProblem.findUnique({ where: { slug } });
    if (!problem) {
      return errorResponse("Problem not found", 404);
    }

    const existing = await prisma.problemBookmark.findUnique({
      where: {
        userId_problemId: { userId: session.id, problemId: problem.id },
      },
    });

    if (existing) {
      await prisma.problemBookmark.delete({ where: { id: existing.id } });
      return successResponse({ bookmarked: false });
    } else {
      await prisma.problemBookmark.create({
        data: { userId: session.id, problemId: problem.id },
      });
      return successResponse({ bookmarked: true });
    }
  } catch (error) {
    return handleApiError(error);
  }
}
