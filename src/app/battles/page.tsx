"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

export default function BattlesPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [tracks, setTracks] = useState<Array<{ id: string; name: string; icon: string }>>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const [challenging, setChallenging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"battles" | "challenge" | "ai">("battles");

  useEffect(() => {
    Promise.all([
      fetch("/api/battles").then((r) => r.json()),
      fetch("/api/dashboard").then((r) => r.json()),
    ]).then(([battleRes, dashRes]) => {
      if (battleRes.success) setData(battleRes.data);
      if (dashRes.success && dashRes.data.allTracks) {
        setTracks(dashRes.data.allTracks);
        if (!selectedTrackId && dashRes.data.allTracks.length > 0) {
          setSelectedTrackId(dashRes.data.allTracks[0].id);
        }
      }
    }).finally(() => setLoading(false));
  }, []);

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
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setActiveTab(activeTab === "battles" ? "challenge" : "battles")}
              size="sm"
              className="gap-1.5"
            >
              {activeTab === "battles" ? (
                <><Send className="w-3.5 h-3.5" /> Challenge</>
              ) : (
                <><Swords className="w-3.5 h-3.5" /> My Battles</>
              )}
            </Button>
            <Button
              onClick={() => setActiveTab("ai")}
              size="sm"
              variant={activeTab === "ai" ? "default" : "outline"}
              className="gap-1.5"
            >
              <Zap className="w-3.5 h-3.5" /> vs AI
            </Button>
          </div>
        </div>
      </div>

      {activeTab === "battles" ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 stagger-2 animate-fade-in-up">
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
      ) : (
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
                    try { const res = await fetch("/api/battles/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ trackId: selectedTrackId, difficulty: d.id }) }); const data = await res.json(); if (data.success) router.push(`/battles/${data.data.id}`); } catch {}
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
      )}
    </div>
  );
}
