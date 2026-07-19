import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";
import { successResponse, errorResponse, handleApiError } from "@/lib/api-helpers";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return errorResponse("Missing required fields", 400);
    }

    if (password.length < 6) {
      return errorResponse("Password must be at least 6 characters", 400);
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse("Email already registered", 409);
    }

    const hashedPassword = await hashPassword(password);

    // Assign default tier (Spark)
    const sparkTier = await prisma.tierDefinition.findFirst({
      where: { name: "Spark" },
    });

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        tierId: sparkTier?.id || null,
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = successResponse(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
      201
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
