import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const tracks = await prisma.track.findMany({
      include: {
        subDomains: {
          orderBy: { order: "asc" },
          include: {
            concepts: {
              orderBy: { order: "asc" },
              include: {
                _count: { select: { questions: true } },
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: tracks });
  } catch (error) {
    console.error("Admin tracks error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
