"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
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

// ─── Default fallback palette ──────────────────────────────────────────────

const DEFAULT_COLORS = {
  ...DEFAULT_OUTFIT_COLORS,
  shoes: "#2B2925",
  eyeWhite: "#F5F0E8",
  eyePupil: "#2C1810",
  mouth: "#C4877A",
};

// ─── Props ─────────────────────────────────────────────────────────────────

interface GeometricAvatarProps {
  photoDataUrl: string | null;
  state: AvatarState;
  shirtColor?: string;
  pantsColor?: string;
  hairColor?: string;
  skinColor?: string;
}

// ─── Smooth state blend helper ─────────────────────────────────────────────

class AnimationBlender {
  private currentState: AnimState = "idle";
  private previousState: AnimState = "idle";
  private blendTime = 0;
  private readonly blendDuration = 0.4;

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
    const eased = progress * progress * (3 - 2 * progress);
    return blendFrames(from, to, eased);
  }
}

// ─── Color animation helpers ───────────────────────────────────────────────

const COLOR_LERP_SPEED = 4.0; // exponential smoothing factor (~0.5s to settle)

type ColorKey = "shirt" | "pants" | "hair" | "shoes" | "skin";

/**
 * Manages smooth color transitions for a group of materials.
 * Stores a current animated THREE.Color and a target, lerping each frame.
 */
class ColorAnimator {
  readonly current: THREE.Color;
  readonly target: THREE.Color;
  readonly materials: THREE.MeshStandardMaterial[] = [];

  constructor(hex: string) {
    this.current = new THREE.Color(hex);
    this.target = new THREE.Color(hex);
  }

  /** Track a material whose color should be animated */
  track(mat: THREE.MeshStandardMaterial | null) {
    if (mat) this.materials.push(mat);
  }

  /** Set a new target color (called on prop change) */
  setTarget(hex: string) {
    this.target.set(hex);
  }

  /** Lerp current toward target and apply to all tracked materials */
  tick(delta: number) {
    const factor = 1 - Math.exp(-COLOR_LERP_SPEED * delta);
    this.current.lerp(this.target, factor);
    const c = this.current;
    for (let i = 0; i < this.materials.length; i++) {
      this.materials[i].color.copy(c);
    }
  }

  /** Snap current to target immediately (avoids white flash on mount) */
  snapToTarget() {
    this.current.copy(this.target);
    const c = this.current;
    for (let i = 0; i < this.materials.length; i++) {
      this.materials[i].color.copy(c);
    }
  }
}

// ─── Breathing ────────────────────────────────────────────────────────────

const BREATH: Record<AnimState, { rate: number; amp: number }> = {
  sleep:     { rate: 0.25, amp: 0.035 }, // deep slow breaths
  idle:      { rate: 0.30, amp: 0.022 }, // normal resting
  walk:      { rate: 0.50, amp: 0.028 }, // slightly faster, deeper
  typing:    { rate: 0.35, amp: 0.012 }, // shallow, tense
  celebrate: { rate: 0.45, amp: 0.030 }, // excited, faster
};

// ─── Constants ─────────────────────────────────────────────────────────────

const R = 0.06;
const R_SMALL = 0.04;
const HEAD_W = 0.42;
const HEAD_H = 0.44;
const HEAD_D = 0.38;

// ─── Component ─────────────────────────────────────────────────────────────

export function GeometricAvatar({ photoDataUrl, state, shirtColor, pantsColor, hairColor, skinColor }: GeometricAvatarProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const headGroupRef = useRef<THREE.Group>(null!);
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);
  const leftForearmRef = useRef<THREE.Mesh>(null!);
  const rightForearmRef = useRef<THREE.Mesh>(null!);
  const torsoGroupRef = useRef<THREE.Group>(null!);

  const blenderRef = useRef(new AnimationBlender());

  // ── Smooth color animation (refs – no re-renders) ──────────────────
  const animRef = useRef({
    shirt: new ColorAnimator(shirtColor || DEFAULT_COLORS.shirt),
    pants: new ColorAnimator(pantsColor || DEFAULT_COLORS.pants),
    hair: new ColorAnimator(hairColor || DEFAULT_COLORS.hair),
    shoes: new ColorAnimator(DEFAULT_COLORS.shoes),
    skin: new ColorAnimator(skinColor || DEFAULT_COLORS.skin),
  });

  // Sync targets when props change
  useEffect(() => {
    animRef.current.shirt.setTarget(shirtColor || DEFAULT_COLORS.shirt);
    animRef.current.pants.setTarget(pantsColor || DEFAULT_COLORS.pants);
    animRef.current.hair.setTarget(hairColor || DEFAULT_COLORS.hair);
    animRef.current.skin.setTarget(skinColor || DEFAULT_COLORS.skin);
  }, [shirtColor, pantsColor, hairColor, skinColor]);

  // ── Material refs for the color-animated meshes ───────────────────
  const matTorso = useRef<THREE.MeshStandardMaterial>(null!);
  const matHairMain = useRef<THREE.MeshStandardMaterial>(null!);
  const matHairLeft = useRef<THREE.MeshStandardMaterial>(null!);
  const matHairRight = useRef<THREE.MeshStandardMaterial>(null!);
  const matBrowLeft = useRef<THREE.MeshStandardMaterial>(null!);
  const matBrowRight = useRef<THREE.MeshStandardMaterial>(null!);
  const matPantsLU = useRef<THREE.MeshStandardMaterial>(null!);
  const matPantsLL = useRef<THREE.MeshStandardMaterial>(null!);
  const matPantsRU = useRef<THREE.MeshStandardMaterial>(null!);
  const matPantsRL = useRef<THREE.MeshStandardMaterial>(null!);
  const matShoeL = useRef<THREE.MeshStandardMaterial>(null!);
  const matShoeR = useRef<THREE.MeshStandardMaterial>(null!);
  const matShoulderL = useRef<THREE.MeshStandardMaterial>(null!);
  const matShoulderR = useRef<THREE.MeshStandardMaterial>(null!);
  const matHead = useRef<THREE.MeshStandardMaterial>(null!);
  const matNeck = useRef<THREE.MeshStandardMaterial>(null!);
  const matArmLU = useRef<THREE.MeshStandardMaterial>(null!);
  const matArmLF = useRef<THREE.MeshStandardMaterial>(null!);
  const matArmRU = useRef<THREE.MeshStandardMaterial>(null!);
  const matArmRF = useRef<THREE.MeshStandardMaterial>(null!);

  // Track materials with their color animators (runs once on mount)
  useEffect(() => {
    const a = animRef.current;
    a.shirt.track(matTorso.current);
    a.shirt.track(matShoulderL.current);
    a.shirt.track(matShoulderR.current);
    a.pants.track(matPantsLU.current);
    a.pants.track(matPantsLL.current);
    a.pants.track(matPantsRU.current);
    a.pants.track(matPantsRL.current);
    a.hair.track(matHairMain.current);
    a.hair.track(matHairLeft.current);
    a.hair.track(matHairRight.current);
    a.hair.track(matBrowLeft.current);
    a.hair.track(matBrowRight.current);
    a.shoes.track(matShoeL.current);
    a.shoes.track(matShoeR.current);
    a.skin.track(matHead.current);
    a.skin.track(matNeck.current);
    a.skin.track(matArmLU.current);
    a.skin.track(matArmLF.current);
    a.skin.track(matArmRU.current);
    a.skin.track(matArmRF.current);

    // Snap to target colors immediately (prevents white flash on mount)
    a.shirt.snapToTarget();
    a.pants.snapToTarget();
    a.hair.snapToTarget();
    a.shoes.snapToTarget();
    a.skin.snapToTarget();
  }, []);

  // Load photo texture
  const texture = useMemo(() => {
    if (!photoDataUrl) return null;
    const loader = new THREE.TextureLoader();
    const tex = loader.load(photoDataUrl);
    tex.flipY = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [photoDataUrl]);

  // Main animation loop – drives motion + color transitions
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const animState = avatarStateToAnim(state);
    blenderRef.current.update(delta, animState);

    const t = Date.now() * 0.001;
    const frame = blenderRef.current.getFrame(t);

    groupRef.current.position.y = frame.bodyY;
    groupRef.current.rotation.z = frame.bodyRotZ;

    if (headGroupRef.current) {
      headGroupRef.current.rotation.x = frame.headTilt;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = frame.leftArm;
      leftArmRef.current.rotation.z = frame.leftArmZ;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = frame.rightArm;
      rightArmRef.current.rotation.z = frame.rightArmZ;
    }
    if (leftLegRef.current) {
      leftLegRef.current.rotation.x = frame.leftLeg;
    }
    if (rightLegRef.current) {
      rightLegRef.current.rotation.x = frame.rightLeg;
    }
    if (leftForearmRef.current) {
      leftForearmRef.current.rotation.x = frame.leftElbow;
    }
    if (rightForearmRef.current) {
      rightForearmRef.current.rotation.x = frame.rightElbow;
    }

    // ── Animate colors ─────────────────────────────────────────
    const a = animRef.current;
    a.shirt.tick(delta);
    a.pants.tick(delta);
    a.hair.tick(delta);
    a.shoes.tick(delta);
    a.skin.tick(delta);

    // ── Breathing ──────────────────────────────────────────────
    if (torsoGroupRef.current) {
      const b = BREATH[animState];
      const breath = Math.sin(t * b.rate * Math.PI * 2) * b.amp;
      torsoGroupRef.current.scale.y = 1 + breath;
      torsoGroupRef.current.scale.x = 1 + breath * 0.3;
    }
  });

  return (
    <group ref={groupRef} scale={1.3} position={[0, -0.35, 0]}>
      {/* ── Body (torso) ─────────────────────────────────────────────── */}
      <group ref={torsoGroupRef}>
        <RoundedBox args={[0.52, 0.58, 0.28]} radius={R} smoothness={3}>
          <meshStandardMaterial ref={matTorso} roughness={0.7} />
        </RoundedBox>
      </group>

      {/* Collar detail */}
      <mesh position={[0, 0.33, 0.15]}>
        <planeGeometry args={[0.2, 0.04]} />
        <meshStandardMaterial color={DEFAULT_COLORS.skin} roughness={0.8} />
      </mesh>

      {/* ── Neck ─────────────────────────────────────────────────────── */}
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.08, 8]} />
        <meshStandardMaterial ref={matNeck} roughness={0.8} />
      </mesh>

      {/* ── Head ─────────────────────────────────────────────────────── */}
      <group ref={headGroupRef} position={[0, 1.08, 0]}>
        {/* Main head */}
        <RoundedBox args={[HEAD_W, HEAD_H, HEAD_D]} radius={R} smoothness={3}>
          <meshStandardMaterial ref={matHead} roughness={0.6} />
        </RoundedBox>

        {/* Face plane – photo texture */}
        {texture && (
          <mesh position={[0, 0.02, HEAD_D / 2 + 0.001]}>
            <planeGeometry args={[HEAD_W * 0.75, HEAD_H * 0.7]} />
            <meshStandardMaterial
              map={texture}
              toneMapped={false}
              transparent={false}
              side={THREE.FrontSide}
            />
          </mesh>
        )}

        {/* ── Hair ───────────────────────────────────────────────────── */}
        <RoundedBox
          args={[HEAD_W + 0.04, HEAD_H * 0.25, HEAD_D]}
          radius={R_SMALL}
          smoothness={3}
          position={[0, HEAD_H * 0.36, 0]}
        >
          <meshStandardMaterial ref={matHairMain} roughness={0.9} />
        </RoundedBox>
        <RoundedBox
          args={[0.06, HEAD_H * 0.35, HEAD_D]}
          radius={R_SMALL}
          smoothness={3}
          position={[-HEAD_W / 2 - 0.02, 0.0, 0]}
        >
          <meshStandardMaterial ref={matHairLeft} roughness={0.9} />
        </RoundedBox>
        <RoundedBox
          args={[0.06, HEAD_H * 0.35, HEAD_D]}
          radius={R_SMALL}
          smoothness={3}
          position={[HEAD_W / 2 + 0.02, 0.0, 0]}
        >
          <meshStandardMaterial ref={matHairRight} roughness={0.9} />
        </RoundedBox>

        {/* ── Eyes ────────────────────────────────────────────────────── */}
        <mesh position={[-0.13, 0.06, HEAD_D / 2 + 0.005]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color={DEFAULT_COLORS.eyeWhite} roughness={0.3} />
        </mesh>
        <mesh position={[-0.13, 0.06, HEAD_D / 2 + 0.025]}>
          <sphereGeometry args={[0.025, 10, 10]} />
          <meshStandardMaterial color={DEFAULT_COLORS.eyePupil} roughness={0.1} />
        </mesh>
        <mesh position={[0.13, 0.06, HEAD_D / 2 + 0.005]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color={DEFAULT_COLORS.eyeWhite} roughness={0.3} />
        </mesh>
        <mesh position={[0.13, 0.06, HEAD_D / 2 + 0.025]}>
          <sphereGeometry args={[0.025, 10, 10]} />
          <meshStandardMaterial color={DEFAULT_COLORS.eyePupil} roughness={0.1} />
        </mesh>

        {/* ── Eyebrows ───────────────────────────────────────────────── */}
        <RoundedBox
          args={[0.08, 0.012, 0.02]}
          radius={0.006}
          smoothness={2}
          position={[-0.13, 0.14, HEAD_D / 2 + 0.01]}
        >
          <meshStandardMaterial ref={matBrowLeft} roughness={0.9} />
        </RoundedBox>
        <RoundedBox
          args={[0.08, 0.012, 0.02]}
          radius={0.006}
          smoothness={2}
          position={[0.13, 0.14, HEAD_D / 2 + 0.01]}
        >
          <meshStandardMaterial ref={matBrowRight} roughness={0.9} />
        </RoundedBox>

        {/* Mouth */}
        <mesh position={[0, -0.08, HEAD_D / 2 + 0.008]}>
          <planeGeometry args={[0.06, 0.012]} />
          <meshStandardMaterial color={DEFAULT_COLORS.mouth} roughness={0.9} />
        </mesh>
      </group>

      {/* ── Left Arm ─────────────────────────────────────────────────── */}
      <group ref={leftArmRef} position={[-0.35, 0.62, 0]}>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.07, 0.075, 0.35, 8]} />
          <meshStandardMaterial ref={matArmLU} roughness={0.7} />
        </mesh>
        <mesh ref={leftForearmRef} position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.065, 0.055, 0.3, 8]} />
          <meshStandardMaterial ref={matArmLF} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial ref={matShoulderL} roughness={0.7} />
        </mesh>
      </group>

      {/* ── Right Arm ────────────────────────────────────────────────── */}
      <group ref={rightArmRef} position={[0.35, 0.62, 0]}>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.07, 0.075, 0.35, 8]} />
          <meshStandardMaterial ref={matArmRU} roughness={0.7} />
        </mesh>
        <mesh ref={rightForearmRef} position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.065, 0.055, 0.3, 8]} />
          <meshStandardMaterial ref={matArmRF} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial ref={matShoulderR} roughness={0.7} />
        </mesh>
      </group>

      {/* ── Left Leg ─────────────────────────────────────────────────── */}
      <group ref={leftLegRef} position={[-0.12, 0.15, 0]}>
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.09, 0.08, 0.32, 8]} />
          <meshStandardMaterial ref={matPantsLU} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.4, 0.01]}>
          <cylinderGeometry args={[0.075, 0.065, 0.28, 8]} />
          <meshStandardMaterial ref={matPantsLL} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.52, 0.04]}>
          <RoundedBox args={[0.18, 0.08, 0.28]} radius={0.03} smoothness={2}>
            <meshStandardMaterial ref={matShoeL} roughness={0.9} />
          </RoundedBox>
        </mesh>
      </group>

      {/* ── Right Leg ────────────────────────────────────────────────── */}
      <group ref={rightLegRef} position={[0.12, 0.15, 0]}>
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.09, 0.08, 0.32, 8]} />
          <meshStandardMaterial ref={matPantsRU} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.4, 0.01]}>
          <cylinderGeometry args={[0.075, 0.065, 0.28, 8]} />
          <meshStandardMaterial ref={matPantsRL} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.52, 0.04]}>
          <RoundedBox args={[0.18, 0.08, 0.28]} radius={0.03} smoothness={2}>
            <meshStandardMaterial ref={matShoeR} roughness={0.9} />
          </RoundedBox>
        </mesh>
      </group>
    </group>
  );
}
