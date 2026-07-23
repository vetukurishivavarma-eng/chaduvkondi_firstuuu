"use client";

import { useMemo } from "react";
import { Flame, Zap } from "lucide-react";

interface StreakVisualizationProps {
  currentStreak: number;
  longestStreak?: number;
  dailyActivity?: Record<string, number>;
}

const STREAK_MILESTONES = [
  { days: 3, label: "Getting Started", icon: "🌱" },
  { days: 7, label: "Week Warrior", icon: "🔥" },
  { days: 14, label: "Fortnight Force", icon: "⚡" },
  { days: 21, label: "Triple Threat", icon: "💪" },
  { days: 30, label: "Monthly Master", icon: "👑" },
  { days: 60, label: "Dedicated Dev", icon: "💎" },
  { days: 90, label: "Quarter Legend", icon: "🏆" },
  { days: 365, label: "Year of Mastery", icon: "🌟" },
];

export default function StreakVisualization({
  currentStreak,
  longestStreak = currentStreak,
  dailyActivity = {},
}: StreakVisualizationProps) {
  // Generate last 30 days
  const days = useMemo(() => {
    const result: { date: string; day: number; dayName: string; count: number; isToday: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      result.push({
        date: dateStr,
        day: date.getDate(),
        dayName: dayNames[date.getDay()],
        count: dailyActivity[dateStr] || 0,
        isToday: i === 0,
      });
    }
    return result;
  }, [dailyActivity]);

  // Get intensity class based on activity count
  function getIntensityClass(count: number): string {
    if (count === 0) return "bg-[var(--soft)]";
    if (count <= 1) return "bg-emerald-200 dark:bg-emerald-900/60";
    if (count <= 3) return "bg-emerald-400 dark:bg-emerald-700";
    if (count <= 6) return "bg-emerald-500 dark:bg-emerald-600";
    return "bg-emerald-600 dark:bg-emerald-500";
  }

  // Get next milestone
  const nextMilestone = STREAK_MILESTONES.find((m) => m.days > currentStreak);
  const currentMilestoneIndex = STREAK_MILESTONES.findIndex((m) => m.days <= currentStreak);
  const prevMilestone = currentMilestoneIndex >= 0 ? STREAK_MILESTONES[currentMilestoneIndex] : null;

  const milestoneProgress = nextMilestone
    ? (currentStreak / nextMilestone.days) * 100
    : 100;

  // Group days by week for display
  const weeks = useMemo(() => {
    const result: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  return (
    <div className="space-y-4">
      {/* Fire Animation & Current Streak */}
      <div className="flex items-center gap-4 p-4 rounded-xl glass">
        <div className="relative group">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20 animate-pulse">
            <Flame className="w-7 h-7 text-white" />
          </div>
          {/* Animated glow */}
          <div className="absolute inset-0 rounded-xl bg-orange-500/20 blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
        </div>

        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[var(--foreground)]">{currentStreak}</span>
            <span className="text-sm text-[var(--muted)]">day streak</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {currentStreak >= 7 && <Zap className="w-3.5 h-3.5 text-yellow-500" />}
            <span className="text-xs text-[var(--muted)]">
              {currentStreak === 0
                ? "Start a quiz to begin your streak!"
                : currentStreak >= 30
                ? "Unstoppable! 🔥"
                : currentStreak >= 7
                ? "Week streak unlocked! ⚡"
                : "Keep it going!"}
            </span>
          </div>
        </div>

        {longestStreak > currentStreak && (
          <div className="text-right">
            <p className="text-xs text-[var(--muted)]">Best</p>
            <p className="text-lg font-bold text-[var(--foreground)]">{longestStreak}d</p>
          </div>
        )}
      </div>

      {/* 30-Day Activity Heatmap */}
      <div className="p-4 rounded-xl glass">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Activity (30 days)</h4>
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--muted)]">
            <span>Less</span>
            <div className="flex gap-0.5">
              <div className="w-3 h-3 rounded-sm bg-[var(--soft)]" />
              <div className="w-3 h-3 rounded-sm bg-emerald-200 dark:bg-emerald-900/60" />
              <div className="w-3 h-3 rounded-sm bg-emerald-400 dark:bg-emerald-700" />
              <div className="w-3 h-3 rounded-sm bg-emerald-500 dark:bg-emerald-600" />
              <div className="w-3 h-3 rounded-sm bg-emerald-600 dark:bg-emerald-500" />
            </div>
            <span>More</span>
          </div>
        </div>

        <div className="flex gap-1">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.date}
                  className={`relative group w-full aspect-square rounded-sm ${getIntensityClass(day.count)} ${
                    day.isToday ? "ring-2 ring-[var(--primary)] ring-offset-1 ring-offset-[var(--surface)]" : ""
                  }`}
                  title={`${day.date}: ${day.count} quiz${day.count !== 1 ? "zes" : ""}`}
                >
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded-md bg-[var(--foreground)] text-[var(--background)] text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    {day.date}: {day.count} quiz{day.count !== 1 ? "zes" : ""}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Day labels */}
        <div className="flex gap-1 mt-1.5">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="flex-1 text-[8px] text-[var(--muted)] text-center">
              {week[0]?.dayName[0]}
              {weekIdx === 0 ? week[0]?.dayName : ""}
            </div>
          ))}
        </div>
      </div>

      {/* Milestone Progress */}
      <div className="p-4 rounded-xl glass">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">Milestones</h4>
          {nextMilestone && (
            <span className="text-xs text-[var(--muted)]">
              {currentStreak}/{nextMilestone.days} to {nextMilestone.label}
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="relative h-2 rounded-full bg-[var(--soft)] overflow-hidden mb-3">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-400 to-red-500 transition-all duration-1000 ease-out"
            style={{ width: `${milestoneProgress}%` }}
          />
        </div>

        {/* Milestone markers */}
        <div className="flex justify-between">
          {STREAK_MILESTONES.filter((_, i) => i % 2 === 0).map((m) => (
            <div
              key={m.days}
              className={`flex flex-col items-center gap-1 ${
                currentStreak >= m.days ? "opacity-100" : "opacity-30"
              }`}
            >
              <span className="text-lg">{m.icon}</span>
              <span className="text-[10px] text-[var(--muted)] text-center leading-tight">{m.days}d</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
