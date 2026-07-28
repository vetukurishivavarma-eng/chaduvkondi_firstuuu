import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";

// GET /api/admin/ai-generated — List AI-generated problems pending approval
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    // Check admin role
    const user = await prisma.user.findUnique({ where: { id: session.id }, select: { role: true } });
    if (user?.role !== "admin") {
      return errorResponse("Forbidden — admin access required", 403);
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "draft";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 20;
    const skip = (page - 1) * limit;

    const [problems, total] = await Promise.all([
      prisma.codingProblem.findMany({
        where: { isAiGenerated: true, status: status as any },
        include: {
          author: { select: { id: true, name: true, email: true } },
          company: { select: { name: true, slug: true } },
          topic: { select: { name: true, slug: true, icon: true } },
          language: { select: { name: true, icon: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.codingProblem.count({
        where: { isAiGenerated: true, status: status as any },
      }),
    ]);

    return successResponse({
      problems: problems.map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        difficulty: p.difficulty,
        status: p.status,
        company: p.company,
        topic: p.topic,
        language: p.language,
        author: p.author,
        createdAt: p.createdAt.toISOString(),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Admin AI-generated list error:", error);
    return handleApiError(error);
  }
}

// PATCH /api/admin/ai-generated — Approve or reject multiple
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return errorResponse("Unauthorized", 401);
    }

    const user = await prisma.user.findUnique({ where: { id: session.id }, select: { role: true } });
    if (user?.role !== "admin") {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const { problemId, action } = body; // action: "approve" | "reject" | "delete"

    if (!problemId || !action) {
      return errorResponse("problemId and action are required", 400);
    }

    const problem = await prisma.codingProblem.findUnique({
      where: { id: problemId },
      select: { id: true, status: true, isAiGenerated: true },
    });

    if (!problem) {
      return errorResponse("Problem not found", 404);
    }

    if (action === "approve") {
      await prisma.codingProblem.update({
        where: { id: problemId },
        data: { status: "published" },
      });
      return successResponse({ message: "Problem published successfully" });
    } else if (action === "reject") {
      await prisma.codingProblem.update({
        where: { id: problemId },
        data: { status: "archived" },
      });
      return successResponse({ message: "Problem rejected and archived" });
    } else if (action === "delete") {
      await prisma.codingProblem.delete({ where: { id: problemId } });
      return successResponse({ message: "Problem deleted" });
    }

    return errorResponse("Invalid action. Use: approve, reject, or delete", 400);
  } catch (error) {
    console.error("Admin AI-generated action error:", error);
    return handleApiError(error);
  }
}
