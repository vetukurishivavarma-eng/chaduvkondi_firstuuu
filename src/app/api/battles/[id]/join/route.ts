import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const battle = await prisma.battle.findUnique({
      where: { id },
      include: {
        challenger: { select: { id: true, name: true } },
        opponent: { select: { id: true, name: true } },
      },
    });

    if (!battle) {
      return NextResponse.json({ success: false, error: "Battle not found" }, { status: 404 });
    }

    if (battle.challenger.id === session.id) {
      // Challenger is viewing their own battle — just return it
      return NextResponse.json({
        success: true,
        data: {
          id: battle.id,
          status: battle.status,
          opponentName: battle.opponent.name,
          isChallenger: true,
        },
      });
    }

    if (battle.opponent.id !== session.id) {
      return NextResponse.json({ success: false, error: "This battle is not for you" }, { status: 403 });
    }

    if (battle.status !== "pending") {
      return NextResponse.json({
        success: true,
        data: {
          id: battle.id,
          status: battle.status,
          opponentName: battle.challenger.name,
          isChallenger: false,
        },
      });
    }

    // Update battle to ready state (opponent has joined)
    await prisma.battle.update({
      where: { id },
      data: { status: "ready" },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: battle.id,
        status: "ready",
        opponentName: battle.challenger.name,
        isChallenger: false,
      },
    });
  } catch (error) {
    console.error("Join battle error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
