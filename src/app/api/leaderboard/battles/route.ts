import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));

    // Get all users with battle stats, sorted by battle points descending
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { battleWins: { gt: 0 } },
          { battleLosses: { gt: 0 } },
          { battleDraws: { gt: 0 } },
          { battlePoints: { gt: 0 } },
        ],
      },
      select: {
        id: true,
        name: true,
        battlePoints: true,
        battleWins: true,
        battleLosses: true,
        battleDraws: true,
        tier: { select: { name: true, color: true, icon: true } },
      },
      orderBy: { battlePoints: "desc" },
      take: limit,
    });

    // Build leaderboard with ranks
    const leaderboard = users.map((u, i) => ({
      rank: i + 1,
      userId: u.id,
      name: u.name,
      tier: u.tier,
      battlePoints: u.battlePoints,
      wins: u.battleWins,
      losses: u.battleLosses,
      draws: u.battleDraws,
      totalBattles: u.battleWins + u.battleLosses + u.battleDraws,
      winRate: u.battleWins + u.battleLosses > 0
        ? Math.round((u.battleWins / (u.battleWins + u.battleLosses)) * 100)
        : 0,
      isCurrentUser: u.id === session.id,
    }));

    // Find current user's rank
    const currentUserEntry = leaderboard.find((e) => e.userId === session.id);
    const totalParticipants = users.length;

    // If user has battles but isn't in top N, include them at the bottom
    let currentUser = currentUserEntry || null;
    if (!currentUser) {
      const me = await prisma.user.findUnique({
        where: { id: session.id },
        select: {
          id: true,
          name: true,
          battlePoints: true,
          battleWins: true,
          battleLosses: true,
          battleDraws: true,
          tier: { select: { name: true, color: true, icon: true } },
        },
      });
      if (me && (me.battleWins > 0 || me.battleLosses > 0 || me.battleDraws > 0 || me.battlePoints > 0)) {
        currentUser = {
          rank: 0,
          userId: me.id,
          name: me.name,
          tier: me.tier,
          battlePoints: me.battlePoints,
          wins: me.battleWins,
          losses: me.battleLosses,
          draws: me.battleDraws,
          totalBattles: me.battleWins + me.battleLosses + me.battleDraws,
          winRate: me.battleWins + me.battleLosses > 0
            ? Math.round((me.battleWins / (me.battleWins + me.battleLosses)) * 100)
            : 0,
          isCurrentUser: true,
        };
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        leaderboard,
        currentUser,
        totalParticipants,
      },
    });
  } catch (error) {
    console.error("Battle leaderboard API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
