import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";

// GET /api/problems — List problems with pagination, filtering, search
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const difficulty = searchParams.get("difficulty");
    const company = searchParams.get("company");
    const topic = searchParams.get("topic");
    const language = searchParams.get("language");
    const search = searchParams.get("search");
    const status = searchParams.get("status"); // solved, unsolved, bookmarked
    const sort = searchParams.get("sort") || "newest";

    const where: any = { status: "published" };

    if (difficulty) where.difficulty = difficulty;
    if (company) where.company = { slug: company };
    if (topic) where.topic = { slug: topic };
    if (language) where.language = { slug: language };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { tags: { contains: search, mode: "insensitive" } },
      ];
    }

    // Handle user-specific filters
    const userId = session.id;
    if (status === "solved") {
      where.submissions = { some: { userId, status: "accepted" } };
    } else if (status === "unsolved") {
      where.submissions = { none: { userId } };
    } else if (status === "bookmarked") {
      where.bookmarks = { some: { userId } };
    }

    // Sorting
    let orderBy: any = { createdAt: "desc" };
    if (sort === "popularity") orderBy = { totalSubmissions: "desc" };
    else if (sort === "difficulty") orderBy = { difficulty: "asc" };
    else if (sort === "acceptance") orderBy = { acceptanceRate: "desc" };

    const skip = (page - 1) * limit;

    const [problems, total] = await Promise.all([
      prisma.codingProblem.findMany({
        where,
        include: {
          company: { select: { name: true, slug: true, logoUrl: true } },
          language: { select: { name: true, slug: true, icon: true, color: true } },
          topic: { select: { name: true, slug: true, icon: true, color: true } },
          bookmarks: { where: { userId }, select: { id: true } },
          userProgress: { where: { userId }, select: { solved: true, bookmarked: true } },
          _count: { select: { submissions: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.codingProblem.count({ where }),
    ]);

    const formatted = problems.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      company: p.company,
      language: p.language,
      topic: p.topic,
      tags: JSON.parse(p.tags || "[]"),
      totalSubmissions: p.totalSubmissions,
      totalAccepted: p.totalAccepted,
      acceptanceRate: p.acceptanceRate,
      isSolved: p.userProgress?.[0]?.solved || false,
      isBookmarked: p.bookmarks.length > 0 || p.userProgress?.[0]?.bookmarked || false,
      createdAt: p.createdAt.toISOString(),
    }));

    return successResponse({
      problems: formatted,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Problems list error:", error);
    return handleApiError(error);
  }
}
