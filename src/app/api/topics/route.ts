import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/api-helpers";

// GET /api/topics — List all topics with problem counts
export async function GET() {
  try {
    const topics = await prisma.topic.findMany({
      where: { isActive: true },
      include: { _count: { select: { problems: true } } },
      orderBy: { order: "asc" },
    });

    return successResponse(
      topics.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        description: t.description,
        icon: t.icon,
        color: t.color,
        parentId: t.parentId,
        problemCount: t._count.problems,
      }))
    );
  } catch (error) {
    console.error("Topics error:", error);
    return handleApiError(error);
  }
}
