"use client";

import { useRef, useMemo } from "react";
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
  skin: "#E8C4A0",
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

// ─── Constants ─────────────────────────────────────────────────────────────

const R = 0.06; // Default rounded-box radius
const R_SMALL = 0.04;

// ─── Component ─────────────────────────────────────────────────────────────

export function GeometricAvatar({ photoDataUrl, state, shirtColor, pantsColor, hairColor }: GeometricAvatarProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const headGroupRef = useRef<THREE.Group>(null!);
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);
  const leftForearmRef = useRef<THREE.Mesh>(null!);
  const rightForearmRef = useRef<THREE.Mesh>(null!);

  const blenderRef = useRef(new AnimationBlender());

  // Resolve colors
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
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [photoDataUrl]);

  // Main animation loop
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
  });

  const HEAD_W = 0.42;
  const HEAD_H = 0.44;
  const HEAD_D = 0.38;

  return (
    <group ref={groupRef} scale={1.3} position={[0, -0.35, 0]}>
      {/* ── Body (torso) ─────────────────────────────────────────────── */}
      <RoundedBox args={[0.52, 0.58, 0.28]} radius={R} smoothness={3}>
        <meshStandardMaterial color={colors.shirt} roughness={0.7} />
      </RoundedBox>

      {/* Collar detail – a thin strip at the top of the torso */}
      <mesh position={[0, 0.33, 0.15]}>
        <planeGeometry args={[0.2, 0.04]} />
        <meshStandardMaterial color={colors.skin} roughness={0.8} />
      </mesh>

      {/* ── Neck ─────────────────────────────────────────────────────── */}
      <mesh position={[0, 0.82, 0]}>
        <cylinderGeometry args={[0.08, 0.1, 0.08, 8]} />
        <meshStandardMaterial color={colors.skin} roughness={0.8} />
      </mesh>

      {/* ── Head ─────────────────────────────────────────────────────── */}
      <group ref={headGroupRef} position={[0, 1.08, 0]}>
        {/* Main head – rounded box with skin color */}
        <RoundedBox args={[HEAD_W, HEAD_H, HEAD_D]} radius={R} smoothness={3}>
          <meshStandardMaterial color={colors.skin} roughness={0.6} />
        </RoundedBox>

        {/* Face plane – the photo texture maps cleanly onto this */}
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

        {/* ── Hair ─────────────────────────────────────────────────────── */}
        {/* Main hair volume – sits on top and slightly over the sides */}
        <RoundedBox
          args={[HEAD_W + 0.04, HEAD_H * 0.25, HEAD_D]}
          radius={R_SMALL}
          smoothness={3}
          position={[0, HEAD_H * 0.36, 0]}
        >
          <meshStandardMaterial color={colors.hair} roughness={0.9} />
        </RoundedBox>
        {/* Side hair bits */}
        <RoundedBox
          args={[0.06, HEAD_H * 0.35, HEAD_D]}
          radius={R_SMALL}
          smoothness={3}
          position={[-HEAD_W / 2 - 0.02, 0.0, 0]}
        >
          <meshStandardMaterial color={colors.hair} roughness={0.9} />
        </RoundedBox>
        <RoundedBox
          args={[0.06, HEAD_H * 0.35, HEAD_D]}
          radius={R_SMALL}
          smoothness={3}
          position={[HEAD_W / 2 + 0.02, 0.0, 0]}
        >
          <meshStandardMaterial color={colors.hair} roughness={0.9} />
        </RoundedBox>

        {/* ── Eyes ─────────────────────────────────────────────────────── */}
        {/* Left eye sclera */}
        <mesh position={[-0.13, 0.06, HEAD_D / 2 + 0.005]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color={DEFAULT_COLORS.eyeWhite} roughness={0.3} />
        </mesh>
        {/* Left pupil */}
        <mesh position={[-0.13, 0.06, HEAD_D / 2 + 0.025]}>
          <sphereGeometry args={[0.025, 10, 10]} />
          <meshStandardMaterial color={DEFAULT_COLORS.eyePupil} roughness={0.1} />
        </mesh>
        {/* Right eye sclera */}
        <mesh position={[0.13, 0.06, HEAD_D / 2 + 0.005]}>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color={DEFAULT_COLORS.eyeWhite} roughness={0.3} />
        </mesh>
        {/* Right pupil */}
        <mesh position={[0.13, 0.06, HEAD_D / 2 + 0.025]}>
          <sphereGeometry args={[0.025, 10, 10]} />
          <meshStandardMaterial color={DEFAULT_COLORS.eyePupil} roughness={0.1} />
        </mesh>

        {/* ── Eyebrows ──────────────────────────────────────────────────── */}
        <RoundedBox
          args={[0.08, 0.012, 0.02]}
          radius={0.006}
          smoothness={2}
          position={[-0.13, 0.14, HEAD_D / 2 + 0.01]}
        >
          <meshStandardMaterial color={colors.hair} roughness={0.9} />
        </RoundedBox>
        <RoundedBox
          args={[0.08, 0.012, 0.02]}
          radius={0.006}
          smoothness={2}
          position={[0.13, 0.14, HEAD_D / 2 + 0.01]}
        >
          <meshStandardMaterial color={colors.hair} roughness={0.9} />
        </RoundedBox>

        {/* ── Mouth (subtle smile) ──────────────────────────────────────── */}
        <mesh position={[0, -0.08, HEAD_D / 2 + 0.008]}>
          <planeGeometry args={[0.06, 0.012]} />
          <meshStandardMaterial color={DEFAULT_COLORS.mouth} roughness={0.9} />
        </mesh>
      </group>

      {/* ── Left Arm ─────────────────────────────────────────────────── */}
      <group ref={leftArmRef} position={[-0.35, 0.62, 0]}>
        {/* Upper arm – cylinder */}
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.07, 0.075, 0.35, 8]} />
          <meshStandardMaterial color={colors.skin} roughness={0.7} />
        </mesh>
        {/* Forearm – cylinder with elbow hinge */}
        <mesh ref={leftForearmRef} position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.065, 0.055, 0.3, 8]} />
          <meshStandardMaterial color={colors.skin} roughness={0.7} />
        </mesh>
        {/* Shoulder joint */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color={colors.shirt} roughness={0.7} />
        </mesh>
      </group>

      {/* ── Right Arm ────────────────────────────────────────────────── */}
      <group ref={rightArmRef} position={[0.35, 0.62, 0]}>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.07, 0.075, 0.35, 8]} />
          <meshStandardMaterial color={colors.skin} roughness={0.7} />
        </mesh>
        <mesh ref={rightForearmRef} position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.065, 0.055, 0.3, 8]} />
          <meshStandardMaterial color={colors.skin} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color={colors.shirt} roughness={0.7} />
        </mesh>
      </group>

      {/* ── Left Leg ─────────────────────────────────────────────────── */}
      <group ref={leftLegRef} position={[-0.12, 0.15, 0]}>
        {/* Upper leg */}
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.09, 0.08, 0.32, 8]} />
          <meshStandardMaterial color={colors.pants} roughness={0.8} />
        </mesh>
        {/* Lower leg */}
        <mesh position={[0, -0.4, 0.01]}>
          <cylinderGeometry args={[0.075, 0.065, 0.28, 8]} />
          <meshStandardMaterial color={colors.pants} roughness={0.8} />
        </mesh>
        {/* Shoe */}
        <mesh position={[0, -0.52, 0.04]}>
          <RoundedBox args={[0.18, 0.08, 0.28]} radius={0.03} smoothness={2}>
            <meshStandardMaterial color={colors.shoes} roughness={0.9} />
          </RoundedBox>
        </mesh>
      </group>

      {/* ── Right Leg ────────────────────────────────────────────────── */}
      <group ref={rightLegRef} position={[0.12, 0.15, 0]}>
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.09, 0.08, 0.32, 8]} />
          <meshStandardMaterial color={colors.pants} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.4, 0.01]}>
          <cylinderGeometry args={[0.075, 0.065, 0.28, 8]} />
          <meshStandardMaterial color={colors.pants} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.52, 0.04]}>
          <RoundedBox args={[0.18, 0.08, 0.28]} radius={0.03} smoothness={2}>
            <meshStandardMaterial color={colors.shoes} roughness={0.9} />
          </RoundedBox>
        </mesh>
      </group>
    </group>
  );
}
