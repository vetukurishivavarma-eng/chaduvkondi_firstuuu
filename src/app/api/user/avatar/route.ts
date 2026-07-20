import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";
import { deleteLocalAvatarFile } from "@/lib/avatar";

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

    // Fetch old avatar URL so we can clean up the file if switching from local to external
    const currentUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { avatarUrl: true },
    });

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

    // If user had a local file and is switching to an external URL, clean up
    await deleteLocalAvatarFile(currentUser?.avatarUrl ?? null);

    return successResponse(user);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    const session = await requireAuth();

    // Fetch current avatar URL so we can delete the file
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { avatarUrl: true },
    });

    await prisma.user.update({
      where: { id: session.id },
      data: {
        avatarUrl: null,
        avatarCreatedAt: null,
      },
    });

    // Delete the file from disk (non-critical)
    await deleteLocalAvatarFile(user?.avatarUrl ?? null);

    return successResponse({ message: "Avatar removed" });
  } catch (error) {
    return handleApiError(error);
  }
}
