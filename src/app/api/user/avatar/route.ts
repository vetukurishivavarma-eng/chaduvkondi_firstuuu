import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { avatarUrl } = await request.json();

    if (!avatarUrl || typeof avatarUrl !== "string") {
      return errorResponse("avatarUrl is required and must be a string", 400);
    }

    // Basic URL validation
    try {
      new URL(avatarUrl);
    } catch {
      return errorResponse("Invalid avatar URL format", 400);
    }

    const user = await prisma.user.update({
      where: { id: session.id },
      data: {
        avatarUrl,
        avatarCreatedAt: new Date(),
      },
      select: {
        id: true,
        avatarUrl: true,
        avatarCreatedAt: true,
      },
    });

    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    const session = await requireAuth();

    await prisma.user.update({
      where: { id: session.id },
      data: {
        avatarUrl: null,
        avatarCreatedAt: null,
      },
    });

    return successResponse({ message: "Avatar removed" });
  } catch (error) {
    return handleApiError(error);
  }
}
