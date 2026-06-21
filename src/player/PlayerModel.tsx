"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, MathUtils } from "three";
import { avatar } from "./avatarState";

/**
 * Articulated hero with real limb animation: idle breathing, walk, run (faster +
 * lean), jab punch (right arm), kick (right leg), jump tuck. Reads `avatar`
 * (written by Player + CombatSystem) — no GLTF needed, pure procedural rig.
 */

const SKIN = "#caa176";
const JACKET = "#27406e";
const TRIM = "#e8e8ec";
const PANTS = "#2a2f3a";
const HAIR = "#241608";
const SHOE = "#eef0f4";
const PACK = "#3a4a5a";

export default function PlayerModel() {
  const bodyG = useRef<Group>(null!);
  const armL  = useRef<Group>(null!);
  const armR  = useRef<Group>(null!);
  const legL  = useRef<Group>(null!);
  const legR  = useRef<Group>(null!);
  const phase = useRef(0);
  const lean  = useRef(0);

  useFrame((_, delta) => {
    const now = performance.now();
    const speed = avatar.speed;
    const moving = speed > 0.3;
    const running = avatar.running && moving;

    // gait phase
    const rate = running ? 11 : 7;
    if (moving) phase.current += delta * rate;
    const amp = running ? 0.95 : moving ? 0.6 : 0;

    // base walk targets
    const sw = Math.sin(phase.current) * amp;
    let tLegL = sw;
    let tLegR = -sw;
    let tArmL = -sw * 0.8;
    let tArmR = sw * 0.8;

    // idle breathing when still
    const idleBob = moving ? 0 : Math.sin(now * 0.0022) * 0.012;

    // jump tuck
    const jt = (now - avatar.jumpAt) / 500;
    if (jt >= 0 && jt < 1) {
      const k = Math.sin(jt * Math.PI);
      tLegL = MathUtils.lerp(tLegL, -0.9, k);
      tLegR = MathUtils.lerp(tLegR, -0.7, k);
      tArmL = MathUtils.lerp(tArmL, -1.6, k);
      tArmR = MathUtils.lerp(tArmR, -1.6, k);
    }

    // run/forward lean
    const leanTarget = running ? 0.20 : moving ? 0.09 : 0;
    lean.current = MathUtils.lerp(lean.current, leanTarget, 1 - Math.exp(-8 * delta));

    // apply smoothed locomotion
    const sm = 1 - Math.exp(-14 * delta);
    legL.current.rotation.x = MathUtils.lerp(legL.current.rotation.x, tLegL, sm);
    legR.current.rotation.x = MathUtils.lerp(legR.current.rotation.x, tLegR, sm);
    armL.current.rotation.x = MathUtils.lerp(armL.current.rotation.x, tArmL, sm);
    armR.current.rotation.x = MathUtils.lerp(armR.current.rotation.x, tArmR, sm);
    armL.current.rotation.z = 0.12; // slight outward
    armR.current.rotation.z = -0.12;

    // PUNCH — right arm jab forward (snappy, overrides)
    const pt = (now - avatar.punchAt) / 230;
    if (pt >= 0 && pt < 1) {
      const k = Math.sin(pt * Math.PI);
      armR.current.rotation.x = MathUtils.lerp(armR.current.rotation.x, -1.7, k);
      armL.current.rotation.x = MathUtils.lerp(armL.current.rotation.x, -0.7, k * 0.6); // guard
      bodyG.current.rotation.y = MathUtils.lerp(0, -0.35, k);
    } else {
      bodyG.current.rotation.y = MathUtils.lerp(bodyG.current.rotation.y, 0, sm);
    }

    // KICK — right leg snap forward
    const kt = (now - avatar.kickAt) / 320;
    if (kt >= 0 && kt < 1) {
      const k = Math.sin(kt * Math.PI);
      legR.current.rotation.x = MathUtils.lerp(legR.current.rotation.x, -1.5, k);
      armL.current.rotation.x = MathUtils.lerp(armL.current.rotation.x, 0.6, k * 0.5); // counter-balance
      lean.current = MathUtils.lerp(lean.current, -0.12, k); // lean back
    }

    bodyG.current.rotation.x = lean.current;
    bodyG.current.position.y = idleBob;
  });

  return (
    <group>
      {/* Body (torso + head + pack) */}
      <group ref={bodyG}>
        {/* Head */}
        <mesh position={[0, 1.60, 0]} castShadow><boxGeometry args={[0.38, 0.38, 0.36]} /><meshLambertMaterial color={SKIN} /></mesh>
        <mesh position={[0, 1.82, 0]}><boxGeometry args={[0.41, 0.13, 0.39]} /><meshLambertMaterial color={HAIR} /></mesh>
        {/* Torso jacket */}
        <mesh position={[0, 1.12, 0]} castShadow><boxGeometry args={[0.48, 0.64, 0.30]} /><meshLambertMaterial color={JACKET} /></mesh>
        <mesh position={[0, 1.12, 0.156]}><boxGeometry args={[0.06, 0.62, 0.02]} /><meshLambertMaterial color={TRIM} /></mesh>
        <mesh position={[0.13, 1.30, 0.158]}><boxGeometry args={[0.16, 0.10, 0.02]} /><meshLambertMaterial color="#f0c020" /></mesh>
        {/* Backpack */}
        <mesh position={[0, 1.14, -0.24]} castShadow><boxGeometry args={[0.40, 0.50, 0.20]} /><meshLambertMaterial color={PACK} /></mesh>
        <mesh position={[0, 1.22, -0.35]}><boxGeometry args={[0.30, 0.30, 0.04]} /><meshLambertMaterial color="#566678" /></mesh>
        {/* Belt */}
        <mesh position={[0, 0.80, 0]}><boxGeometry args={[0.49, 0.09, 0.31]} /><meshLambertMaterial color="#3a2a18" /></mesh>
      </group>

      {/* Left arm pivot at shoulder */}
      <group ref={armL} position={[-0.31, 1.34, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow><boxGeometry args={[0.14, 0.44, 0.16]} /><meshLambertMaterial color={JACKET} /></mesh>
        <mesh position={[0, -0.56, 0.02]} castShadow><boxGeometry args={[0.12, 0.34, 0.14]} /><meshLambertMaterial color={SKIN} /></mesh>
      </group>
      {/* Right arm pivot */}
      <group ref={armR} position={[0.31, 1.34, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow><boxGeometry args={[0.14, 0.44, 0.16]} /><meshLambertMaterial color={JACKET} /></mesh>
        <mesh position={[0, -0.56, 0.02]} castShadow><boxGeometry args={[0.12, 0.34, 0.14]} /><meshLambertMaterial color={SKIN} /></mesh>
      </group>

      {/* Left leg pivot at hip */}
      <group ref={legL} position={[-0.12, 0.74, 0]}>
        <mesh position={[0, -0.26, 0]} castShadow><boxGeometry args={[0.18, 0.52, 0.22]} /><meshLambertMaterial color={PANTS} /></mesh>
        <mesh position={[0, -0.60, 0.06]}><boxGeometry args={[0.17, 0.13, 0.34]} /><meshLambertMaterial color={SHOE} /></mesh>
      </group>
      {/* Right leg pivot */}
      <group ref={legR} position={[0.12, 0.74, 0]}>
        <mesh position={[0, -0.26, 0]} castShadow><boxGeometry args={[0.18, 0.52, 0.22]} /><meshLambertMaterial color={PANTS} /></mesh>
        <mesh position={[0, -0.60, 0.06]}><boxGeometry args={[0.17, 0.13, 0.34]} /><meshLambertMaterial color={SHOE} /></mesh>
      </group>
    </group>
  );
}
