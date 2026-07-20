"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { type AvatarState } from "./avatar-activity-provider";

// ─── Body part color palette ───────────────────────────────────────────────

const COLORS = {
  skin: "#E8C4A0",
  shirt: "#3D5A45",
  pants: "#2D4635",
  shoes: "#2B2925",
  hair: "#4A3728",
};

// ─── Props ─────────────────────────────────────────────────────────────────

interface GeometricAvatarProps {
  photoDataUrl: string | null; // uploaded photo to texture on face
  state: AvatarState;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function GeometricAvatar({ photoDataUrl, state }: GeometricAvatarProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const headRef = useRef<THREE.Mesh>(null!);
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);

  // Load photo texture
  const texture = useMemo(() => {
    if (!photoDataUrl) return null;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(photoDataUrl);
    tex.flipY = false;
    return tex;
  }, [photoDataUrl]);

  // Simple idle/typing animation
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const time = Date.now() * 0.001;
    const isIdle = state === "idle";
    const isTyping = state === "typing";

    // Body sway / bob
    if (isIdle) {
      groupRef.current.position.y = Math.sin(time * 0.8) * 0.015;
      groupRef.current.rotation.z = Math.sin(time * 0.4) * 0.02;
    } else if (isTyping) {
      groupRef.current.position.y = 0;
      groupRef.current.rotation.z = 0;
    } else {
      groupRef.current.position.y = Math.sin(time * 1.2) * 0.008;
      groupRef.current.rotation.z = 0;
    }

    // Arm swing (typing = arms forward, idle = relaxed, active = slight swing)
    if (leftArmRef.current && rightArmRef.current) {
      if (isTyping) {
        leftArmRef.current.rotation.x = -0.6 + Math.sin(time * 6) * 0.1;
        rightArmRef.current.rotation.x = -0.6 + Math.sin(time * 6 + 0.5) * 0.1;
      } else if (isIdle) {
        leftArmRef.current.rotation.x = 0.3 + Math.sin(time * 0.5) * 0.1;
        rightArmRef.current.rotation.x = 0.3 + Math.sin(time * 0.5 + 0.3) * 0.1;
      } else {
        leftArmRef.current.rotation.x = Math.sin(time * 1.5) * 0.15;
        rightArmRef.current.rotation.x = Math.sin(time * 1.5 + 1) * 0.15;
      }
    }

    // Leg swing (walking animation when active, still when idle)
    if (leftLegRef.current && rightLegRef.current) {
      if (isIdle) {
        leftLegRef.current.rotation.x = Math.sin(time * 0.3) * 0.05;
        rightLegRef.current.rotation.x = Math.sin(time * 0.3 + 0.5) * 0.05;
      } else if (isTyping) {
        leftLegRef.current.rotation.x = 0;
        rightLegRef.current.rotation.x = 0;
      } else {
        leftLegRef.current.rotation.x = Math.sin(time * 2.5) * 0.2;
        rightLegRef.current.rotation.x = Math.sin(time * 2.5 + Math.PI) * 0.2;
      }
    }
  });

  return (
    <group ref={groupRef} scale={1.2} position={[0, -0.3, 0]}>
      {/* Body (torso) */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.5, 0.6, 0.3]} />
        <meshStandardMaterial color={COLORS.shirt} />
      </mesh>

      {/* Head */}
      <group position={[0, 1.05, 0]}>
        <mesh ref={headRef}>
          <boxGeometry args={[0.38, 0.4, 0.35]} />
          <meshStandardMaterial
            color={COLORS.skin}
            map={texture || undefined}
          />
        </mesh>
        {/* Hair cap */}
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[0.4, 0.12, 0.37]} />
          <meshStandardMaterial color={COLORS.hair} />
        </mesh>
        {/* Eyes (simple dots) */}
        <mesh position={[-0.12, 0.05, 0.18]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[0.12, 0.05, 0.18]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      </group>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.35, 0.65, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color={COLORS.skin} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.35, 0.65, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color={COLORS.skin} />
        </mesh>
      </group>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.12, 0.15, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[0.14, 0.35, 0.14]} />
          <meshStandardMaterial color={COLORS.pants} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, -0.42, 0.03]}>
          <boxGeometry args={[0.16, 0.08, 0.22]} />
          <meshStandardMaterial color={COLORS.shoes} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.12, 0.15, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[0.14, 0.35, 0.14]} />
          <meshStandardMaterial color={COLORS.pants} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, -0.42, 0.03]}>
          <boxGeometry args={[0.16, 0.08, 0.22]} />
          <meshStandardMaterial color={COLORS.shoes} />
        </mesh>
      </group>
    </group>
  );
}
