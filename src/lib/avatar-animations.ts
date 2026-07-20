/**
 * Mixamo-style procedural animation system for the geometric avatar.
 *
 * Each animation state defines how each body part moves over time.
 * Transitions between states are blended smoothly.
 *
 * Body parts animated:
 *   - bodyY / bodyRotZ   — whole-body vertical bob & sway
 *   - headTilt           — head nod/look direction
 *   - leftArm / rightArm — shoulder rotation (x-axis = forward/back, z-axis = out/in)
 *   - leftLeg / rightLeg — hip rotation (x-axis = forward/back)
 *   - leftElbow / rightElbow — elbow bend
 */

export interface AnimationFrame {
  bodyY: number;
  bodyRotZ: number;
  headTilt: number;
  leftArm: number;   // shoulder x rotation
  rightArm: number;
  leftArmZ: number;  // shoulder z rotation (arm out)
  rightArmZ: number;
  leftLeg: number;
  rightLeg: number;
  leftElbow: number;
  rightElbow: number;
}

export type AnimState = "idle" | "walk" | "typing" | "sleep";

/**
 * Generate animation frame for a given state at time `t` (seconds).
 * Uses sin/cos with different frequencies/amplitudes to simulate Mixamo-style motion.
 */
export function getAnimationFrame(state: AnimState, t: number): AnimationFrame {
  switch (state) {
    // ── IDLE: Subtle breathing, slight head turn, occasional shift ────
    case "idle":
      return {
        bodyY: Math.sin(t * 0.8) * 0.015,
        bodyRotZ: Math.sin(t * 0.4) * 0.015,
        headTilt: Math.sin(t * 0.5) * 0.05,
        leftArm: 0.2 + Math.sin(t * 0.6) * 0.05,
        rightArm: 0.2 + Math.sin(t * 0.6 + 0.5) * 0.05,
        leftArmZ: -0.1,
        rightArmZ: 0.1,
        leftLeg: Math.sin(t * 0.3) * 0.03,
        rightLeg: Math.sin(t * 0.3 + 0.5) * 0.03,
        leftElbow: 0.1 + Math.sin(t * 0.7) * 0.05,
        rightElbow: 0.1 + Math.sin(t * 0.7 + 0.3) * 0.05,
      };

    // ── WALK: Opposite arm/leg swing, body bob, forward lean ─────────
    case "walk":
      return {
        bodyY: Math.sin(t * 4.0) * 0.025,
        bodyRotZ: Math.sin(t * 4.0) * 0.01,
        headTilt: 0,
        leftArm: Math.sin(t * 4.0 + Math.PI) * 0.35,  // opposite to right leg
        rightArm: Math.sin(t * 4.0) * 0.35,            // opposite to left leg
        leftArmZ: -0.15,
        rightArmZ: 0.15,
        leftLeg: Math.sin(t * 4.0) * 0.3,              // swing forward
        rightLeg: Math.sin(t * 4.0 + Math.PI) * 0.3,   // opposite swing
        leftElbow: 0.2 + Math.sin(t * 4.0 + Math.PI) * 0.1,
        rightElbow: 0.2 + Math.sin(t * 4.0) * 0.1,
      };

    // ── TYPING: Arms forward, slight body bounce, head down ──────────
    case "typing":
      return {
        bodyY: Math.sin(t * 5.0) * 0.005,
        bodyRotZ: 0,
        headTilt: -0.08,
        leftArm: -0.5 + Math.sin(t * 7.0) * 0.08,     // arms forward
        rightArm: -0.5 + Math.sin(t * 7.0 + 0.3) * 0.08,
        leftArmZ: 0.08,
        rightArmZ: -0.08,
        leftLeg: 0,
        rightLeg: 0,
        leftElbow: 0.5 + Math.sin(t * 7.0) * 0.06,     // fingers/elbow motion
        rightElbow: 0.5 + Math.sin(t * 7.0 + 0.5) * 0.06,
      };

    // ── SLEEP: Slumped forward, arms relaxed, slow breathing ─────────
    case "sleep":
      return {
        bodyY: Math.sin(t * 0.3) * 0.01,
        bodyRotZ: 0.05,  // slight lean
        headTilt: -0.3,  // head drooping
        leftArm: 0.6,    // arms hanging
        rightArm: 0.6,
        leftArmZ: 0.2,
        rightArmZ: -0.2,
        leftLeg: 0.05,
        rightLeg: 0.05,
        leftElbow: 0.3,
        rightElbow: 0.3,
      };
  }
}

/**
 * Linearly interpolate between two animation frames.
 * Uses 0..1 blend factor.
 */
export function blendFrames(a: AnimationFrame, b: AnimationFrame, t: number): AnimationFrame {
  const lerp = (x: number, y: number) => x + (y - x) * t;
  return {
    bodyY: lerp(a.bodyY, b.bodyY),
    bodyRotZ: lerp(a.bodyRotZ, b.bodyRotZ),
    headTilt: lerp(a.headTilt, b.headTilt),
    leftArm: lerp(a.leftArm, b.leftArm),
    rightArm: lerp(a.rightArm, b.rightArm),
    leftArmZ: lerp(a.leftArmZ, b.leftArmZ),
    rightArmZ: lerp(a.rightArmZ, b.rightArmZ),
    leftLeg: lerp(a.leftLeg, b.leftLeg),
    rightLeg: lerp(a.rightLeg, b.rightLeg),
    leftElbow: lerp(a.leftElbow, b.leftElbow),
    rightElbow: lerp(a.rightElbow, b.rightElbow),
  };
}

/**
 * Map AvatarState (from activity tracker) to AnimState.
 */
export function avatarStateToAnim(state: string): AnimState {
  switch (state) {
    case "typing": return "typing";
    case "idle":   return "sleep";    // sleep when idle for 35s
    default:       return "idle";     // active / browsing
  }
}
