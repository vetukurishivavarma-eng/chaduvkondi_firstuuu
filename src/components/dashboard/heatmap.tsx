"use client";

import { useMemo } from "react";
import { Tooltip } from "@/components/ui/tooltip";

interface HeatmapData {
  date: string;
  count: number;
  accepted: number;
}

interface HeatmapProps {
  data: HeatmapData[];
}

const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function getIntensity(count: number): string {
  if (count === 0) return "bg-[var(--soft)]/40";
  if (count <= 2) return "bg-emerald-500/20";
  if (count <= 5) return "bg-emerald-500/40";
  if (count <= 10) return "bg-emerald-500/60";
  return "bg-emerald-500/80";
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Heatmap({ data }: HeatmapProps) {
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Go back 52 weeks (364 days)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 363);

    // Build a lookup map for quick access
    const dataMap = new Map(data.map((d) => [d.date, d]));

    // Build grid: 52 weeks, 7 days
    const grid: Array<Array<{ date: string; count: number; accepted: number } | null>> = [];
    const labels: Array<{ index: number; label: string }> = [];

    const cursor = new Date(startDate);
    let week: Array<{ date: string; count: number; accepted: number } | null> = [];

    // Fill in the first week's offset
    const startDay = startDate.getDay();
    for (let d = 0; d < startDay; d++) {
      week.push(null);
    }

    let dayIndex = 0;
    while (cursor <= today) {
      const dateStr = cursor.toISOString().split("T")[0];
      const entry = dataMap.get(dateStr) || { date: dateStr, count: 0, accepted: 0 };

      // Check if we should add a month label
      if (cursor.getDate() <= 7 && cursor.getDay() === 0) {
        labels.push({
          index: grid.length,
          label: MONTHS[cursor.getMonth()],
        });
      }

      week.push(entry);
      dayIndex++;

      if (cursor.getDay() === 6 || cursor.getTime() >= today.getTime()) {
        grid.push(week);
        week = [];
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    // Pad last week if needed
    if (week.length > 0) {
      while (week.length < 7) week.push(null);
      grid.push(week);
    }

    return { weeks: grid, monthLabels: labels };
  }, [data]);

  // Calculate summary stats
  const totalAccepted = data.reduce((sum, d) => sum + d.accepted, 0);
  const longestStreak = useMemo(() => {
    let maxStreak = 0;
    let currentStreak = 0;
    const sorted = [...data].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    for (const day of sorted) {
      if (day.accepted > 0) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    return maxStreak;
  }, [data]);

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span>
          <span className="font-semibold text-[var(--foreground)]">{totalAccepted}</span> submissions in the last year
        </span>
        <span>
          Longest streak: <span className="font-semibold text-emerald-500">{longestStreak} days</span>
        </span>
      </div>

      {/* Heatmap Grid */}
      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1 pt-4">
          {DAYS.map((day, i) => (
            <div key={i} className="h-3 text-[9px] text-[var(--muted)] leading-3">
              {day}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-x-auto scrollbar-none">
          <div className="flex gap-0.5" style={{ minWidth: weeks.length * 14 }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => {
                  if (!day) {
                    return <div key={di} className="w-3 h-3" />;
                  }
                  return (
                    <Tooltip
                      key={di}
                      content={
                        <div className="text-xs space-y-0.5">
                          <p className="font-medium">{formatDate(day.date)}</p>
                          <p>{day.accepted} accepted · {day.count} total</p>
                        </div>
                      }
                    >
                      <div
                        className={`w-3 h-3 rounded-[3px] cursor-pointer transition-colors duration-150 hover:ring-1 hover:ring-[var(--foreground)]/30 ${getIntensity(day.count)}`}
                      />
                    </Tooltip>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 text-[10px] text-[var(--muted)]">
        <span>Less</span>
        <div className="w-3 h-3 rounded-[3px] bg-[var(--soft)]/40" />
        <div className="w-3 h-3 rounded-[3px] bg-emerald-500/20" />
        <div className="w-3 h-3 rounded-[3px] bg-emerald-500/40" />
        <div className="w-3 h-3 rounded-[3px] bg-emerald-500/60" />
        <div className="w-3 h-3 rounded-[3px] bg-emerald-500/80" />
        <span>More</span>
      </div>
    </div>
  );
}
