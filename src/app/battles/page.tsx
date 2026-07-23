"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"battles" | "challenge">("battles");

  useEffect(() => {
    fetch("/api/battles")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
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
          <Button
            onClick={() => setActiveTab(activeTab === "battles" ? "challenge" : "battles")}
            size="sm"
            className="gap-1.5"
          >
            {activeTab === "battles" ? (
              <><Send className="w-3.5 h-3.5" /> Challenge Someone</>
            ) : (
              <><Swords className="w-3.5 h-3.5" /> My Battles</>
            )}
          </Button>
        </div>
      </div>

      {activeTab === "battles" ? (
        <>
          {/* Battle Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 stagger-2 animate-fade-in-up">
            <Card className="glass card-lift">
              <CardHeader className="pb-1.5">
                <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">
                  <Swords className="w-3 h-3" /> Total Battles
                </CardDescription>
                <CardTitle className="text-2xl text-[var(--foreground)]">{battles.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[var(--muted)]">
                  {battles.filter(b => b.status === "completed").length} completed
                </p>
              </CardContent>
            </Card>

            <Card className="glass card-lift">
              <CardHeader className="pb-1.5">
                <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">
                  <Trophy className="w-3 h-3" /> Wins
                </CardDescription>
                <CardTitle className="text-2xl text-[var(--foreground)]">
                  {battles.filter(b => {
                    if (b.status !== "completed") return false;
                    if (b.type === "challenge" && b.challenger_score != null && b.opponent_score != null) {
                      return b.challenger_score > b.opponent_score;
                    }
                    if (b.type === "invite" && b.challenger_score != null && b.opponent_score != null) {
                      return b.opponent_score > b.challenger_score;
                    }
                    return false;
                  }).length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[var(--muted)]">
                  {battles.filter(b => b.status === "completed" && b.challenger_score != null && b.opponent_score != null && b.challenger_score === b.opponent_score).length} draws
                </p>
              </CardContent>
            </Card>

            <Card className="glass card-lift">
              <CardHeader className="pb-1.5">
                <CardDescription className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">
                  <Users className="w-3 h-3" /> Available Players
                </CardDescription>
                <CardTitle className="text-2xl text-[var(--foreground)]">{data?.opponents?.length || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-[var(--muted)]">Ready to challenge</p>
              </CardContent>
            </Card>
          </div>

          {/* Battle List */}
          <Card className="glass stagger-3 animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
                <Swords className="w-4 h-4 text-[var(--primary)]" />
                Your Battles
              </CardTitle>
              <CardDescription>Past and pending quiz duels</CardDescription>
            </CardHeader>
            <CardContent>
              {battles.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <Swords className="w-12 h-12 text-[var(--muted)]/30" />
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">No battles yet</p>
                    <p className="text-xs text-[var(--muted)] mt-1">Challenge someone to your first quiz duel!</p>
                  </div>
                  <Button size="sm" onClick={() => setActiveTab("challenge")} className="gap-1.5 mt-1">
                    <Zap className="w-3.5 h-3.5" /> Find Opponent
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {battles.map((battle) => {
                    const isWin = battle.type === "challenge"
                      ? (battle.challenger_score || 0) > (battle.opponent_score || 0)
                      : (battle.opponent_score || 0) > (battle.challenger_score || 0);
                    const isDraw = battle.challenger_score === battle.opponent_score;
                    const otherName = battle.type === "challenge" ? battle.opponent_name : battle.opponent_name;

                    return (
                      <div key={battle.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] card-lift">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center ${
                            battle.status === "completed" ? (isWin ? "bg-emerald-500/20" : "bg-red-500/20") :
                            battle.status === "pending" ? "bg-amber-500/20" : "bg-[var(--soft)]"
                          }`}>
                            {battle.status === "completed" ? (
                              isWin ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                              isDraw ? <Zap className="w-4 h-4 text-amber-500" /> :
                              <XCircle className="w-4 h-4 text-red-500" />
                            ) : battle.status === "pending" ? (
                              <Clock className="w-4 h-4 text-amber-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-[var(--muted)]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-medium truncate text-[var(--foreground)]">
                                vs {otherName}
                              </p>
                              <Badge variant={battle.status === "completed" ? "secondary" : battle.status === "pending" ? "warning" : "destructive"} className="text-[10px] capitalize">
                                {battle.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-[var(--muted)]">
                              {battle.track_icon} {battle.track_name} • {new Date(battle.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {battle.status === "completed" && battle.challenger_score != null && battle.opponent_score != null && (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`text-sm font-bold ${isWin ? "text-emerald-500" : "text-red-500"}`}>
                              {battle.type === "challenge" ? battle.challenger_score : battle.opponent_score}%
                            </span>
                            <span className="text-xs text-[var(--muted)]">vs</span>
                            <span className="text-sm font-bold text-[var(--muted)]">
                              {battle.type === "challenge" ? battle.opponent_score : battle.challenger_score}%
                            </span>
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
      ) : (
        <>
          {/* Opponents List */}
          <Card className="glass stagger-2 animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-[var(--foreground)]">
                <Users className="w-4 h-4 text-[var(--primary)]" />
                Available Opponents
              </CardTitle>
              <CardDescription>Select someone to challenge to a quiz battle</CardDescription>
            </CardHeader>
            <CardContent>
              {data?.opponents?.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <Users className="w-12 h-12 text-[var(--muted)]/30" />
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">No opponents available</p>
                    <p className="text-xs text-[var(--muted)] mt-1">Invite friends to join the platform!</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {data?.opponents?.map((opponent: Opponent) => (
                    <div key={opponent.id} className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] card-lift">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-9 w-9">
                          {opponent.avatarUrl && <AvatarImage src={opponent.avatarUrl} alt={opponent.name} />}
                          <AvatarFallback className="text-xs bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] text-[var(--background)]">
                            {opponent.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate text-[var(--foreground)]">{opponent.name}</p>
                          <div className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                            {opponent.tier && <span style={{ color: opponent.tier.color }}>{opponent.tier.icon}</span>}
                            <span>{opponent.quizCount} quizzes</span>
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0 gap-1">
                        <Swords className="w-3 h-3" /> Challenge
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-[var(--muted)]">
              Battles use random questions from your selected track. Highest score wins! 🏆
            </p>
          </div>
        </>
      )}
    </div>
  );
}
