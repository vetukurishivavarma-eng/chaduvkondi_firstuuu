import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { opponentId, trackId } = await request.json();

    if (!opponentId || !trackId) {
      return NextResponse.json({ success: false, error: "Opponent and track are required" }, { status: 400 });
    }

    if (opponentId === session.id) {
      return NextResponse.json({ success: false, error: "You cannot challenge yourself" }, { status: 400 });
    }

    const battle = await prisma.battle.create({
      data: {
        challengerId: session.id,
        opponentId,
        trackId,
        status: "pending",
        questionCount: 10,
      },
      include: {
        challenger: { select: { id: true, name: true } },
        opponent: { select: { id: true, name: true } },
        track: { select: { id: true, name: true, icon: true, color: true } },
      },
    });

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://chaduvkondi.vercel.app"}/battles/${battle.id}`;

    return NextResponse.json({
      success: true,
      data: {
        id: battle.id,
        shareUrl,
        opponentName: battle.opponent.name,
        trackName: battle.track.name,
        trackIcon: battle.track.icon,
        trackColor: battle.track.color,
        status: battle.status,
      },
    });
  } catch (error) {
    console.error("Create battle error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
