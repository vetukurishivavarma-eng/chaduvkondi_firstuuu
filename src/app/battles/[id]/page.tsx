"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Swords,
  Users,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Check,
  ArrowLeft,
  Trophy,
  Zap,
  Clock,
  Gauge,
  User,
  Target,
} from "lucide-react";

type BattlePhase = "lobby" | "active" | "results";

interface BattleChoice {
  id: string;
  text: string;
}

interface BattleQuestionData {
  id: string;
  questionId: string;
  order: number;
  text: string;
  conceptName: string;
  choices: BattleChoice[];
  myAnswer: { choiceId: string; isCorrect: boolean; points: number } | null;
  opponentAnswer: { choiceId: string; isCorrect: boolean; points: number } | null;
  answerCount: number;
  allAnswers: { userId: string; userName: string; choiceId: string; isCorrect: boolean; points: number }[];
}

interface BattleStatus {
  id: string;
  status: string;
  currentQuestion: number;
  questionCount: number;
  readyChallenger: boolean;
  readyOpponent: boolean;
  isChallenger: boolean;
  isAi: boolean;
  myName: string;
  opponentName: string;
  opponentAvatar: string | null;
  opponentMood: string;
  aiCeoName: string | null;
  aiDifficulty: string | null;
  track: { name: string; icon: string; color: string };
  myScore: number;
  opponentScore: number;
  currentQuestionData: BattleQuestionData | null;
  questions: BattleQuestionData[];
  hasAnsweredCurrent: boolean;
  bothAnsweredCurrent: boolean;
  myPoints: number;
  opponentPoints: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export default function BattlePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [battleId, setBattleId] = useState<string>("");
  const [battle, setBattle] = useState<BattleStatus | null>(null);
  const [phase, setPhase] = useState<BattlePhase>("lobby");
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [answering, setAnswering] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ready, setReady] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [readyCheckTrigger, setReadyCheckTrigger] = useState(0);
  const POLL_INTERVAL = 1500;

  // Extract battle ID from params
  useEffect(() => {
    params.then((p) => setBattleId(p.id));
  }, [params]);

  // Join battle on mount (opponent side)
  useEffect(() => {
    if (battleId && !joined) {
      fetch(`/api/battles/${battleId}/join`, { method: "POST" })
        .then((r) => r.json())
        .then((res) => {
          if (res.success) {
            setJoined(true);
            if (res.data.status === "ready" || res.data.status === "active" || res.data.status === "completed") {
              fetchStatus();
            }
          } else {
            setError(res.error || "Failed to join battle");
          }
        })
        .catch(() => setError("Network error"));
    }
  }, [battleId]);

  // Fetch battle status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/battles/${battleId}`);
      const data = await res.json();
      if (data.success) {
        setBattle(data.data);
        if (data.data.status === "active") setPhase("active");
        if (data.data.status === "completed") {
          setPhase("results");
          // Stop polling once battle is complete
          if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
          }
        }
      }
    } catch {}
  }, [battleId]);

  // Initial status fetch and polling only during lobby/active
  useEffect(() => {
    if (battleId && joined && phase !== "results") {
      fetchStatus();
      pollingRef.current = setInterval(fetchStatus, POLL_INTERVAL);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [battleId, joined, phase, fetchStatus]);

  // Check ready status every 1.5s
  useEffect(() => {
    if (phase === "lobby" && battle && (battle.readyChallenger || battle.readyOpponent)) {
      const interval = setInterval(fetchStatus, POLL_INTERVAL);
      return () => clearInterval(interval);
    }
  }, [phase, battle?.readyChallenger, battle?.readyOpponent, fetchStatus]);

  // CEO persona helpers
  function getCeoColor(name: string): string {
    const colors: Record<string, string> = {
      "Elon Musk": "#6366f1","Satya Nadella": "#00A4EF","Tim Cook": "#555555",
      "Sundar Pichai": "#34A853","Mark Zuckerberg": "#1877F2","Jensen Huang": "#76B900",
      "Sam Altman": "#10A37F","Jeff Bezos": "#FF9900","Brian Chesky": "#FF5A5F","Reed Hastings": "#E50914",
    };
    return colors[name] || "#6366f1";
  }
  function getCeoEmoji(name: string): string {
    const emojis: Record<string, string> = {
      "Elon Musk": "🚀","Satya Nadella": "💻","Tim Cook": "🍎",
      "Sundar Pichai": "🔍","Mark Zuckerberg": "🌐","Jensen Huang": "🖥️",
      "Sam Altman": "🤖","Jeff Bezos": "📦","Brian Chesky": "🏠","Reed Hastings": "🎬",
    };
    return emojis[name] || "🤖";
  }

  // Copy share link
  const shareUrl = `${window.location.origin}/battles/${battleId}`;

  function copyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Mark as ready
  async function handleReady() {
    setReady(true);
    try {
      await fetch(`/api/battles/${battleId}/ready`, { method: "POST" });
      await fetchStatus();
    } catch {}
  }

  // Submit answer
  async function handleAnswer() {
    if (!selectedChoice || !battle?.currentQuestionData || answering) return;
    setAnswering(true);

    try {
      const res = await fetch(`/api/battles/${battleId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          battleQuestionId: battle.currentQuestionData.id,
          choiceId: selectedChoice,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedChoice(null);
        // Immediately fetch status to see updated state
        await fetchStatus();
      }
    } catch {}

    setAnswering(false);
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Swords className="w-12 h-12 text-[var(--muted)] mx-auto" />
          <p className="text-[var(--muted)]">{error}</p>
          <Link href="/battles"><Button variant="outline">Back to Battles</Button></Link>
        </div>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  // ── LOBBY PHASE ──
  if (phase === "lobby") {
    const meReady = battle.isChallenger ? battle.readyChallenger : battle.readyOpponent;
    const themReady = battle.isChallenger ? battle.readyOpponent : battle.readyChallenger;
    const allReady = battle.readyChallenger && battle.readyOpponent;

    return (
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
        <Link href="/battles" className="flex items-center gap-1.5 text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Battles
        </Link>

        <Card className="glass text-center">
          <CardContent className="p-8 space-y-6">
            <div className="p-3 w-fit mx-auto rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20">
              <Swords className="w-8 h-8 text-red-500" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">Battle Arena</h2>
              <p className="text-sm text-[var(--muted)] mt-1">
                {battle.track.icon} {battle.track.name}
              </p>
            </div>

            {/* Players */}              <div className="flex items-center justify-center gap-6 py-4">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white font-bold mx-auto">
                  {battle.myName.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-medium mt-1.5 text-[var(--foreground)]">{battle.myName}</p>
                {meReady && <Badge variant="secondary" className="text-[10px] mt-0.5 text-emerald-500">✅ Ready</Badge>}
              </div>

              {battle.isAi ? (
                <div className="text-2xl text-amber-500 animate-pulse">🤖</div>
              ) : (
                <div className="text-2xl text-[var(--muted)]">⚔️</div>
              )}

              <div className="text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold mx-auto" style={{ backgroundColor: getCeoColor(battle.opponentName) }}>
                  {getCeoEmoji(battle.opponentName) || battle.opponentName.charAt(0).toUpperCase()}
                </div>
                <p className="text-sm font-medium mt-1.5 text-[var(--foreground)]">{battle.opponentName}</p>
                {battle.isAi ? (
                  <Badge variant="secondary" className="text-[10px] mt-0.5 text-amber-500">
                    {battle.aiDifficulty === "hard" ? "🔥" : battle.aiDifficulty === "medium" ? "⚡" : "🌱"} {battle.aiDifficulty}
                  </Badge>
                ) : themReady ? (
                  <Badge variant="secondary" className="text-[10px] mt-0.5 text-emerald-500">✅ Ready</Badge>
                ) : null}
              </div>
            </div>

            {/* AI Battle info — no share link needed */}
            {battle.isAi ? (
              <div className="p-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/20">
                <p className="text-sm text-[var(--muted)]">
                  🤖 You're facing <strong>{battle.opponentName}</strong> on <strong>{battle.aiDifficulty}</strong> mode!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-[var(--muted)]">Share this link with your opponent:</p>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 text-xs font-mono bg-[var(--surface)] border border-[var(--border)] rounded-lg truncate">
                    {shareUrl}
                  </div>
                  <Button size="sm" variant="outline" onClick={copyLink} className="gap-1 shrink-0">
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Ready Button */}
            {!allReady && (
              <Button
                onClick={handleReady}
                disabled={meReady}
                className="w-full gap-2"
                size="lg"
              >
                {meReady ? (
                  <><Check className="w-4 h-4" /> {battle.isAi ? "Starting..." : "Waiting for opponent..."}</>
                ) : (
                  <><Zap className="w-4 h-4" /> {battle.isAi ? "Start Battle!" : "I'm Ready!"}</>
                )}
              </Button>
            )}

            {allReady && phase === "lobby" && (
              <div className="text-center space-y-2 animate-pulse">
                <p className="text-lg font-bold text-gradient">
                  {battle.isAi ? "Challenge Accepted!" : "Both Ready!"}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-[var(--muted)]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting battle...
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── RESULTS PHASE ──
  if (phase === "results") {
    const myWon = battle.myPoints > battle.opponentPoints;
    const isDraw = battle.myPoints === battle.opponentPoints;

    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        <Card className="text-center glass overflow-hidden border-red-500/20">
          <div className="h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />
          <CardContent className="p-8 space-y-6">
            <div className={`p-4 w-fit mx-auto rounded-full ${
              myWon ? "bg-emerald-500/20" : isDraw ? "bg-amber-500/20" : "bg-red-500/20"
            }`}>
              {myWon ? <Trophy className="w-10 h-10 text-emerald-500" /> : isDraw ? <Target className="w-10 h-10 text-amber-500" /> : <XCircle className="w-10 h-10 text-red-500" />}
            </div>
            <h2 className="text-2xl font-bold text-[var(--foreground)]">
              {myWon ? "You Won! 🎉" : isDraw ? "It's a Draw! 🤝" : "You Lost"}
            </h2>

            {/* Score comparison */}
            <div className="flex items-center justify-center gap-8 py-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-emerald-500">{battle.myPoints}</p>
                <p className="text-xs text-[var(--muted)] mt-1">{battle.myName}</p>
              </div>
              <div className="text-2xl text-[var(--muted)]">vs</div>
              <div className="text-center">
                <p className="text-4xl font-bold text-red-500">{battle.opponentPoints}</p>
                <p className="text-xs text-[var(--muted)] mt-1">{battle.opponentName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Review */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="text-base text-[var(--foreground)]">Battle Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {battle.questions.map((q, i) => (
              <div key={q.id} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[var(--muted)] mb-0.5">Q{i + 1} • {q.conceptName}</p>
                    <p className="text-sm font-medium text-[var(--foreground)]">{q.text}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {q.allAnswers.map((a) => (
                      <div key={a.userId} className={`flex items-center gap-1 text-xs ${
                        a.userId === (battle.isChallenger ? battle.id : "") ? "" : ""
                      }`}>
                        <span className={a.isCorrect ? "text-emerald-500" : "text-red-500"}>
                          {a.isCorrect ? "+" : ""}{a.points}
                        </span>
                        <span className="text-[var(--muted)]">{a.userName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Link href="/battles" className="flex-1">
            <Button variant="outline" className="w-full">Back to Battles</Button>
          </Link>
          <Button onClick={() => router.push("/dashboard")} className="flex-1">Dashboard</Button>
        </div>
      </div>
    );
  }

  // ── ACTIVE PHASE ──
  const currentQ = battle.currentQuestionData;

  if (!currentQ) {
    // Still loading question data from poll
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  const progress = ((battle.currentQuestion) / battle.questionCount) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Score Header */}
      <div className="flex items-center justify-between gap-3 stagger-1 animate-fade-in-up">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-light)] flex items-center justify-center text-white text-xs font-bold">
            {battle.myName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-xs text-[var(--muted)]">{battle.myName}</p>
            <p className="text-lg font-bold text-emerald-500">{battle.myPoints}</p>
          </div>
        </div>

        <div className="text-center">
          <Badge variant="destructive" className="text-[10px]">⚡ Battle</Badge>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Q{battle.currentQuestion + 1}/{battle.questionCount}
          </p>
        </div>

        <div className="flex items-center gap-2 text-right">
          <div>
            <p className="text-xs text-[var(--muted)]">{battle.opponentName}</p>
            <p className="text-lg font-bold text-red-500">{battle.opponentPoints}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-bold">
            {battle.opponentName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-1.5 stagger-1 animate-fade-in-up" />

      {/* Question Card */}
      <Card className="glass animate-scale-in stagger-2">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-xs bg-[var(--primary)]">{currentQ.conceptName}</Badge>
              {battle.hasAnsweredCurrent && (
                <Badge variant="secondary" className="text-[10px] text-emerald-500">Answered</Badge>
              )}
              {battle.bothAnsweredCurrent && (
                <Badge variant="secondary" className="text-[10px]">Both answered</Badge>
              )}
            </div>
            <p className="text-lg font-medium leading-relaxed text-[var(--foreground)]">{currentQ.text}</p>
          </div>

          {/* Choices */}
          <div className="space-y-2.5">
            {currentQ.choices.map((choice) => {
              const isSelected = selectedChoice === choice.id;
              const myAnswer = currentQ.myAnswer;

              return (
                <button
                  key={choice.id}
                  onClick={() => !battle.hasAnsweredCurrent && setSelectedChoice(choice.id)}
                  disabled={battle.hasAnsweredCurrent}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    battle.hasAnsweredCurrent && myAnswer?.choiceId === choice.id
                      ? myAnswer.isCorrect
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-red-500 bg-red-500/10"
                      : isSelected
                      ? "glass border-[var(--primary)]"
                      : "glass border-[var(--border)] hover:border-[var(--primary)]/40"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    battle.hasAnsweredCurrent && myAnswer?.choiceId === choice.id
                      ? myAnswer.isCorrect
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-red-500 bg-red-500"
                      : isSelected
                      ? "border-[var(--primary)]"
                      : "border-[var(--muted)]"
                  }`}>
                    {battle.hasAnsweredCurrent && myAnswer?.choiceId === choice.id && (
                      myAnswer.isCorrect
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        : <XCircle className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <span className="text-sm font-medium text-[var(--foreground)]">{choice.text}</span>
                </button>
              );
            })}
          </div>

          {/* Answer result feedback */}
          {battle.hasAnsweredCurrent && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
              {currentQ.myAnswer?.isCorrect ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-medium text-emerald-500">
                    {currentQ.myAnswer?.points > 0
                      ? `+${currentQ.myAnswer?.points} points (${currentQ.myAnswer?.points === 2 ? "first!" : "second"})`
                      : `+${currentQ.myAnswer?.points} points`}
                  </span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-500">{currentQ.myAnswer?.points} point</span>
                </>
              )}
              {battle.bothAnsweredCurrent ? (
                <span className="text-xs text-[var(--muted)] ml-auto">Waiting for next question...</span>
              ) : (
                <span className="text-xs text-[var(--muted)] ml-auto">Waiting for opponent...</span>
              )}
            </div>
          )}

          {/* Opponent status */}
          {!battle.hasAnsweredCurrent && currentQ.opponentAnswer && (
            <div className="text-xs text-[var(--muted)] text-center">
              Opponent has answered
            </div>
          )}

          {!battle.hasAnsweredCurrent && currentQ.answerCount === 0 && (
            <div className="text-xs text-[var(--muted)] text-center">
              Waiting for both players to answer...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="stagger-3 animate-fade-in-up">
        <Button
          onClick={handleAnswer}
          disabled={!selectedChoice || answering || battle.hasAnsweredCurrent}
          className="w-full h-12 text-base gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-0"
        >
          {answering ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
          ) : battle.hasAnsweredCurrent ? (
            "Answer submitted"
          ) : selectedChoice ? (
            <><Zap className="w-4 h-4" /> Submit Answer</>
          ) : (
            "Select an answer"
          )}
        </Button>
      </div>
    </div>
  );
}
