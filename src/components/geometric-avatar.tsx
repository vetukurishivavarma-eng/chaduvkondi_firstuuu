"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { type AvatarState } from "./avatar-activity-provider";
import {
  getAnimationFrame,
  blendFrames,
  avatarStateToAnim,
  type AnimationFrame,
  type AnimState,
} from "@/lib/avatar-animations";

import { DEFAULT_OUTFIT_COLORS } from "@/lib/avatar-defaults";

// ─── Default fallback palette (used when no custom colors provided) ─────────

const DEFAULT_COLORS = {
  skin: "#E8C4A0",
  ...DEFAULT_OUTFIT_COLORS,
  shoes: "#2B2925",
};

// ─── Props ─────────────────────────────────────────────────────────────────

interface GeometricAvatarProps {
  photoDataUrl: string | null;
  state: AvatarState;
  shirtColor?: string;
  pantsColor?: string;
  hairColor?: string;
}

// ─── Smooth state blend helper ─────────────────────────────────────────────

class AnimationBlender {
  private currentState: AnimState = "idle";
  private previousState: AnimState = "idle";
  private blendTime = 0;
  private readonly blendDuration = 0.4; // seconds to transition

  update(delta: number, targetState: AnimState) {
    if (targetState !== this.currentState) {
      this.previousState = this.currentState;
      this.currentState = targetState;
      this.blendTime = 0;
    }
    this.blendTime = Math.min(this.blendTime + delta, this.blendDuration);
  }

  getFrame(t: number): AnimationFrame {
    const from = getAnimationFrame(this.previousState, t);
    const to = getAnimationFrame(this.currentState, t);
    const progress = this.blendDuration > 0
      ? Math.min(this.blendTime / this.blendDuration, 1)
      : 1;
    // Smooth ease-in-out curve
    const eased = progress * progress * (3 - 2 * progress);
    return blendFrames(from, to, eased);
  }
}

// ─── Component ─────────────────────────────────────────────────────────────

export function GeometricAvatar({ photoDataUrl, state, shirtColor, pantsColor, hairColor }: GeometricAvatarProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const headRef = useRef<THREE.Group>(null!);
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);
  const leftElbowRef = useRef<THREE.Mesh>(null!);
  const rightElbowRef = useRef<THREE.Mesh>(null!);

  const blenderRef = useRef(new AnimationBlender());

  // Resolve colors, falling back to defaults
  const colors = useMemo(() => ({
    skin: DEFAULT_COLORS.skin,
    shirt: shirtColor || DEFAULT_COLORS.shirt,
    pants: pantsColor || DEFAULT_COLORS.pants,
    shoes: DEFAULT_COLORS.shoes,
    hair: hairColor || DEFAULT_COLORS.hair,
  }), [shirtColor, pantsColor, hairColor]);

  // Load photo texture
  const texture = useMemo(() => {
    if (!photoDataUrl) return null;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(photoDataUrl);
    tex.flipY = false;
    return tex;
  }, [photoDataUrl]);

  // Main animation loop
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const animState = avatarStateToAnim(state);
    blenderRef.current.update(delta, animState);

    const t = Date.now() * 0.001;
    const frame = blenderRef.current.getFrame(t);

    // Apply body transforms
    groupRef.current.position.y = frame.bodyY;
    groupRef.current.rotation.z = frame.bodyRotZ;

    // Head tilt
    if (headRef.current) {
      headRef.current.rotation.x = frame.headTilt;
    }

    // Arms
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = frame.leftArm;
      leftArmRef.current.rotation.z = frame.leftArmZ;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = frame.rightArm;
      rightArmRef.current.rotation.z = frame.rightArmZ;
    }

    // Legs
    if (leftLegRef.current) {
      leftLegRef.current.rotation.x = frame.leftLeg;
    }
    if (rightLegRef.current) {
      rightLegRef.current.rotation.x = frame.rightLeg;
    }

    // Elbows (forearm bend)
    if (leftElbowRef.current) {
      leftElbowRef.current.rotation.x = frame.leftElbow;
    }
    if (rightElbowRef.current) {
      rightElbowRef.current.rotation.x = frame.rightElbow;
    }
  });

  return (
    <group ref={groupRef} scale={1.2} position={[0, -0.3, 0]}>
      {/* Body (torso) */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.5, 0.6, 0.3]} />
        <meshStandardMaterial color={colors.shirt} />
      </mesh>

      {/* Head group (for tilting) */}
      <group ref={headRef} position={[0, 1.05, 0]}>
        <mesh>
          <boxGeometry args={[0.38, 0.4, 0.35]} />
          <meshStandardMaterial
            color={colors.skin}
            map={texture || undefined}
          />
        </mesh>
        {/* Hair cap */}
        <mesh position={[0, 0.22, 0]}>
          <boxGeometry args={[0.4, 0.12, 0.37]} />
          <meshStandardMaterial color={colors.hair} />
        </mesh>
        {/* Eyes */}
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
        <mesh ref={leftElbowRef} position={[0, -0.25, 0]}>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color={colors.skin} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.35, 0.65, 0]}>
        <mesh ref={rightElbowRef} position={[0, -0.25, 0]}>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color={colors.skin} />
        </mesh>
      </group>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.12, 0.15, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[0.14, 0.35, 0.14]} />
          <meshStandardMaterial color={colors.pants} />
        </mesh>
        <mesh position={[0, -0.42, 0.03]}>
          <boxGeometry args={[0.16, 0.08, 0.22]} />
          <meshStandardMaterial color={colors.shoes} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.12, 0.15, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <boxGeometry args={[0.14, 0.35, 0.14]} />
          <meshStandardMaterial color={colors.pants} />
        </mesh>
        <mesh position={[0, -0.42, 0.03]}>
          <boxGeometry args={[0.16, 0.08, 0.22]} />
          <meshStandardMaterial color={colors.shoes} />
        </mesh>
      </group>
    </group>
  );
}
