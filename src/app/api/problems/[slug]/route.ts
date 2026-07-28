import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";

// GET /api/problems/[slug] — Get full problem details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const { slug } = await params;

    const problem = await prisma.codingProblem.findUnique({
      where: { slug },
      include: {
        company: { select: { name: true, slug: true, logoUrl: true, description: true } },
        language: { select: { name: true, slug: true, icon: true, color: true, monacoId: true } },
        topic: { select: { name: true, slug: true, icon: true, color: true } },
        bookmarks: { where: { userId: session.id }, select: { id: true } },
        userProgress: { where: { userId: session.id }, select: { solved: true, attempts: true, bookmarked: true, bestScore: true } },
        submissions: {
          where: { userId: session.id },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, status: true, score: true, executionTimeMs: true, createdAt: true },
        },
      },
    });

    if (!problem) {
      return errorResponse("Problem not found", 404);
    }

    // Get related problems
    const relatedProblems = await prisma.codingProblem.findMany({
      where: {
        OR: [
          { topicId: problem.topicId },
          { companyId: problem.companyId },
        ],
        id: { not: problem.id },
        status: "published",
      },
      take: 5,
      select: { id: true, title: true, slug: true, difficulty: true },
      orderBy: { totalSubmissions: "desc" },
    });

    return successResponse({
      id: problem.id,
      title: problem.title,
      slug: problem.slug,
      difficulty: problem.difficulty,
      story: problem.story,
      problemStatement: problem.problemStatement,
      inputFormat: problem.inputFormat,
      outputFormat: problem.outputFormat,
      constraints: problem.constraints,
      examples: JSON.parse(problem.examples || "[]"),
      edgeCases: JSON.parse(problem.edgeCases || "[]"),
      hints: JSON.parse(problem.hints || "[]"),
      testCases: JSON.parse(problem.testCases || "[]"),
      tags: JSON.parse(problem.tags || "[]"),
      company: problem.company,
      language: problem.language,
      topic: problem.topic,
      stats: {
        totalSubmissions: problem.totalSubmissions,
        totalAccepted: problem.totalAccepted,
        acceptanceRate: problem.acceptanceRate,
        upvotes: problem.upvotes,
        downvotes: problem.downvotes,
      },
      userProgress: problem.userProgress[0] || null,
      submissions: problem.submissions,
      isBookmarked: problem.bookmarks.length > 0,
      relatedProblems: relatedProblems.map((rp) => ({
        id: rp.id,
        title: rp.title,
        slug: rp.slug,
        difficulty: rp.difficulty,
      })),
      createdAt: problem.createdAt.toISOString(),
    });
  } catch (error) {
    console.error("Problem detail error:", error);
    return handleApiError(error);
  }
}
