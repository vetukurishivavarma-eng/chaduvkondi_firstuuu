import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { errorResponse, handleApiError } from "@/lib/api-helpers";
import { deleteLocalAvatarFile } from "@/lib/avatar";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "avatars");

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return errorResponse("No file provided", 400);
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return errorResponse("File must be an image (JPEG, PNG, WebP, or GIF)", 400);
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return errorResponse("File must be less than 5MB", 400);
    }

    // Fetch current avatar URL before updating so we can delete the old file
    const currentUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: { avatarUrl: true },
    });

    // Create unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `avatar-${session.id}-${Date.now()}.${ext}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // Ensure directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Write new file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Delete old file from disk (non-critical – continue even if it fails)
    await deleteLocalAvatarFile(currentUser?.avatarUrl ?? null);

    // URL path for the new uploaded file
    const avatarUrl = `/uploads/avatars/${filename}`;

    // Save to database
    await prisma.user.update({
      where: { id: session.id },
      data: {
        avatarUrl,
        avatarCreatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: { avatarUrl },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
