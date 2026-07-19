import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const [users, tracks, concepts, questions, resources, quizAttempts] = await Promise.all([
      prisma.user.count(),
      prisma.track.count(),
      prisma.concept.count(),
      prisma.question.count(),
      prisma.resource.count(),
      prisma.quizAttempt.count(),
    ]);

    return NextResponse.json({
      success: true,
      data: { users, tracks, concepts, questions, resources, quizAttempts },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
