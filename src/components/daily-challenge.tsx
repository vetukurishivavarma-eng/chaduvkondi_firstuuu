"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Loader2, CheckCircle2, Target } from "lucide-react";

interface DailyChallengeData {
  challenge: {
    id: string;
    title: string;
    description: string;
    type: string;
    target: number;
    reward: number;
    icon: string;
  };
  progress: number;
  completed: boolean;
  claimed: boolean;
  stats: {
    quizzesToday: number;
    questionsAnswered: number;
  };
}

export default function DailyChallenge() {
  const [data, setData] = useState<DailyChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/challenges/daily")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch(() => setError("Failed to load challenge"))
      .finally(() => setLoading(false));
  }, []);

  async function handleClaim() {
    if (!data || data.claimed) return;
    setClaiming(true);
    try {
      const res = await fetch("/api/challenges/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: data.challenge.id }),
      });
      const json = await res.json();
      if (json.success) {
        setClaimed(true);
        setData((prev) => prev ? { ...prev, claimed: true } : prev);
      } else {
        setError(json.error || "Failed to claim");
      }
    } catch {
      setError("Network error");
    } finally {
      setClaiming(false);
    }
  }

  if (loading) {
    return (
      <Card className="glass">
        <CardContent className="p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--muted)]" />
          <span className="text-sm text-[var(--muted)]">Loading daily challenge...</span>
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
    return null; // Silently fail
  }

  if (!data) return null;

  const { challenge, progress, completed } = data;
  const progressPercent = Math.min(100, Math.round((progress / challenge.target) * 100));

  return (
    <Card className="glass overflow-hidden">
      <div className={`h-1 ${completed ? "bg-gradient-to-r from-emerald-400 to-emerald-600" : "bg-gradient-to-r from-amber-400 to-orange-500"}`} />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm text-[var(--foreground)]">
            <Target className="w-4 h-4 text-[var(--primary)]" />
            Daily Challenge
          </CardTitle>
          <Badge variant={completed ? "success" : "secondary"} className="text-[10px]">
            {completed ? "Completed" : "Active"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg ${
            challenge.type === 'speed_test_beat_best'
              ? 'bg-gradient-to-br from-red-500 to-orange-500'
              : 'bg-gradient-to-br from-amber-400 to-orange-500'
          } flex items-center justify-center text-xl shadow-sm ${completed ? 'animate-wiggle' : ''}`}>
            {challenge.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-[var(--foreground)]">{challenge.title}</p>
            <p className="text-xs text-[var(--muted)]">{challenge.description}</p>
            {challenge.type === 'speed_test_beat_best' && (
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] font-medium text-red-500">⚡ Speed Test</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--muted)]">
              Progress: {Math.min(progress, challenge.target)}/{challenge.target}
            </span>
            <span className="font-medium text-[var(--foreground)]">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {completed && !data.claimed && !claimed && (
          <Button
            onClick={handleClaim}
            disabled={claiming}
            className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            size="sm"
          >
            {claiming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Gift className="w-4 h-4" />
                Claim Reward
              </>
            )}
          </Button>
        )}

        {(data.claimed || claimed) && (
          <div className="animate-scale-in flex items-center gap-2 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              Reward claimed! +{challenge.reward} XP
            </span>
          </div>
        )}

        {error && (
          <p className="text-xs text-[var(--error)]">{error}</p>
        )}

        {/* Daily stats */}
        <div className="flex items-center gap-3 pt-1 text-[10px] text-[var(--muted)] border-t border-[var(--border)]">
          <span>📊 {data.stats.quizzesToday} quiz{data.stats.quizzesToday !== 1 ? "zes" : ""} today</span>
          <span>💬 {data.stats.questionsAnswered} questions</span>
        </div>
      </CardContent>
    </Card>
  );
}
