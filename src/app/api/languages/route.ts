import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/api-helpers";

// GET /api/languages — List all supported programming languages
export async function GET() {
  try {
    const languages = await prisma.programmingLanguage.findMany({
      where: { isActive: true },
      include: { _count: { select: { problems: true } } },
      orderBy: { order: "asc" },
    });

    return successResponse(
      languages.map((l) => ({
        id: l.id,
        name: l.name,
        slug: l.slug,
        extension: l.extension,
        monacoId: l.monacoId,
        icon: l.icon,
        color: l.color,
        problemCount: l._count.problems,
      }))
    );
  } catch (error) {
    console.error("Languages error:", error);
    return handleApiError(error);
  }
}
