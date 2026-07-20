"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { gsap } from "gsap";
import { GeometricAvatar } from "./geometric-avatar";
import { useAvatarActivity, type AvatarState } from "./avatar-activity-provider";

// ─── Low-end device detection ──────────────────────────────────────────────

function isLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return true;
  const cores = navigator.hardwareConcurrency;
  if (cores && cores <= 4) return true;
  try {
    const canvas = document.createElement("canvas");
    return !canvas.getContext("webgl2");
  } catch {
    return true;
  }
}

function isMobileViewport(): boolean {
  if (typeof window === "undefined") return true;
  return window.innerWidth < 768;
}

// ─── Anchor points (positions on screen where the avatar can walk) ────────

type Anchor = { x: number; y: number; label: string };

function getAnchors(): Anchor[] {
  const w = typeof window !== "undefined" ? window.innerWidth : 1200;
  const h = typeof window !== "undefined" ? window.innerHeight : 800;

  return [
    { x: w - 120, y: h - 160, label: "bottom-right" },  // default
    { x: w - 120, y: 100, label: "top-right" },
    { x: 120, y: h - 160, label: "bottom-left" },
    { x: Math.min(350, w * 0.3), y: h * 0.6, label: "laptop" },     // near quiz/content
    { x: Math.max(w - 200, w * 0.6), y: h * 0.4, label: "content-right" },
    { x: w * 0.15, y: h * 0.3, label: "content-left" },
  ];
}

function getRandomAnchor(exclude?: string): Anchor {
  const anchors = getAnchors().filter((a) => a.label !== exclude);
  // Fallback to first anchor if all are excluded (should never happen)
  if (anchors.length === 0) return getAnchors()[0];
  return anchors[Math.floor(Math.random() * anchors.length)];
}

// ─── Status helpers ────────────────────────────────────────────────────────

const STATUS_COLORS: Record<AvatarState, string> = {
  typing: "#10B981",
  active: "#3D5A45",
  idle: "#9C9A94",
};

interface AvatarCompanionProps {
  avatarUrl: string | null;
}

// ─── Main component ────────────────────────────────────────────────────────

export function AvatarCompanionInner({ avatarUrl }: AvatarCompanionProps) {
  const { state } = useAvatarActivity();
  const containerRef = useRef<HTMLDivElement>(null!);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const prevStateRef = useRef<AvatarState>("active");
  const currentAnchorRef = useRef<string>("bottom-right");

  // Performance detection (stable across renders)
  const useFallback = useMemo(() => isLowEndDevice() || isMobileViewport(), []);

  // Pause when tab is hidden
  useEffect(() => {
    const handleVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // ─── GSAP walking animation on state change ───────────────────────────
  const walkToPosition = useCallback((target: Anchor, duration = 1.2) => {
    if (!containerRef.current) return;
    currentAnchorRef.current = target.label;

    gsap.to(containerRef.current, {
      x: target.x,
      y: target.y,
      duration,
      ease: "power2.inOut",
      overwrite: "auto",
    });
  }, []);

  // React to state changes
  useEffect(() => {
    if (!mounted || !visible) return;
    const prev = prevStateRef.current;
    prevStateRef.current = state;

    if (state === "typing") {
      // Walk to laptop area
      const anchors = getAnchors();
      const laptop = anchors.find((a) => a.label === "laptop") || anchors[0];
      walkToPosition(laptop, 1.0);
    } else if (state === "idle") {
      // Wander to a random spot, different from current
      const target = getRandomAnchor(currentAnchorRef.current);
      walkToPosition(target, 2.0); // Slow wander
    } else {
      // Active - walk near content area
      if (prev === "idle" || prev === "typing") {
        const anchors = getAnchors();
        const targets = anchors.filter(
          (a) =>
            a.label !== currentAnchorRef.current &&
            a.label !== "laptop" &&
            a.label !== "bottom-right"
        );
        const target = targets[Math.floor(Math.random() * targets.length)] || anchors[0];
        walkToPosition(target, 1.2);
      }
    }
  }, [state, mounted, visible, walkToPosition]);

  // ─── Periodic wandering when idle ──────────────────────────────────────
  useEffect(() => {
    if (!mounted || !visible) return;

    let wanderTimer: ReturnType<typeof setInterval> | null = null;

    if (state === "idle") {
      wanderTimer = setInterval(() => {
        const target = getRandomAnchor(currentAnchorRef.current);
        walkToPosition(target, 2.5);
      }, 8000);
    }

    return () => {
      if (wanderTimer) clearInterval(wanderTimer);
    };
  }, [state, mounted, visible, walkToPosition]);

  // ─── Initial position ──────────────────────────────────────────────────
  useEffect(() => {
    if (!mounted || !containerRef.current) return;
    const anchors = getAnchors();
    const start = anchors.find((a) => a.label === "bottom-right") || anchors[0];
    gsap.set(containerRef.current, { x: start.x, y: start.y });
  }, [mounted]);

  if (!mounted || !visible) return null;

  const color = STATUS_COLORS[state];

  // Low-end / mobile fallback: simple floating badge instead of 3D canvas
  if (useFallback) {
    return (
      <div className="fixed bottom-5 right-5 z-50">
        <div
          className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white text-lg font-bold transition-all duration-500"
          style={{
            backgroundColor: color,
            boxShadow: state === "typing" ? `0 0 12px ${color}` : undefined,
          }}
        >
          {(state === "typing" && "✎") || (state === "idle" && "◷") || "✦"}
        </div>
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-medium text-white whitespace-nowrap shadow-sm"
          style={{ backgroundColor: color }}
        >
          {state === "typing" ? "Typing..." : state === "idle" ? "Idle" : "Active"}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Avatar container – GSAP animates x/y on this */}
      <div
        ref={containerRef}
        className="absolute w-24 h-28"
        style={{ willChange: "transform" }}
      >
        {/* Status indicator above avatar */}
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-medium text-white whitespace-nowrap shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: color }}
        >
          {state === "typing" ? "Typing..." : state === "idle" ? "Wandering..." : "Active"}
        </div>

        {/* Three.js Canvas */}
        <Canvas
          camera={{ position: [0, 1.5, 3.5], fov: 35 }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 1.5]}
          style={{ width: "100%", height: "100%" }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={0.7} />
          <directionalLight position={[-3, 4, -2]} intensity={0.3} />
          <spotLight position={[0, 3, 4]} angle={0.3} intensity={0.4} penumbra={1} />

          <GeometricAvatar photoDataUrl={avatarUrl} state={state} />

          <ContactShadows
            position={[0, -0.55, 0]}
            opacity={0.25}
            scale={2}
            blur={2}
            far={1}
          />

          <Environment preset="city" />
        </Canvas>
      </div>
    </div>
  );
}
