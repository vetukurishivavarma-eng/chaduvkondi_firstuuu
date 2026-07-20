"use client";

import { useRef, useEffect, useState, useMemo, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { useAvatarActivity, type AvatarState } from "./avatar-activity-provider";

// ─── Performance detection ─────────────────────────────────────────────────

function isLowEndDevice(): boolean {
  if (typeof navigator === "undefined") return true;
  // heuristic: low hardware concurrency or no WebGL2
  const cores = navigator.hardwareConcurrency;
  if (cores && cores <= 4) return true;
  try {
    const canvas = document.createElement("canvas");
    return !canvas.getContext("webgl2");
  } catch {
    return true;
  }
}

// ─── Model scene ───────────────────────────────────────────────────────────

function AvatarModel({ url, state }: { url: string; state: AvatarState }) {
  const groupRef = useRef<THREE.Group>(null!);
  const { scene } = useGLTF(url);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  // Clone scene so we can mount it
  const clone = useMemo(() => scene.clone(true), [scene]);

  // Setup animation mixer
  useEffect(() => {
    if (!groupRef.current) return;
    const mixer = new THREE.AnimationMixer(groupRef.current);
    mixerRef.current = mixer;

    // Try to find and play animations from the GLB
    if (scene.animations.length > 0) {
      const action = mixer.clipAction(scene.animations[0]);
      action.play();
    }

    return () => {
      mixer.stopAllAction();
    };
  }, [scene]);

  // Drive idle animation based on state
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
    if (!groupRef.current) return;

    // Subtle breathing / sway based on state
    const time = Date.now() * 0.001;
    if (state === "idle") {
      groupRef.current.position.y = Math.sin(time * 0.5) * 0.02;
      groupRef.current.rotation.z = Math.sin(time * 0.3) * 0.01;
    } else if (state === "typing") {
      groupRef.current.position.y = 0;
      groupRef.current.rotation.z = 0;
    } else {
      groupRef.current.position.y = Math.sin(time * 0.8) * 0.01;
      groupRef.current.rotation.z = 0;
    }
  });

  return (
    <group ref={groupRef} scale={1.8} position={[0, -0.5, 0]}>
      <primitive object={clone} />
    </group>
  );
}

// ─── Loading placeholder ───────────────────────────────────────────────────

function LoadingFallback() {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[0.4, 0.6, 0.3]} />
      <meshStandardMaterial color="#3D5A45" wireframe opacity={0.4} transparent />
    </mesh>
  );
}

// ─── Scene inner (always mounted inside Canvas) ────────────────────────────

function SceneContent({ url, state }: { url: string; state: AvatarState }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-3, 4, -2]} intensity={0.4} />
      <spotLight position={[0, 3, 4]} angle={0.3} intensity={0.5} penumbra={1} />

      <Suspense fallback={<LoadingFallback />}>
        <AvatarModel url={url} state={state} />
      </Suspense>

      <ContactShadows
        position={[0, -0.55, 0]}
        opacity={0.3}
        scale={1.2}
        blur={2}
        far={1}
      />

      <Environment preset="city" />
    </>
  );
}

// ─── Main companion widget ─────────────────────────────────────────────────

interface AvatarCompanionProps {
  avatarUrl: string | null;
}

export function AvatarCompanionInner({ avatarUrl }: AvatarCompanionProps) {
  const { state } = useAvatarActivity();
  const [mounted, setMounted] = useState(false);
  const [lowEnd] = useState(() => isLowEndDevice());
  const [visible, setVisible] = useState(true);

  // Pause when tab is hidden
  useEffect(() => {
    const handleVisibility = () => {
      setVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !visible || !avatarUrl) return null;

  // Mobile / low-end fallback: render a simple static badge instead of 3D canvas
  if (lowEnd) {
    return (
      <div className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-[var(--primary)]/10 border border-[var(--border)] flex items-center justify-center shadow-lg">
        <span className="text-lg">✦</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-28 h-32 pointer-events-none">
      <Canvas
        camera={{ position: [0, 1, 3], fov: 30 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: "100%", height: "100%" }}
        dpr={[1, 1.5]} // cap DPR for performance
      >
        <SceneContent url={avatarUrl} state={state} />
      </Canvas>
    </div>
  );
}

// ─── Static sprite fallback (exported for use outside Three.js) ────────────

export function AvatarSpriteFallback({
  initials,
  state,
}: {
  initials: string;
  state?: AvatarState;
}) {
  const colorMap: Record<AvatarState, string> = {
    typing: "bg-emerald-500",
    active: "bg-[var(--primary)]",
    idle: "bg-zinc-400",
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white text-sm font-bold transition-colors duration-500 ${
        colorMap[state ?? "active"]
      }`}
      title={`Avatar is ${state}`}
    >
      {initials}
    </div>
  );
}
