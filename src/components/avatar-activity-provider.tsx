"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";

export type AvatarState = "typing" | "active" | "idle" | "celebrate";

interface AvatarActivityContextValue {
  /** Current classified avatar state */
  state: AvatarState;
  /** Timestamp of last user activity (ms) */
  lastActivityAt: number;
  /** Manually set a state (for testing or override) */
  setOverrideState: (state: AvatarState | null) => void;
  /** Trigger a celebration animation that auto-resets after 2.5s */
  celebrate: () => void;
}

const AvatarActivityContext = createContext<AvatarActivityContextValue | null>(
  null
);

export function useAvatarActivity() {
  const ctx = useContext(AvatarActivityContext);
  if (!ctx) {
    // Return a no-op fallback so components don't crash outside the provider
    return {
      state: "active" as AvatarState,
      lastActivityAt: Date.now(),
      setOverrideState: () => {},
      celebrate: () => {},
    };
  }
  return ctx;
}

// ─── Config ────────────────────────────────────────────────────────────────
const IDLE_THRESHOLD_MS = 35_000; // 35 seconds of inactivity → idle

// ─── Provider ──────────────────────────────────────────────────────────────

export function AvatarActivityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AvatarState>("active");
  const [overrideState, setOverrideState] = useState<AvatarState | null>(null);
  // Use state for lastActivityAt so context consumers always see the current value
  const [lastActivityAt, setLastActivityAt] = useState(Date.now());

  const idleTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Which elements are considered "typing" fields
  const isTypingField = useCallback((el: EventTarget | null): boolean => {
    if (!el || !(el instanceof HTMLElement)) return false;
    const tag = el.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea") return true;
    if (el instanceof HTMLInputElement) return true;
    if (el.isContentEditable) return true;
    if (el.getAttribute("role") === "textbox") return true;
    return false;
  }, []);

  const bump = useCallback(() => {
    setLastActivityAt(Date.now());
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      bump();
      if (isTypingField(e.target)) {
        // Only set typing when we're actually pressing letter-like keys
        if (e.key.length === 1 || e.key === "Backspace" || e.key === "Delete") {
          setState("typing");
        }
      }
    },
    [bump, isTypingField]
  );

  const handleMouseMove = useCallback(() => {
    bump();
  }, [bump]);

  const handleScroll = useCallback(() => {
    bump();
  }, [bump]);

  const handleClick = useCallback(() => {
    bump();
  }, [bump]);

  // Bind global listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("click", handleClick, { passive: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("click", handleClick);
    };
  }, [handleKeyDown, handleMouseMove, handleScroll, handleClick]);

  // Idle timer – transitions "typing" → "active" after key-up silence, and
  // "active" → "idle" after IDLE_THRESHOLD_MS of no activity.
  useEffect(() => {
    if (overrideState) {
      setState(overrideState);
      return;
    }

    const tick = () => {
      const now = Date.now();
      const elapsed = now - lastActivityAt;

      if (state === "typing" && elapsed > 1_500) {
        // No typing key for 1.5s → back to active
        setState("active");
      }

      if (elapsed >= IDLE_THRESHOLD_MS && state !== "idle") {
        setState("idle");
      }

      if (elapsed < IDLE_THRESHOLD_MS && state === "idle") {
        setState("active");
      }
    };

    idleTimer.current = setInterval(tick, 500);

    return () => {
      if (idleTimer.current) clearInterval(idleTimer.current);
    };
  }, [state, overrideState, lastActivityAt]);

  // ─── Celebration trigger ──────────────────────────────────────────────
  const celebrateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const celebrate = useCallback(() => {
    setState("celebrate");
    // Auto-reset back to active after 2.5 seconds
    if (celebrateTimerRef.current) clearTimeout(celebrateTimerRef.current);
    celebrateTimerRef.current = setTimeout(() => {
      setState("active");
      setLastActivityAt(Date.now());
    }, 2500);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (celebrateTimerRef.current) clearTimeout(celebrateTimerRef.current);
    };
  }, []);

  // Listen for custom 'avatar-celebrate' DOM events (fired by quiz page etc.)
  useEffect(() => {
    const handler = () => celebrate();
    window.addEventListener("avatar-celebrate", handler);
    return () => window.removeEventListener("avatar-celebrate", handler);
  }, [celebrate]);

  return (
    <AvatarActivityContext.Provider
      value={{
        state,
        lastActivityAt,
        setOverrideState,
        celebrate,
      }}
    >
      {children}
    </AvatarActivityContext.Provider>
  );
}
