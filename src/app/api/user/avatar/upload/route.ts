import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

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

    // Create unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `avatar-${session.id}-${Date.now()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    const filePath = path.join(uploadDir, filename);

    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true });

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // URL path for the uploaded file
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
