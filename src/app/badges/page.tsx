"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Loader2,
  Lock,
  CheckCircle2,
  ArrowLeft,
  Home,
  Sparkles,
  Target,
} from "lucide-react";

interface BadgeData {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: string;
  criteria: string;
  maxProgress: number;
  progress: number;
  earned: boolean;
  earnedAt: string | null;
  progressPercent: number;
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  mastery: { label: "Mastery", icon: "🎯", color: "from-emerald-500 to-teal-600" },
  streak: { label: "Streaks", icon: "🔥", color: "from-orange-500 to-red-600" },
  quiz: { label: "Quiz", icon: "🧠", color: "from-blue-500 to-cyan-600" },
  special: { label: "Special", icon: "⭐", color: "from-amber-500 to-orange-600" },
  social: { label: "Social", icon: "👥", color: "from-rose-500 to-pink-600" },
};

const RECENTLY_EARNED_KEY = "recentlyEarnedBadges";

export default function BadgesPage() {
  const [data, setData] = useState<{
    badges: BadgeData[];
    grouped: Record<string, BadgeData[]>;
    stats: { earnedCount: number; totalCount: number; completionPercent: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<BadgeData | null>(null);
  const [recentlyEarned, setRecentlyEarned] = useState<string[]>([]);

  useEffect(() => {
    // Restore recently earned badges from session storage
    try {
      const stored = sessionStorage.getItem(RECENTLY_EARNED_KEY);
      if (stored) setRecentlyEarned(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => {
    fetch("/api/badges")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);

          // Check for newly earned badges and animate them
          const newlyEarned = res.data.badges
            .filter((b: BadgeData) => b.earned && !recentlyEarned.includes(b.id))
            .map((b: BadgeData) => b.id);

          if (newlyEarned.length > 0) {
            const updated = [...recentlyEarned, ...newlyEarned];
            setRecentlyEarned(updated);
            try {
              sessionStorage.setItem(RECENTLY_EARNED_KEY, JSON.stringify(updated));
            } catch {}
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-2 text-[var(--muted)]">
          <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading badges...</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Trophy className="w-10 h-10 text-[var(--muted)]" />
        <p className="text-[var(--muted)]">Could not load badges.</p>
        <Button onClick={() => window.location.reload()} variant="outline" size="sm">Try Again</Button>
      </div>
    );
  }

  const { badges, grouped, stats } = data;
  const categoryOrder = ["mastery", "quiz", "streak", "special", "social"];

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

      {/* Header with stats */}
      <div className="stagger-1 animate-fade-in-up">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gradient">Badges & Achievements</h1>
            <p className="text-[var(--muted)] mt-1">Complete challenges and milestones to earn badges</p>
          </div>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <Card className="glass">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Earned</p>
                <p className="text-xl font-bold text-[var(--foreground)]">
                  {stats.earnedCount}<span className="text-sm text-[var(--muted)] font-normal"> / {stats.totalCount}</span>
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">Completion</p>
                <p className="text-xl font-bold text-[var(--foreground)]">{stats.completionPercent}%</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-[var(--muted)]">To Earn</p>
                <p className="text-xl font-bold text-[var(--foreground)]">{stats.totalCount - stats.earnedCount}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Progress bar for overall completion */}
      <Card className="glass stagger-2 animate-fade-in-up">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[var(--foreground)]">Overall Progress</span>
            <span className="text-xs text-[var(--muted)]">{stats.earnedCount} / {stats.totalCount} badges</span>
          </div>
          <div className="relative h-3 rounded-full bg-[var(--soft)] overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 transition-all duration-1000 ease-out"
              style={{ width: `${stats.completionPercent}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white drop-shadow-sm">
                {stats.completionPercent}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges by category */}
      {categoryOrder.map((cat) => {
        const catBadges = grouped[cat];
        if (!catBadges || catBadges.length === 0) return null;
        const catConfig = CATEGORY_CONFIG[cat] || { label: cat, icon: "🏅", color: "from-zinc-500 to-zinc-600" };
        const catEarned = catBadges.filter((b) => b.earned).length;

        return (
          <div key={cat} className="stagger-3 animate-fade-in-up space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{catConfig.icon}</span>
              <h2 className="text-base font-semibold text-[var(--foreground)]">{catConfig.label}</h2>
              <span className="text-xs text-[var(--muted)]">({catEarned}/{catBadges.length})</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {catBadges.map((badge) => {
                const isNewlyEarned = recentlyEarned.includes(badge.id) && badge.earned;
                const isLocked = !badge.earned && badge.progress === 0;

                return (
                  <button
                    key={badge.id}
                    onClick={() => setSelectedBadge(selectedBadge?.id === badge.id ? null : badge)}
                    className={`text-left group relative p-4 rounded-xl border-2 transition-all duration-300 ${
                      badge.earned
                        ? "border-amber-400/40 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 card-bounce"
                        : badge.progress > 0
                        ? "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--primary)]/40"
                        : "border-[var(--border)] bg-[var(--surface)] opacity-60 hover:opacity-80"
                    } ${isNewlyEarned ? "animate-scale-in ring-2 ring-amber-400 ring-offset-2 ring-offset-[var(--surface)]" : ""}`}
                  >
                    {/* Badge Icon */}
                    <div className="relative mb-3">
                      <div
                        className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all duration-300 ${
                          badge.earned
                            ? "shadow-md shadow-amber-500/20 group-hover:scale-110"
                            : isLocked
                            ? "grayscale opacity-50"
                            : "opacity-70"
                        }`}
                        style={{
                          backgroundColor: badge.earned
                            ? badge.color + "25"
                            : "var(--soft)",
                        }}
                      >
                        {badge.earned ? (
                          <span className="animate-float">{badge.icon}</span>
                        ) : isLocked ? (
                          <Lock className="w-5 h-5 text-[var(--muted)]" />
                        ) : (
                          <span>{badge.icon}</span>
                        )}
                      </div>

                      {/* Earned checkmark */}
                      {badge.earned && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Badge info */}
                    <h3 className={`text-sm font-semibold mb-0.5 ${
                      badge.earned ? "text-[var(--foreground)]" : "text-[var(--muted)]"
                    }`}>
                      {badge.name}
                    </h3>
                    <p className="text-[10px] text-[var(--muted)] leading-relaxed line-clamp-2 mb-2">
                      {badge.description}
                    </p>

                    {/* Progress bar for in-progress badges */}
                    {!badge.earned && badge.maxProgress > 1 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-[var(--muted)]">{badge.progress}/{badge.maxProgress}</span>
                          <span className="font-medium text-[var(--foreground)]">{badge.progressPercent}%</span>
                        </div>
                        <Progress value={badge.progressPercent} className="h-1.5" />
                      </div>
                    )}

                    {/* Single-progress badges (0/1) */}
                    {!badge.earned && badge.maxProgress === 1 && (
                      <p className="text-[10px] text-[var(--muted)]">
                        {badge.progress > 0 ? "In progress..." : badge.criteria}
                      </p>
                    )}

                    {/* Earned date */}
                    {badge.earned && badge.earnedAt && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                        Earned {new Date(badge.earnedAt).toLocaleDateString()}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Selected badge detail modal */}
      {selectedBadge && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedBadge(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedBadge(null)}>
            <div
              className="relative max-w-sm w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl overflow-hidden animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`h-2 bg-gradient-to-r ${CATEGORY_CONFIG[selectedBadge.category]?.color || "from-zinc-500 to-zinc-600"}`} />
              <div className="p-6 text-center space-y-4">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto shadow-lg"
                  style={{ backgroundColor: selectedBadge.color + "20" }}
                >
                  {selectedBadge.earned ? (
                    <span className="animate-float">{selectedBadge.icon}</span>
                  ) : (
                    <span>{selectedBadge.icon}</span>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-bold text-[var(--foreground)]">{selectedBadge.name}</h3>
                  <p className="text-sm text-[var(--muted)] mt-1">{selectedBadge.description}</p>
                </div>

                {/* Progress */}
                {selectedBadge.maxProgress > 1 ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[var(--muted)]">Progress</span>
                      <span className="font-medium text-[var(--foreground)]">{selectedBadge.progress}/{selectedBadge.maxProgress}</span>
                    </div>
                    <Progress value={selectedBadge.progressPercent} className="h-2" />
                  </div>
                ) : (
                  <p className="text-sm text-[var(--muted)]">{selectedBadge.criteria}</p>
                )}

                {selectedBadge.earned && selectedBadge.earnedAt && (
                  <div className="flex items-center justify-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    Earned on {new Date(selectedBadge.earnedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                )}

                {selectedBadge.earned && (
                  <div className="animate-scale-in p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800">
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      🎉 Achievement Unlocked!
                    </p>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedBadge(null)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
