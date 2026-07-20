import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, handleApiError } from "@/lib/api-helpers";
import { deleteLocalAvatarFile } from "@/lib/avatar";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const { avatarDataUrl } = await request.json();

    if (!avatarDataUrl || typeof avatarDataUrl !== "string") {
      return errorResponse("avatarDataUrl is required and must be a string", 400);
    }

    // Validate it's a valid data URL
    if (!avatarDataUrl.startsWith("data:image/")) {
      return errorResponse("Invalid image data URL", 400);
    }

    // Validate max size (data URLs are ~33% larger than binary, allow ~6MB)
    const approxBytes = (avatarDataUrl.length * 3) / 4;
    if (approxBytes > 6 * 1024 * 1024) {
      return errorResponse("Image must be less than 5MB", 400);
    }

    // Fetch current avatar URL to clean up old file if switching from local upload
    const currentUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { avatarUrl: true },
    });

    // Save base64 data URL directly to database (serverless-safe, no disk writes)
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
