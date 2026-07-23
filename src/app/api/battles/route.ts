import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;

    // Get battles where user is either challenger or opponent
    const [sentBattles, receivedBattles] = await Promise.all([
      prisma.battle.findMany({
        where: { challengerId: userId },
        include: {
          opponent: { select: { id: true, name: true, avatarUrl: true } },
          track: { select: { id: true, name: true, icon: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      prisma.battle.findMany({
        where: { opponentId: userId },
        include: {
          challenger: { select: { id: true, name: true, avatarUrl: true } },
          track: { select: { id: true, name: true, icon: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
    ]);

    // Format battles
    const battles = [
      ...sentBattles.map((b) => ({
        id: b.id,
        type: "challenge" as const,
        opponent_name: b.opponent.name,
        opponent_avatar: b.opponent.avatarUrl,
        track_name: b.track.name,
        track_icon: b.track.icon,
        status: b.status,
        challenger_score: b.challengerScore,
        opponent_score: b.opponentScore,
        created_at: b.createdAt.toISOString(),
        completed_at: b.completedAt?.toISOString() || null,
      })),
      ...receivedBattles.map((b) => ({
        id: b.id,
        type: "invite" as const,
        opponent_name: b.challenger.name,
        opponent_avatar: b.challenger.avatarUrl,
        track_name: b.track.name,
        track_icon: b.track.icon,
        status: b.status,
        challenger_score: b.challengerScore,
        opponent_score: b.opponentScore,
        created_at: b.createdAt.toISOString(),
        completed_at: b.completedAt?.toISOString() || null,
      })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Get available opponents
    const opponents = await prisma.user.findMany({
      where: {
        id: { not: userId },
        role: "learner",
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        tier: { select: { name: true, color: true, icon: true } },
        _count: { select: { quizAttempts: true } },
      },
      take: 20,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        battles,
        opponents: opponents.map((u) => ({
          id: u.id,
          name: u.name,
          avatarUrl: u.avatarUrl,
          tier: u.tier,
          quizCount: u._count.quizAttempts,
        })),
      },
    });
  } catch (error) {
    console.error("Battles API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

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

    // Create battle challenge
    const battle = await prisma.battle.create({
      data: {
        challengerId: session.id,
        opponentId,
        trackId,
        status: "pending",
      },
      include: {
        opponent: { select: { id: true, name: true } },
        track: { select: { id: true, name: true, icon: true } },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: battle.id,
        opponent_name: battle.opponent.name,
        track_name: battle.track.name,
        track_icon: battle.track.icon,
        status: battle.status,
      },
    });
  } catch (error) {
    console.error("Create battle error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
