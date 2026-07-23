import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRandomCeo } from "@/lib/ai-battle";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { trackId, difficulty = "medium" } = await request.json();

    if (!trackId) {
      return NextResponse.json({ success: false, error: "Track is required" }, { status: 400 });
    }

    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return NextResponse.json({ success: false, error: "Invalid difficulty" }, { status: 400 });
    }

    // Pick a random CEO opponent
    const ceo = getRandomCeo();

    // Create battle with AI configuration
    const battle = await prisma.battle.create({
      data: {
        challengerId: session.id,
        opponentId: session.id, // Self-reference — AI uses the same user
        trackId,
        status: "ready", // AI battles skip the lobby — immediately ready
        questionCount: 10,
        isAi: true,
        aiDifficulty: difficulty,
        aiCeoName: ceo.name,
        readyChallenger: false, // Human not ready yet
        readyOpponent: true, // AI is always ready
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: battle.id,
        ceoName: ceo.name,
        ceoEmoji: ceo.emoji,
        ceoColor: ceo.color,
        ceoTitle: ceo.title,
        difficulty,
        status: battle.status,
      },
    });
  } catch (error) {
    console.error("Create AI battle error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
