import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";

// GET /api/problems/search — Search problems
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(20, parseInt(searchParams.get("limit") || "10"));

    if (!q || q.length < 2) {
      return successResponse({ problems: [], pagination: { page, limit, total: 0, totalPages: 0 } });
    }

    const where = {
      status: "published" as const,
      OR: [
        { title: { contains: q, mode: "insensitive" as const } },
        { tags: { contains: q, mode: "insensitive" as const } },
        { problemStatement: { contains: q, mode: "insensitive" as const } },
      ],
    };

    const [problems, total] = await Promise.all([
      prisma.codingProblem.findMany({
        where,
        include: {
          company: { select: { name: true, slug: true } },
          language: { select: { name: true, slug: true, icon: true } },
          topic: { select: { name: true, slug: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { totalSubmissions: "desc" },
      }),
      prisma.codingProblem.count({ where }),
    ]);

    return successResponse({
      problems: problems.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        company: p.company,
        language: p.language,
        topic: p.topic,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
