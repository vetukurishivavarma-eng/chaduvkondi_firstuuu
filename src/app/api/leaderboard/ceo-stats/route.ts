import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CEO_PERSONAS } from "@/lib/ai-battle";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.id;

    // Get all completed AI battles for this user (as challenger)
    const aiBattles = await prisma.battle.findMany({
      where: {
        challengerId: userId,
        isAi: true,
        status: "completed",
        aiCeoName: { not: "" },
      },
      select: {
        aiCeoName: true,
        aiDifficulty: true,
        challengerScore: true,
        opponentScore: true,
        completedAt: true,
      },
      orderBy: { completedAt: "desc" },
    });

    // Group by CEO name
    const ceoMap = new Map<string, {
      ceoName: string;
      wins: number;
      losses: number;
      draws: number;
      totalBattles: number;
      totalChallengerScore: number;
      totalOpponentScore: number;
      lastBattleAt: string | null;
      difficulties: Record<string, number>;
    }>();

    for (const battle of aiBattles) {
      const name = battle.aiCeoName;
      if (!name) continue;

      const existing = ceoMap.get(name) || {
        ceoName: name,
        wins: 0,
        losses: 0,
        draws: 0,
        totalBattles: 0,
        totalChallengerScore: 0,
        totalOpponentScore: 0,
        lastBattleAt: null,
        difficulties: {},
      };

      existing.totalBattles++;
      existing.totalChallengerScore += battle.challengerScore || 0;
      existing.totalOpponentScore += battle.opponentScore || 0;

      const diff = (battle.challengerScore || 0) - (battle.opponentScore || 0);
      if (diff > 0) existing.wins++;
      else if (diff < 0) existing.losses++;
      else existing.draws++;

      // Track difficulty counts
      const diffKey = battle.aiDifficulty || "medium";
      existing.difficulties[diffKey] = (existing.difficulties[diffKey] || 0) + 1;

      // Track last battle date
      if (battle.completedAt && (!existing.lastBattleAt || battle.completedAt > new Date(existing.lastBattleAt))) {
        existing.lastBattleAt = battle.completedAt.toISOString();
      }

      ceoMap.set(name, existing);
    }

    // Merge with CEO_PERSONAS data and sort by total battles desc
    const stats = Array.from(ceoMap.values())
      .map((s) => {
        const persona = CEO_PERSONAS.find((c) => c.name === s.ceoName);
        return {
          ceoName: s.ceoName,
          emoji: persona?.emoji || "🤖",
          color: persona?.color || "#6366f1",
          title: persona?.title || "",
          catchphrase: persona?.catchphrase || "",
          wins: s.wins,
          losses: s.losses,
          draws: s.draws,
          totalBattles: s.totalBattles,
          winRate: s.wins + s.losses > 0
            ? Math.round((s.wins / (s.wins + s.losses)) * 100)
            : 0,
          avgScore: s.totalBattles > 0
            ? Math.round(s.totalChallengerScore / s.totalBattles)
            : 0,
          avgOpponentScore: s.totalBattles > 0
            ? Math.round(s.totalOpponentScore / s.totalBattles)
            : 0,
          difficulties: s.difficulties,
          lastBattleAt: s.lastBattleAt,
        };
      })
      .sort((a, b) => b.totalBattles - a.totalBattles);

    const totalAiBattles = aiBattles.length;
    const totalWins = stats.reduce((sum, s) => sum + s.wins, 0);
    const totalLosses = stats.reduce((sum, s) => sum + s.losses, 0);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        totals: {
          totalAiBattles,
          totalWins,
          totalLosses,
          overallWinRate: totalWins + totalLosses > 0
            ? Math.round((totalWins / (totalWins + totalLosses)) * 100)
            : 0,
          ceosFaced: stats.length,
        },
      },
    });
  } catch (error) {
    console.error("CEO stats API error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
