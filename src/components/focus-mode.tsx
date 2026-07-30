"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Timer, Play, Pause, RotateCcw, Coffee, Zap,
  BarChart3, TrendingUp, Target, X, ChevronDown,
} from "lucide-react";

type FocusPhase = "idle" | "focus" | "break" | "long_break";
type SessionSource = "coding" | "quiz" | "learning" | "practice";

interface FocusSession {
  id: string;
  date: string;
  duration: number;
  type: SessionSource;
  completed: boolean;
}

const FOCUS_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;
const LONG_BREAK_DURATION = 15 * 60;
const SESSIONS_BEFORE_LONG_BREAK = 4;
const SESSIONS_KEY = "focusMode_sessions";

function playBeep() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.5);
  } catch {}
}

export function FocusMode({ source = "coding" as SessionSource }) {
  const [phase, setPhase] = useState<FocusPhase>("idle");
  const [timeLeft, setTimeLeft] = useState(FOCUS_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalFocusTime, setTotalFocusTime] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [showTimer, setShowTimer] = useState(true);
  const [dailyStats, setDailyStats] = useState<{
    date: string; sessions: number; totalMinutes: number; streak: number;
  } | null>(null);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSIONS_KEY);
      if (saved) {
        const sessions: FocusSession[] = JSON.parse(saved);
        const today = new Date().toISOString().split("T")[0];
        const todaySessions = sessions.filter((s) => s.date === today && s.completed);
        const todayMinutes = Math.round(todaySessions.reduce((sum, s) => sum + s.duration, 0) / 60);
        setCompletedSessions(todaySessions.length);
        setTotalFocusTime(todaySessions.reduce((sum, s) => sum + s.duration, 0));

        let streak = 0;
        const d = new Date();
        while (true) {
          const dateStr = d.toISOString().split("T")[0];
          const daySessions = sessions.filter((s) => s.date === dateStr && s.completed);
          if (daySessions.length > 0) { streak++; d.setDate(d.getDate() - 1); }
          else break;
        }

        setDailyStats({ date: today, sessions: todaySessions.length, totalMinutes: todayMinutes, streak });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleSessionComplete();
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isRunning, timeLeft, phase]);

  const handleSessionComplete = useCallback(() => {
    setIsRunning(false);
    if (phase === "focus") {
      const session: FocusSession = {
        id: crypto.randomUUID?.() || Date.now().toString(),
        date: new Date().toISOString().split("T")[0],
        duration: FOCUS_DURATION,
        type: source,
        completed: true,
      };
      try {
        const existing = JSON.parse(localStorage.getItem(SESSIONS_KEY) || "[]");
        existing.push(session);
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(existing));
      } catch {}

      playBeep();
      const newCount = completedSessions + 1;
      setCompletedSessions(newCount);

      if (newCount % SESSIONS_BEFORE_LONG_BREAK === 0) {
        setPhase("long_break");
        setTimeLeft(LONG_BREAK_DURATION);
      } else {
        setPhase("break");
        setTimeLeft(BREAK_DURATION);
      }
      setIsRunning(true);
    } else {
      setPhase("focus");
      setTimeLeft(FOCUS_DURATION);
    }
  }, [phase, completedSessions, source]);

  const startFocus = () => {
    if (phase === "idle") { setPhase("focus"); setTimeLeft(FOCUS_DURATION); }
    setIsRunning(true);
  };

  const pauseTimer = () => setIsRunning(false);
  const resumeTimer = () => setIsRunning(true);

  const resetTimer = () => {
    setIsRunning(false);
    setPhase("idle");
    setTimeLeft(FOCUS_DURATION);
  };

  const skipBreak = () => {
    setIsRunning(false);
    setPhase("focus");
    setTimeLeft(FOCUS_DURATION);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getProgress = () => {
    if (phase === "focus") return ((FOCUS_DURATION - timeLeft) / FOCUS_DURATION) * 100;
    if (phase === "break") return ((BREAK_DURATION - timeLeft) / BREAK_DURATION) * 100;
    if (phase === "long_break") return ((LONG_BREAK_DURATION - timeLeft) / LONG_BREAK_DURATION) * 100;
    return 0;
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case "focus": return "Focus";
      case "break": return "Break";
      case "long_break": return "Long Break";
      default: return "Ready";
    }
  };

  const getPhaseIcon = () => {
    switch (phase) {
      case "focus": return <Zap className="w-4 h-4" />;
      case "break": case "long_break": return <Coffee className="w-4 h-4" />;
      default: return <Timer className="w-4 h-4" />;
    }
  };

  if (!showTimer) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-40 w-72 shadow-2xl border border-[var(--border)] transition-all duration-300">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--border)] bg-[var(--surface)] rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isRunning && phase === "focus" ? "bg-red-500 animate-pulse" : isRunning ? "bg-green-500" : "bg-[var(--muted)]"}`} />
          <span className="text-xs font-semibold text-[var(--foreground)]">Focus Mode</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowStats(!showStats)} className="p-1 rounded hover:bg-[var(--soft)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowTimer(false)} className="p-1 rounded hover:bg-[var(--soft)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showStats && dailyStats ? (
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-[var(--primary)]" />
            <span className="text-xs font-bold text-[var(--foreground)]">Today&apos;s Progress</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-[var(--soft)]">
              <p className="text-lg font-bold text-[var(--foreground)]">{dailyStats.sessions}</p>
              <p className="text-[10px] text-[var(--muted)]">Sessions</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-[var(--soft)]">
              <p className="text-lg font-bold text-[var(--foreground)]">{dailyStats.totalMinutes}</p>
              <p className="text-[10px] text-[var(--muted)]">Minutes</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-[var(--soft)]">
              <p className="text-lg font-bold text-amber-500">{dailyStats.streak}</p>
              <p className="text-[10px] text-[var(--muted)]">Day Streak</p>
            </div>
          </div>
          <div className="pt-1">
            <div className="flex items-center justify-between text-[10px] text-[var(--muted)] mb-1">
              <span>Daily Goal</span><span>{Math.min(100, Math.round((dailyStats.totalMinutes / 120) * 100))}%</span>
            </div>
            <Progress value={Math.min(100, (dailyStats.totalMinutes / 120) * 100)} className="h-1.5" />
          </div>
          <button onClick={() => setShowStats(false)} className="w-full text-[10px] py-1.5 rounded-lg bg-[var(--soft)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors font-medium">Back to Timer</button>
        </CardContent>
      ) : (
        <CardContent className="p-4 text-center space-y-3">
          <div className="relative">
            <div className="text-4xl font-bold font-mono text-[var(--foreground)] tracking-wider">{formatTime(timeLeft)}</div>
            <div className="flex items-center justify-center gap-1 mt-1">
              {getPhaseIcon()}
              <span className="text-[10px] font-medium text-[var(--muted)] uppercase tracking-wider">{getPhaseLabel()}</span>
            </div>
            <div className="mt-2"><Progress value={getProgress()} className="h-1" /></div>
          </div>
          <div className="flex items-center justify-center gap-2">
            {phase === "idle" ? (
              <Button onClick={startFocus} size="sm" className="gap-1.5 text-xs px-4">
                <Play className="w-3.5 h-3.5" /> Start Focus
              </Button>
            ) : (
              <>
                {isRunning ? (
                  <Button onClick={pauseTimer} size="sm" variant="outline" className="gap-1.5 text-xs">
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </Button>
                ) : (
                  <Button onClick={resumeTimer} size="sm" className="gap-1.5 text-xs">
                    <Play className="w-3.5 h-3.5" /> {phase === "focus" ? "Resume" : "Start"}
                  </Button>
                )}
                {(phase === "break" || phase === "long_break") && (
                  <Button onClick={skipBreak} size="sm" variant="ghost" className="text-xs">Skip</Button>
                )}
                <Button onClick={resetTimer} size="sm" variant="ghost" className="text-xs">
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center justify-center gap-1 text-[10px] text-[var(--muted)]">
            <Target className="w-3 h-3" />
            <span>{completedSessions} sessions today</span>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
