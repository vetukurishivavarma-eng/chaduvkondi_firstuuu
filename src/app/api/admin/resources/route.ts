import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const concepts = await prisma.concept.findMany({
      include: {
        resources: true,
        subDomain: { include: { track: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: concepts });
  } catch (error) {
    console.error("Admin resources error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
