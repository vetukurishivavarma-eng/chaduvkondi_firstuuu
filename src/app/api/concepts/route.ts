import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const concepts = await prisma.concept.findMany({
      include: {
        subDomain: {
          include: { track: true },
        },
        _count: { select: { questions: true } },
      },
      orderBy: [
        { subDomain: { track: { name: "asc" } } },
        { subDomain: { order: "asc" } },
        { order: "asc" },
      ],
    });

    // Format the data
    const tracks = await prisma.track.findMany({
      where: { isActive: true },
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
    });

    return NextResponse.json({
      success: true,
      data: tracks,
    });
  } catch (error) {
    console.error("Concepts API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
