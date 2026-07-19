import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateOverallMastery } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
      include: {
        masteryScores: true,
        tier: true,
        _count: { select: { quizAttempts: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const usersWithScores = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      overallScore: calculateOverallMastery(u.masteryScores),
      tier: u.tier,
      quizCount: u._count.quizAttempts,
      createdAt: u.createdAt.toISOString(),
    }));

    return NextResponse.json({ success: true, data: usersWithScores });
  } catch (error) {
    console.error("Admin users error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
