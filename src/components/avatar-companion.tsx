"use client";

import { useEffect, useState } from "react";
import { useAvatarActivity, type AvatarState } from "./avatar-activity-provider";

interface AvatarCompanionProps {
  avatarUrl: string | null;
}

// Color mapping for each activity state
const STATUS_COLORS: Record<AvatarState, string> = {
  typing: "#10B981", // emerald-500
  active: "#3D5A45", // primary green
  idle: "#9C9A94",   // muted gray
};

const STATUS_LABELS: Record<AvatarState, string> = {
  typing: "Typing...",
  active: "Active",
  idle: "Idle",
};

/**
 * Simplified avatar companion – shows the user's uploaded photo
 * with a colored status ring that reflects their current activity:
 * - Green ring + pulsing = typing
 * - Solid green ring = active/browsing
 * - Gray ring = idle (no activity for 35s)
 */
export function AvatarCompanionInner({ avatarUrl }: AvatarCompanionProps) {
  const { state } = useAvatarActivity();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [imgError, setImgError] = useState(false);

  // Pause when tab is hidden
  useEffect(() => {
    const handleVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset imgError when avatarUrl changes
  useEffect(() => {
    setImgError(false);
  }, [avatarUrl]);

  if (!mounted || !visible || !avatarUrl) return null;

  const color = STATUS_COLORS[state];
  const isTyping = state === "typing";

  return (
    <div className="fixed bottom-5 right-5 z-50 group">
      {/* Status ring */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-700 ${
          isTyping ? "animate-pulse" : ""
        }`}
        style={{
          boxShadow: `0 0 0 3px ${color}40, 0 0 0 6px ${color}20`,
        }}
      />

      {/* Avatar image or fallback */}
      <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-[var(--surface)] shadow-lg ring-2 ring-[var(--border)] bg-[var(--soft)]">
        {!imgError ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[var(--muted)]">
            ?
          </div>
        )}
      </div>

      {/* Status tooltip on hover */}
      <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
        <div
          className="px-2 py-0.5 rounded text-[10px] font-medium text-white whitespace-nowrap shadow-sm"
          style={{ backgroundColor: color }}
        >
          {STATUS_LABELS[state]}
        </div>
      </div>
    </div>
  );
}
