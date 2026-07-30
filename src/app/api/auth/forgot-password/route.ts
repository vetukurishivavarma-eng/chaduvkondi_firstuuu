import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, handleApiError } from "@/lib/api-helpers";
import { sendPasswordResetEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return errorResponse("Email is required", 400);
    }

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      // Generate a secure random token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      await prisma.user.update({
        where: { id: user.id },
        data: { resetToken, resetTokenExpiry },
      });

      // Send the password reset email
      const emailResult = await sendPasswordResetEmail(email, resetToken);

      if (!emailResult.success) {
        console.error(`[Forgot Password] Email failed for ${email}:`, emailResult.message);
      }
    }

    // Always return success — don't reveal if the email exists or not
    return new Response(
      JSON.stringify({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent. Please check your inbox.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
