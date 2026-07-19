import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, handleApiError } from "@/lib/api-helpers";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return errorResponse("Email is required", 400);
    }

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "If an account exists with this email, a reset link has been generated.",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    // In production, you would send an email here with the reset link.
    // For now, we'll return the token in a safe way.
    // The reset link would be: NEXT_PUBLIC_APP_URL/reset-password?token=TOKEN
    
    console.log(`[Password Reset] Token for ${email}: ${resetToken}`);
    console.log(`[Password Reset] Reset link: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "If an account exists with this email, a reset link has been generated.",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
