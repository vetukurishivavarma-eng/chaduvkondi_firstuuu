"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Medal,
  TrendingUp,
  Users,
  Crown,
  Target,
  Loader2,
  LayoutDashboard,
  ArrowLeft,
  Calendar,
  ChevronDown,
} from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  overallScore: number;
  conceptsCount: number;
  correctRate: number;
  tier: { name: string; color: string; icon: string } | null;
  isCurrentUser: boolean;
}

interface CurrentUserData {
  rank: number;
  name: string;
  overallScore: number;
  conceptsCount: number;
  correctRate: number;
  tier: { name: string; color: string; icon: string } | null;
  percentile: number;
  totalLearners: number;
  seasonRank: number | null;
}

interface Season {
  id: string;
  name: string;
  period: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isFinished: boolean;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUserData | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(null);
  const [period, setPeriod] = useState("current");
  const [loading, setLoading] = useState(true);
  const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);

  function fetchLeaderboard(seasonId?: string | null, periodFilter?: string) {
    setLoading(true);
    let url = "/api/leaderboard?";
    if (seasonId) url += `seasonId=${seasonId}&`;
    if (periodFilter) url += `period=${periodFilter}`;
    
    fetch(url)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setLeaderboard(res.data.leaderboard);
          setCurrentUser(res.data.currentUser);
          setSeasons(res.data.seasons || []);
        }
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  function switchSeason(seasonId: string | null) {
    setActiveSeasonId(seasonId);
    setSeasonDropdownOpen(false);
    fetchLeaderboard(seasonId);
  }

  function switchPeriod(newPeriod: string) {
    setPeriod(newPeriod);
    setActiveSeasonId(null);
    fetchLeaderboard(null, newPeriod);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-[var(--muted)]">
          <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <span>Loading leaderboard...</span>
        </div>
      </div>
    );
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-zinc-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-700" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-[var(--muted)]">{rank}</span>;
    }
  };

  return (      <div className="space-y-6 animate-fade-in">
      {/* Header with Season Selector + Dashboard link */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 stagger-1 animate-fade-in-up">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gradient">Leaderboard</h1>
          <p className="text-[var(--muted)] mt-1">
            See how you stack up against other learners
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Season Selector */}
          {seasons.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setSeasonDropdownOpen(!seasonDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--soft)] transition-colors text-xs font-medium"
              >
                <Calendar className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span className="text-[var(--foreground)]">
                  {activeSeasonId
                    ? seasons.find(s => s.id === activeSeasonId)?.name || "Season"
                    : period === "current" ? "All Time" : period === "weekly" ? "This Week" : "This Month"}
                </span>
                <ChevronDown className={`w-3 h-3 text-[var(--muted)] transition-transform ${seasonDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {seasonDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSeasonDropdownOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-[var(--border)] bg-[var(--surface)] shadow-lg z-20 overflow-hidden animate-scale-in">
                    <button
                      onClick={() => { setPeriod("current"); setActiveSeasonId(null); setSeasonDropdownOpen(false); fetchLeaderboard(null, "current"); }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${period === "current" && !activeSeasonId ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium" : "text-[var(--foreground)] hover:bg-[var(--soft)]"}`}
                    >
                      All Time
                    </button>
                    <button
                      onClick={() => switchPeriod("weekly")}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${period === "weekly" ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium" : "text-[var(--foreground)] hover:bg-[var(--soft)]"}`}
                    >
                      This Week
                    </button>
                    <button
                      onClick={() => switchPeriod("monthly")}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${period === "monthly" ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium" : "text-[var(--foreground)] hover:bg-[var(--soft)]"}`}
                    >
                      This Month
                    </button>
                    {seasons.length > 0 && <div className="h-px bg-[var(--border)] mx-3" />}
                    {seasons.map((season) => (
                      <button
                        key={season.id}
                        onClick={() => switchSeason(season.id)}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${activeSeasonId === season.id ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium" : "text-[var(--foreground)] hover:bg-[var(--soft)]"}`}
                      >
                        <span className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5" />
                          {season.name}
                          {season.isActive && <span className="text-[10px] text-emerald-500 font-normal">Active</span>}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <ArrowLeft className="w-3 h-3" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Current User Stats */}
      {currentUser && (
        <Card className="glass stagger-2 animate-fade-in-up overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-[var(--muted)]">Your Rank</p>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    #{currentUser.rank}
                    <span className="text-sm text-[var(--muted)] font-normal">
                      {" "}of {currentUser.totalLearners}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-[var(--muted)]">Percentile</p>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {currentUser.percentile}%
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-[var(--muted)]">Your Score</p>
                  <p className="text-2xl font-bold text-[var(--foreground)]">
                    {currentUser.overallScore}%
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 text-center text-sm text-[var(--muted)]">
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                Ahead of {currentUser.percentile}% of learners
              </span>
              {" "}— Keep up the great work!
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard Table */}
      <Card className="glass stagger-3 animate-fade-in-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-[var(--foreground)]">
            <Users className="w-5 h-5 text-[var(--primary)]" />
            Top Learners
          </CardTitle>
          <CardDescription>
            Rankings based on overall mastery score
          </CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboard.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Users className="w-10 h-10 text-[var(--border)]" />
              <p className="text-[var(--muted)]">No learners yet</p>
              <p className="text-sm text-[var(--muted)]">Be the first to take a quiz!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                <div className="col-span-1">Rank</div>
                <div className="col-span-4">Name</div>
                <div className="col-span-2 text-center">Tier</div>
                <div className="col-span-2 text-center">Score</div>
                <div className="col-span-2 text-center">Concepts</div>
                <div className="col-span-1 text-center">Accuracy</div>
              </div>

              {leaderboard.map((entry) => {
                const initials = entry.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-2 md:grid-cols-12 gap-4 items-center p-4 rounded-xl transition-all duration-200 ${
                      entry.isCurrentUser
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800"
                        : "hover:bg-[var(--soft)] border border-transparent"
                    }`}
                  >
                    {/* Rank */}
                    <div className="flex items-center gap-2 md:col-span-1">
                      {getRankIcon(entry.rank)}
                      {entry.rank <= 3 && (
                        <span className="block md:hidden text-xs text-[var(--muted)]">#{entry.rank}</span>
                      )}
                    </div>

                    {/* Name & Avatar */}
                    <div className="flex items-center gap-3 md:col-span-4 md:ml-0">
                      <Avatar className={`h-8 w-8 ${entry.isCurrentUser ? "ring-2 ring-emerald-400" : ""}`}>
                        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          {entry.name}
                          {entry.isCurrentUser && (
                            <Badge variant="default" className="ml-2 text-[10px] py-0">You</Badge>
                          )}
                        </p>
                        <p className="text-xs text-[var(--muted)] md:hidden">
                          {entry.overallScore}% • {entry.conceptsCount} concepts
                        </p>
                      </div>
                    </div>

                    {/* Tier (hidden on mobile) */}
                    <div className="hidden md:flex md:col-span-2 justify-center">
                      {entry.tier && (
                        <Badge
                          variant="secondary"
                          className="text-xs"
                          style={{ borderColor: entry.tier.color, color: entry.tier.color }}
                        >
                          {entry.tier.icon} {entry.tier.name}
                        </Badge>
                      )}
                    </div>

                    {/* Score (hidden on mobile) */}
                    <div className="hidden md:flex md:col-span-2 justify-center">
                      <span className="text-sm font-semibold text-[var(--foreground)]">{entry.overallScore}%</span>
                    </div>

                    {/* Concepts (hidden on mobile) */}
                    <div className="hidden md:flex md:col-span-2 justify-center">
                      <span className="text-sm text-[var(--muted)]">{entry.conceptsCount}</span>
                    </div>

                    {/* Accuracy (hidden on mobile) */}
                    <div className="hidden md:flex md:col-span-1 justify-center">
                      <span className="text-sm text-[var(--muted)]">{entry.correctRate}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
