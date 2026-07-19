import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { errorResponse, successResponse, handleApiError } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return errorResponse("Token and password are required", 400);
    }

    if (password.length < 6) {
      return errorResponse("Password must be at least 6 characters", 400);
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return errorResponse("Invalid or expired reset token", 400);
    }

    // Hash the new password and clear the reset token
    const hashedPassword = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return successResponse({ message: "Password reset successful. You can now sign in with your new password." });
  } catch (error) {
    return handleApiError(error);
  }
}
