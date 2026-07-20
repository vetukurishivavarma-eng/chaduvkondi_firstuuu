import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, handleApiError } from "@/lib/api-helpers";
import { deleteLocalAvatarFile } from "@/lib/avatar";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Parse body with explicit error for malformed JSON
    let avatarDataUrl: string;
    try {
      const body = await request.json();
      avatarDataUrl = body.avatarDataUrl;
    } catch {
      return errorResponse("Invalid JSON in request body", 400);
    }

    if (!avatarDataUrl || typeof avatarDataUrl !== "string") {
      return errorResponse("avatarDataUrl is required and must be a string", 400);
    }

    if (!avatarDataUrl.startsWith("data:image/")) {
      return errorResponse("Invalid image data URL", 400);
    }

    if (avatarDataUrl.length > 2 * 1024 * 1024) {
      return errorResponse("Image too large. Please use a smaller image.", 400);
    }

    // Fetch current avatar URL to clean up old file
    const currentUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { avatarUrl: true },
    });

    // Save base64 data URL directly to database (serverless-safe)
    await prisma.user.update({
      where: { id: session.id },
      data: {
        avatarUrl: avatarDataUrl,
        avatarCreatedAt: new Date(),
      },
    });

    // Delete old local file if user had one (non-critical)
    await deleteLocalAvatarFile(currentUser?.avatarUrl ?? null);

    return NextResponse.json({
      success: true,
      data: { avatarUrl: avatarDataUrl },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
