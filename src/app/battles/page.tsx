"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { CEO_PERSONAS } from "@/lib/ai-battle";
import {
  Swords,
  Trophy,
  Loader2,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Zap,
  ArrowRight,
  Send,
  ArrowLeft,
  Home,
  Medal,
  Crown,
  TrendingUp,
  Gauge,
  Target,
  BarChart3,
} from "lucide-react";

interface Battle {
  id: string;
  type: "challenge" | "invite";
  status: "pending" | "accepted" | "completed" | "declined";
  opponent_name: string;
  opponent_avatar: string;
  track_name: string;
  track_icon: string;
  challenger_score: number | null;
  opponent_score: number | null;
  created_at: string;
  completed_at: string | null;
}

interface Opponent {
  id: string;
  name: string;
  avatarUrl: string | null;
  tier: { name: string; color: string; icon: string } | null;
  quizCount: number;
}

interface BattleLeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  tier: { name: string; color: string; icon: string } | null;
  battlePoints: number;
  wins: number;
  losses: number;
  draws: number;
  totalBattles: number;
  winRate: number;
  isCurrentUser: boolean;
}

export default function BattlesPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [battleLeaderboard, setBattleLeaderboard] = useState<BattleLeaderboardEntry[]>([]);
  const [tracks, setTracks] = useState<Array<{ id: string; name: string; icon: string }>>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const [selectedCeo, setSelectedCeo] = useState<string | null>(null);
  const [challenging, setChallenging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ceoStats, setCeoStats] = useState<any[]>([]);
  const [ceoStatsTotals, setCeoStatsTotals] = useState<any>(null);
  const [ceoStatsLoading, setCeoStatsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"battles" | "challenge" | "ai" | "leaderboard" | "ceo-stats">("battles");

  useEffect(() => {
    Promise.all([
      fetch("/api/battles").then((r) => r.json()),
      fetch("/api/dashboard").then((r) => r.json()),
      fetch("/api/leaderboard/battles").then((r) => r.json()),
      fetch("/api/leaderboard/ceo-stats").then((r) => r.json()),
    ]).then(([battleRes, dashRes, lbRes, ceoRes]) => {
      if (battleRes.success) setData(battleRes.data);
      if (dashRes.success && dashRes.data.allTracks) {
        setTracks(dashRes.data.allTracks);
        if (!selectedTrackId && dashRes.data.allTracks.length > 0) {
          setSelectedTrackId(dashRes.data.allTracks[0].id);
        }
      }
      if (lbRes.success) setBattleLeaderboard(lbRes.data.leaderboard);
      if (ceoRes.success) {
        setCeoStats(ceoRes.data.stats);
        setCeoStatsTotals(ceoRes.data.totals);
      }
    }).finally(() => setLoading(false));
  }, []);

  function fetchCeoStats() {
    setCeoStatsLoading(true);
    fetch("/api/leaderboard/ceo-stats")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setCeoStats(res.data.stats);
          setCeoStatsTotals(res.data.totals);
        }
      })
      .finally(() => setCeoStatsLoading(false));
  }

  useEffect(() => {
    if (activeTab === "ceo-stats") {
      fetchCeoStats();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-[var(--muted)]">
          <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <span>Loading battles...</span>
        </div>
      </div>
    );
  }

  const battles: Battle[] = data?.battles || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Navigation */}
      <div className="flex items-center gap-2 stagger-1 animate-fade-in-up">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--soft)] transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Dashboard
        </Link>
        <Link
          href="/"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--soft)] transition-all"
        >
          <Home className="w-3.5 h-3.5" />
          Home
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 stagger-1 animate-fade-in-up">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gradient">Quiz Battles</h1>
          <p className="text-[var(--muted)] mt-1">Challenge other learners to a quiz duel!</p>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-none">
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => setActiveTab("battles")}
              size="sm"
              variant={activeTab === "battles" ? "default" : "outline"}
              className="gap-1 text-xs sm:text-sm shrink-0"
            >
              <Swords className="w-3.5 h-3.5 shrink-0" /> <span className="hidden sm:inline">Battles</span>
            </Button>
            <Button
              onClick={() => setActiveTab("challenge")}
              size="sm"
              variant={activeTab === "challenge" ? "default" : "outline"}
              className="gap-1 text-xs sm:text-sm shrink-0"
            >
              <Send className="w-3.5 h-3.5 shrink-0" /> <span className="hidden sm:inline">Challenge</span>
            </Button>
            <Button
              onClick={() => setActiveTab("ai")}
              size="sm"
              variant={activeTab === "ai" ? "default" : "outline"}
              className="gap-1 text-xs sm:text-sm shrink-0"
            >
              <Zap className="w-3.5 h-3.5 shrink-0" /> <span className="hidden sm:inline">vs AI</span>
            </Button>
            <Button
              onClick={() => setActiveTab("leaderboard")}
              size="sm"
              variant={activeTab === "leaderboard" ? "default" : "outline"}
              className="gap-1 text-xs sm:text-sm shrink-0"
            >
              <Medal className="w-3.5 h-3.5 shrink-0" /> <span className="hidden sm:inline">Rankings</span>
            </Button>
            <Button
              onClick={() => { setActiveTab("ceo-stats"); if (ceoStats.length === 0) fetchCeoStats(); }}
              size="sm"
              variant={activeTab === "ceo-stats" ? "default" : "outline"}
              className="gap-1 text-xs sm:text-sm shrink-0"
            >
              <Users className="w-3.5 h-3.5 shrink-0" /> <span className="hidden sm:inline">CEO Stats</span>
            </Button>
          </div>
        </div>
      </div>

      {activeTab === "battles" ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 stagger-2 animate-fade-in-up">
            <Card className="glass card-lift">
              <CardHeader className="pb-1.5">
                <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">
                  <Swords className="w-3 h-3" /> Total Battles
                </CardDescription>
                <CardTitle className="text-2xl text-[var(--foreground)]">{battles.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[var(--muted)]">{battles.filter(b => b.status === "completed").length} completed</p>
              </CardContent>
            </Card>
            <Card className="glass card-lift">
              <CardHeader className="pb-1.5">
                <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">
                  <Trophy className="w-3 h-3" /> Wins
                </CardDescription>
                <CardTitle className="text-2xl text-[var(--foreground)]">
                  {battles.filter(b => b.status === "completed" && ((b.type === "challenge" && b.challenger_score != null && b.opponent_score != null && b.challenger_score > b.opponent_score) || (b.type === "invite" && b.challenger_score != null && b.opponent_score != null && b.opponent_score > b.challenger_score))).length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[var(--muted)]">{battles.filter(b => b.status === "completed" && b.challenger_score != null && b.opponent_score != null && b.challenger_score === b.opponent_score).length} draws</p>
              </CardContent>
            </Card>
            <Card className="glass card-lift">
              <CardHeader className="pb-1.5">
                <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">
                  <Medal className="w-3 h-3" /> League Points
                </CardDescription>
                <CardTitle className="text-2xl text-amber-500">
                  {battleLeaderboard.find(e => e.isCurrentUser)?.battlePoints || 0}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[var(--muted)]">
                  Rank #{battleLeaderboard.find(e => e.isCurrentUser)?.rank || '-'} • {battleLeaderboard.find(e => e.isCurrentUser)?.winRate || 0}% win rate
                </p>
              </CardContent>
            </Card>
            <Card className="glass card-lift">
              <CardHeader className="pb-1.5">
                <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">
                  <Users className="w-3 h-3" /> Available
                </CardDescription>
                <CardTitle className="text-2xl text-[var(--foreground)]">{data?.opponents?.length || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[var(--muted)]">Ready to challenge</p>
              </CardContent>
            </Card>
          </div>

          <Card className="glass stagger-3 animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
                <Swords className="w-4 h-4 text-[var(--primary)]" /> Your Battles
              </CardTitle>
              <CardDescription>Past and pending quiz duels</CardDescription>
            </CardHeader>
            <CardContent>
              {battles.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <Swords className="w-12 h-12 text-[var(--muted)]/30" />
                  <p className="text-sm font-medium text-[var(--foreground)]">No battles yet</p>
                  <Button size="sm" onClick={() => setActiveTab("challenge")} className="gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Find Opponent
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {battles.map((b) => {
                    const isWin = b.type === "challenge" ? (b.challenger_score || 0) > (b.opponent_score || 0) : (b.opponent_score || 0) > (b.challenger_score || 0);
                    const isDraw = b.challenger_score === b.opponent_score;
                    return (
                      <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] card-lift">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${b.status === "completed" ? (isWin ? "bg-emerald-500/20" : "bg-red-500/20") : b.status === "pending" ? "bg-amber-500/20" : "bg-[var(--soft)]"}`}>
                            {b.status === "completed" ? (isWin ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : isDraw ? <Zap className="w-4 h-4 text-amber-500" /> : <XCircle className="w-4 h-4 text-red-500" />) : b.status === "pending" ? <Clock className="w-4 h-4 text-amber-500" /> : <XCircle className="w-4 h-4 text-[var(--muted)]" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate text-[var(--foreground)]">vs {b.type === "challenge" ? b.opponent_name : b.opponent_name}</p>
                            <p className="text-xs text-[var(--muted)]">{b.track_icon} {b.track_name} • {new Date(b.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>
                        {b.status === "completed" && b.challenger_score != null && b.opponent_score != null && (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-sm font-bold ${isWin ? "text-emerald-500" : "text-red-500"}`}>{b.type === "challenge" ? b.challenger_score : b.opponent_score}%</span>
                            <span className="text-xs text-[var(--muted)]">vs</span>
                            <span className="text-sm font-bold text-[var(--muted)]">{b.type === "challenge" ? b.opponent_score : b.challenger_score}%</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : activeTab === "challenge" ? (
        <>
          {tracks.length > 0 && (
            <div className="stagger-2 animate-fade-in-up space-y-2">
              <p className="text-sm font-medium text-[var(--muted)]">Select Track for Battle</p>
              <div className="flex flex-wrap gap-2">
                {tracks.map((track) => (
                  <button key={track.id} onClick={() => setSelectedTrackId(track.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${selectedTrackId === track.id ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30" : "bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--primary)]/30"}`}
                  >{track.icon} {track.name}</button>
                ))}
              </div>
            </div>
          )}
          <Card className="glass stagger-2 animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
                <Users className="w-4 h-4 text-[var(--primary)]" /> Available Opponents
              </CardTitle>
              <CardDescription>Select someone to challenge to a quiz battle</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.opponents?.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <Users className="w-12 h-12 text-[var(--muted)]/30" />
                  <p className="text-sm font-medium text-[var(--foreground)]">No opponents available</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data?.opponents?.map((opponent: Opponent) => (
                    <div key={opponent.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] card-lift">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-9 w-9">
                          {opponent.avatarUrl && <AvatarImage src={opponent.avatarUrl} alt={opponent.name} />}
                          <AvatarFallback className="text-xs bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] text-[var(--background)]">{opponent.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate text-[var(--foreground)]">{opponent.name}</p>
                          <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                            {opponent.tier && <span style={{ color: opponent.tier.color }}>{opponent.tier.icon}</span>}
                            <span>{opponent.quizCount} quizzes</span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0 gap-1" disabled={challenging || !selectedTrackId} onClick={async () => {
                        if (!selectedTrackId) return; setChallenging(true);
                        try { const res = await fetch("/api/battles/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ opponentId: opponent.id, trackId: selectedTrackId }) }); const d = await res.json(); if (d.success) router.push(`/battles/${d.data.id}`); } catch {}
                        setChallenging(false);
                      }}>
                        {challenging ? <Loader2 className="w-3 h-3 animate-spin" /> : <Swords className="w-3 h-3" />} Challenge
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : activeTab === "ai" ? (
        <>
          {tracks.length > 0 && (
            <div className="stagger-2 animate-fade-in-up space-y-2">
              <p className="text-sm font-medium text-[var(--muted)]">Select Track for AI Battle</p>
              <div className="flex flex-wrap gap-2">
                {tracks.map((track) => (
                  <button key={track.id} onClick={() => setSelectedTrackId(track.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${selectedTrackId === track.id ? "bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/30" : "bg-[var(--surface)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--primary)]/30"}`}
                  >{track.icon} {track.name}</button>
                ))}
              </div>
            </div>
          )}

          {/* CEO Selector */}
          {selectedTrackId && (
            <div className="stagger-2 animate-fade-in-up space-y-2">
              <p className="text-sm font-medium text-[var(--muted)]">
                Choose Your Opponent {selectedCeo ? `— ${CEO_PERSONAS.find(c => c.name === selectedCeo)?.emoji || ""} ${selectedCeo}` : "(random if none selected)"}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {CEO_PERSONAS.map((ceo) => {
                  const isSelected = selectedCeo === ceo.name;
                  return (
                    <button
                      key={ceo.name}
                      onClick={() => setSelectedCeo(isSelected ? null : ceo.name)}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all duration-200 ${
                        isSelected
                          ? "border-amber-500 bg-amber-500/10 shadow-md"
                          : "border-[var(--border)] hover:border-amber-500/40 bg-[var(--surface)]"
                      }`}
                    >
                      <span className="text-xl">{ceo.emoji}</span>
                      <span className="text-[10px] font-medium text-center leading-tight text-[var(--foreground)]">
                        {ceo.name.split(" ")[0]}
                      </span>
                      <span className="text-[8px] text-[var(--muted)] text-center">
                        {ceo.name.split(" ").slice(1).join(" ")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <Card className="glass stagger-2 animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
                <Zap className="w-4 h-4 text-amber-500" /> Battle an AI Opponent
              </CardTitle>
              <CardDescription>Choose your difficulty and face a famous tech CEO!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: "easy", label: "Easy", icon: "🌱", desc: "Slow, less accurate", color: "emerald" },
                  { id: "medium", label: "Medium", icon: "⚡", desc: "Moderate speed & accuracy", color: "amber" },
                  { id: "hard", label: "Hard", icon: "🔥", desc: "Fast & highly accurate!", color: "red" },
                ].map((d) => (
                  <Button key={d.id} size="lg" disabled={!selectedTrackId || challenging} onClick={async () => {
                    if (!selectedTrackId) return; setChallenging(true);
                    try {
                      const body: any = { trackId: selectedTrackId, difficulty: d.id };
                      if (selectedCeo) body.ceoName = selectedCeo;
                      const res = await fetch("/api/battles/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
                      const data = await res.json();
                      if (data.success) router.push(`/battles/${data.data.id}`);
                    } catch {}
                    setChallenging(false);
                  }} className={`h-auto py-4 flex-col gap-1 ${d.color === "emerald" ? "bg-gradient-to-br from-emerald-600 to-emerald-700" : d.color === "amber" ? "bg-gradient-to-br from-amber-600 to-orange-600" : "bg-gradient-to-br from-red-600 to-orange-600"}`}>
                    <span className="text-2xl">{d.icon}</span>
                    <span className="font-bold">{d.label}</span>
                    <span className="text-[10px] opacity-80">{d.desc}</span>
                  </Button>
                ))}
              </div>
              {!selectedTrackId && <p className="text-xs text-amber-500 mt-2 text-center">Select a track first!</p>}
            </CardContent>
          </Card>
        </>
      ) : activeTab === "ceo-stats" ? (
        <>
          {/* CEO Stats Header */}
          {ceoStatsTotals && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 stagger-2 animate-fade-in-up">
              <Card className="glass card-lift">
                <CardHeader className="pb-1.5">
                  <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">
                    <Swords className="w-3 h-3" /> AI Battles
                  </CardDescription>
                  <CardTitle className="text-2xl text-[var(--foreground)]">{ceoStatsTotals.totalAiBattles}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-[var(--muted)]">Across {ceoStatsTotals.ceosFaced} CEO{ceoStatsTotals.ceosFaced !== 1 ? "s" : ""}</p>
                </CardContent>
              </Card>
              <Card className="glass card-lift">
                <CardHeader className="pb-1.5">
                  <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">
                    <Trophy className="w-3 h-3" /> Wins
                  </CardDescription>
                  <CardTitle className="text-2xl text-emerald-500">{ceoStatsTotals.totalWins}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-[var(--muted)]">{ceoStatsTotals.totalLosses} losses</p>
                </CardContent>
              </Card>
              <Card className="glass card-lift">
                <CardHeader className="pb-1.5">
                  <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">
                    <Target className="w-3 h-3" /> Win Rate
                  </CardDescription>
                  <CardTitle className="text-2xl text-amber-500">{ceoStatsTotals.overallWinRate}%</CardTitle>
                </CardHeader>
                <CardContent>
                  <Progress value={ceoStatsTotals.overallWinRate} className="h-1.5" />
                </CardContent>
              </Card>
              <Card className="glass card-lift">
                <CardHeader className="pb-1.5">
                  <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">
                    <Users className="w-3 h-3" /> Win/Loss Ratio
                  </CardDescription>
                  <CardTitle className="text-2xl text-[var(--foreground)]">
                    {ceoStatsTotals.totalLosses > 0
                      ? (ceoStatsTotals.totalWins / ceoStatsTotals.totalLosses).toFixed(2)
                      : ceoStatsTotals.totalWins > 0 ? "∞" : "—"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-[var(--muted)]">Wins per loss</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* CEO Stats Table */}
          <Card className="glass stagger-2 animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
                <Users className="w-4 h-4 text-amber-500" />
                CEO Battle Records
              </CardTitle>
              <CardDescription>Your win/loss record against each CEO persona</CardDescription>
            </CardHeader>
            <CardContent>
              {ceoStatsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--muted)]" />
                </div>
              ) : ceoStats.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <Users className="w-12 h-12 text-[var(--muted)]/30" />
                  <p className="text-sm font-medium text-[var(--foreground)]">No AI battle records yet</p>
                  <p className="text-xs text-[var(--muted)]">Face some AI CEO opponents to build your record!</p>
                  <Button size="sm" onClick={() => setActiveTab("ai")} className="gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Battle AI
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Table Header */}
                  <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                    <div className="col-span-3">CEO</div>
                    <div className="col-span-1 text-center">Difficulty</div>
                    <div className="col-span-1 text-center">W</div>
                    <div className="col-span-1 text-center">L</div>
                    <div className="col-span-1 text-center">D</div>
                    <div className="col-span-2 text-center">Win Rate</div>
                    <div className="col-span-2 text-center">Avg Score</div>
                    <div className="col-span-1 text-center">Total</div>
                  </div>

                  {ceoStats.map((stat: any) => {
                    const diffSummary = Object.entries(stat.difficulties)
                      .sort(([, a]: any, [, b]: any) => b - a)
                      .map(([d, count]) => `${d.charAt(0).toUpperCase() + d.slice(1)} (${count})`)
                      .join(", ");

                    return (
                      <div
                        key={stat.ceoName}
                        className="grid grid-cols-3 md:grid-cols-12 gap-4 items-center p-3 rounded-xl border border-[var(--border)] hover:bg-[var(--soft)] transition-all duration-200"
                      >
                        {/* CEO */}
                        <div className="flex items-center gap-3 md:col-span-3">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-sm"
                            style={{ backgroundColor: stat.color + "20" }}
                          >
                            {stat.emoji}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--foreground)]">{stat.ceoName}</p>
                            <p className="text-[10px] text-[var(--muted)] truncate">{stat.title}</p>
                          </div>
                        </div>

                        {/* Difficulty */}
                        <div className="hidden md:flex md:col-span-1 justify-center">
                          <span className="text-[10px] text-[var(--muted)]" title={diffSummary}>
                            {Object.keys(stat.difficulties).length > 0
                              ? Object.entries(stat.difficulties)
                                  .sort(([, a]: any, [, b]: any) => b - a)[0][0]
                              : "—"}
                          </span>
                        </div>

                        {/* W */}
                        <div className="hidden md:flex md:col-span-1 justify-center">
                          <span className="text-sm font-bold text-emerald-500">{stat.wins}</span>
                        </div>

                        {/* L */}
                        <div className="hidden md:flex md:col-span-1 justify-center">
                          <span className="text-sm font-bold text-red-500">{stat.losses}</span>
                        </div>

                        {/* D */}
                        <div className="hidden md:flex md:col-span-1 justify-center">
                          <span className="text-sm text-[var(--muted)]">{stat.draws}</span>
                        </div>

                        {/* Win Rate */}
                        <div className="hidden md:flex md:col-span-2 justify-center">
                          <div className="flex items-center gap-1.5 w-full max-w-[80px]">
                            <div className="flex-1 h-1.5 rounded-full bg-[var(--soft)] overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  stat.winRate >= 60 ? "bg-emerald-500" : stat.winRate >= 40 ? "bg-amber-500" : "bg-red-500"
                                }`}
                                style={{ width: `${stat.winRate}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-[var(--muted)] w-8 text-right">{stat.winRate}%</span>
                          </div>
                        </div>

                        {/* Avg Score */}
                        <div className="hidden md:flex md:col-span-2 justify-center">
                          <span className="text-xs text-[var(--muted)]">
                            {stat.avgScore} vs {stat.avgOpponentScore}
                          </span>
                        </div>

                        {/* Total */}
                        <div className="hidden md:flex md:col-span-1 justify-center">
                          <span className="text-xs font-medium text-[var(--foreground)]">{stat.totalBattles}</span>
                        </div>

                        {/* Mobile friendly */}
                        <div className="flex items-center gap-2 md:hidden col-span-2 justify-end">
                          <span className="text-xs font-medium text-emerald-500">{stat.wins}W</span>
                          <span className="text-xs font-medium text-red-500">{stat.losses}L</span>
                          {stat.draws > 0 && <span className="text-xs text-[var(--muted)]">{stat.draws}D</span>}
                          <span className="text-xs text-[var(--muted)] ml-1">{stat.winRate}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* See all CEOs */}
          {ceoStats.length > 0 && ceoStats.length < CEO_PERSONAS.length && (
            <Card className="glass stagger-3 animate-fade-in-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
                  <Target className="w-4 h-4 text-[var(--primary)]" />
                  Unfaced CEOs
                </CardTitle>
                <CardDescription>You haven't battled these CEOs yet — challenge them!</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {CEO_PERSONAS.filter(
                    (ceo) => !ceoStats.some((s: any) => s.ceoName === ceo.name)
                  ).map((ceo) => (
                    <button
                      key={ceo.name}
                      onClick={() => { setActiveTab("ai"); setSelectedCeo(ceo.name); }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)] hover:border-amber-500/40 hover:bg-amber-500/5 transition-all text-xs"
                    >
                      <span>{ceo.emoji}</span>
                      <span className="text-[var(--muted)]">{ceo.name}</span>
                      <span className="text-[10px] text-amber-500">Battle →</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <>
          {/* Battle Leaderboard */}
          <div className="stagger-2 animate-fade-in-up">
            <Card className="glass overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-yellow-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
                  <Medal className="w-4 h-4 text-amber-500" />
                  Battle Rankings
                </CardTitle>
                <CardDescription>Top fighters ranked by battle league points</CardDescription>
              </CardHeader>
              <CardContent>
                {battleLeaderboard.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <Swords className="w-12 h-12 text-[var(--muted)]/30" />
                    <p className="text-sm font-medium text-[var(--foreground)]">No battle rankings yet</p>
                    <p className="text-xs text-[var(--muted)]">Complete a battle to earn league points and appear on the leaderboard!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Table Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium uppercase tracking-wider text-[var(--muted)]">
                      <div className="col-span-1">Rank</div>
                      <div className="col-span-3">Name</div>
                      <div className="col-span-2 text-center">Points</div>
                      <div className="col-span-2 text-center">W/L</div>
                      <div className="col-span-2 text-center">Win Rate</div>
                      <div className="col-span-2 text-center">Total</div>
                    </div>
                    {battleLeaderboard.slice(0, 20).map((entry) => (
                      <div
                        key={entry.userId}
                        className={`grid grid-cols-2 md:grid-cols-12 gap-4 items-center p-3 rounded-xl transition-all duration-200 ${
                          entry.isCurrentUser
                            ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
                            : "hover:bg-[var(--soft)] border border-transparent"
                        }`}
                      >
                        {/* Rank */}
                        <div className="flex items-center gap-2 md:col-span-1">
                          {entry.rank <= 3 ? (
                            entry.rank === 1 ? (
                              <Crown className="w-5 h-5 text-yellow-500" />
                            ) : (
                              <Medal className={`w-5 h-5 ${entry.rank === 2 ? "text-zinc-400" : "text-amber-700"}`} />
                            )
                          ) : (
                            <span className="w-5 h-5 flex items-center justify-center text-sm font-bold text-[var(--muted)]">
                              {entry.rank}
                            </span>
                          )}
                        </div>

                        {/* Name */}
                        <div className="flex items-center gap-2 md:col-span-3">
                          <div>
                            <p className="text-sm font-medium text-[var(--foreground)]">
                              {entry.name}
                              {entry.isCurrentUser && (
                                <Badge variant="default" className="ml-2 text-[10px] py-0 bg-amber-500 hover:bg-amber-600">You</Badge>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Points */}
                        <div className="hidden md:flex md:col-span-2 justify-center">
                          <span className="text-sm font-bold text-amber-500 dark:text-amber-400">
                            {entry.battlePoints}
                          </span>
                        </div>

                        {/* W/L */}
                        <div className="hidden md:flex md:col-span-2 justify-center gap-2">
                          <span className="text-xs font-medium text-emerald-500">{entry.wins}W</span>
                          <span className="text-xs font-medium text-red-500">{entry.losses}L</span>
                          {entry.draws > 0 && (
                            <span className="text-xs font-medium text-[var(--muted)]">{entry.draws}D</span>
                          )}
                        </div>

                        {/* Win Rate */}
                        <div className="hidden md:flex md:col-span-2 justify-center">
                          <div className="flex items-center gap-1.5">
                            <div className="w-14 h-1.5 rounded-full bg-[var(--soft)] overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  entry.winRate >= 60 ? "bg-emerald-500" : entry.winRate >= 40 ? "bg-amber-500" : "bg-red-500"
                                }`}
                                style={{ width: `${entry.winRate}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-[var(--muted)]">{entry.winRate}%</span>
                          </div>
                        </div>

                        {/* Total */}
                        <div className="hidden md:flex md:col-span-2 justify-center">
                          <span className="text-xs text-[var(--muted)]">{entry.totalBattles}</span>
                        </div>

                        {/* Mobile summary */}
                        <p className="text-xs text-[var(--muted)] md:hidden col-span-1">
                          {entry.battlePoints} pts • {entry.winRate}%
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Scoring Info */}
          <Card className="glass stagger-3 animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
                <BarChart3 className="w-4 h-4 text-[var(--primary)]" />
                How Battle Points Work
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                  <p className="text-lg font-bold text-emerald-500">Win</p>
                  <p className="text-2xl font-bold text-[var(--foreground)]">+100</p>
                  <p className="text-xs text-[var(--muted)] mt-1">Base + up to 150 bonus for big score difference</p>
                </div>
                <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                  <p className="text-lg font-bold text-amber-500">Draw</p>
                  <p className="text-2xl font-bold text-[var(--foreground)]">+20</p>
                  <p className="text-xs text-[var(--muted)] mt-1">Both players earn points for a tie</p>
                </div>
                <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5">
                  <p className="text-lg font-bold text-red-500">Loss</p>
                  <p className="text-2xl font-bold text-[var(--foreground)]">+10</p>
                  <p className="text-xs text-[var(--muted)] mt-1">Participation points — everyone earns something</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
