"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, Swords, TrendingUp, Star, Trophy, Medal, Target } from "lucide-react";
import { CEO_PERSONAS } from "@/lib/ai-battle";

interface CeoStats {
  ceoName: string;
  battles: number;
  wins: number;
  losses: number;
  draws: number;
  totalScore: number;
  bestScore: number;
  avgScore: number;
  winRate: number;
}

export function CeoWallOfFame() {
  const [ceoStats, setCeoStats] = useState<CeoStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [topCeo, setTopCeo] = useState<string | null>(null);
  const [totalBattles, setTotalBattles] = useState(0);

  useEffect(() => {
    fetch("/api/battles")
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return;

        const stats: Record<string, CeoStats> = {};
        const battles = data.data?.battles || [];

        battles.forEach((b: any) => {
          if (!b.isAi || !b.aiCeoName) return;
          const name = b.aiCeoName;
          if (!stats[name]) {
            stats[name] = {
              ceoName: name,
              battles: 0,
              wins: 0,
              losses: 0,
              draws: 0,
              totalScore: 0,
              bestScore: 0,
              avgScore: 0,
              winRate: 0,
            };
          }
          const s = stats[name];
          s.battles++;
          s.totalScore += b.challengerScore || 0;
          s.bestScore = Math.max(s.bestScore, b.challengerScore || 0);
          if (b.challengerScore > b.opponentScore) s.wins++;
          else if (b.challengerScore < b.opponentScore) s.losses++;
          else s.draws++;
        });

        // Calculate averages and win rates
        Object.values(stats).forEach((s) => {
          s.avgScore = s.battles > 0 ? Math.round(s.totalScore / s.battles) : 0;
          s.winRate = s.battles > 0 ? Math.round((s.wins / s.battles) * 100) : 0;
        });

        const sorted = Object.values(stats).sort((a, b) => b.wins - a.wins || b.winRate - a.winRate);
        setCeoStats(sorted);
        setTotalBattles(battles.filter((b: any) => b.isAi).length);

        // Find CEO with most wins
        if (sorted.length > 0) {
          const top = sorted.reduce((best, curr) => (curr.wins > best.wins ? curr : best), sorted[0]);
          setTopCeo(top.ceoName);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            CEO Battle Wall of Fame
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (ceoStats.length === 0) {
    return (
      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            CEO Battle Wall of Fame
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 space-y-2">
            <Swords className="w-8 h-8 text-[var(--muted)] mx-auto" />
            <p className="text-sm text-[var(--muted)]">No CEO battles yet</p>
            <p className="text-xs text-[var(--muted)]">Challenge a CEO in the Battles arena to see stats here!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500" />
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-500" />
            CEO Battle Wall of Fame
          </span>
          <Badge variant="secondary" className="text-[10px]">
            {totalBattles} total battles
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {ceoStats.map((ceo, index) => {
          const persona = CEO_PERSONAS.find((p) => p.name === ceo.ceoName);
          const isTop = ceo.ceoName === topCeo;
          const rankIcon = index === 0 ? <Trophy className="w-3.5 h-3.5 text-amber-500" /> :
                          index === 1 ? <Medal className="w-3.5 h-3.5 text-gray-400" /> :
                          index === 2 ? <Medal className="w-3.5 h-3.5 text-amber-700" /> : null;

          return (
            <div
              key={ceo.ceoName}
              className={`p-3 rounded-xl border transition-all ${
                isTop
                  ? "border-amber-400/30 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20"
                  : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/20"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* CEO Avatar */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: (persona?.color || "#6366f1") + "20" }}
                >
                  {persona?.emoji || "👤"}
                </div>

                {/* CEO Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--foreground)] truncate">
                      {ceo.ceoName}
                    </span>
                    {index === 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-medium">
                        #1
                      </span>
                    )}
                    {rankIcon}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-[var(--muted)]">
                      {ceo.battles} battle{ceo.battles !== 1 ? "s" : ""}
                    </span>
                    <span className="text-[10px] text-emerald-500 font-medium">
                      {ceo.wins}W
                    </span>
                    <span className="text-[10px] text-red-500 font-medium">
                      {ceo.losses}L
                    </span>
                    <span className="text-[10px] text-[var(--muted)]">
                      Score: {ceo.avgScore}
                    </span>
                  </div>
                </div>

                {/* Win Rate */}
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1">
                    <Target className="w-3 h-3 text-[var(--muted)]" />
                    <span className={`text-sm font-bold ${
                      ceo.winRate >= 60 ? "text-emerald-500" :
                      ceo.winRate >= 40 ? "text-amber-500" :
                      "text-red-500"
                    }`}>
                      {ceo.winRate}%
                    </span>
                  </div>
                  <div className="mt-1">
                    <Progress
                      value={ceo.winRate}
                      className={`h-1 w-16 ${
                        ceo.winRate >= 60 ? "bg-emerald-500/20" :
                        ceo.winRate >= 40 ? "bg-amber-500/20" :
                        "bg-red-500/20"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
