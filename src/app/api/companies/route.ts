import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, handleApiError } from "@/lib/api-helpers";

// GET /api/companies — List all companies with problem counts
export async function GET() {
  try {
    const companies = await prisma.company.findMany({
      where: { isActive: true },
      include: { _count: { select: { problems: true } } },
      orderBy: { name: "asc" },
    });

    return successResponse(
      companies.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        logoUrl: c.logoUrl,
        website: c.website,
        problemCount: c._count.problems,
      }))
    );
  } catch (error) {
    console.error("Companies error:", error);
    return handleApiError(error);
  }
}
