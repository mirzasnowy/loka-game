"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, MathUtils } from "three";
import { avatar, KNOCKDOWN_MS } from "./avatarState";

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
  const rootG = useRef<Group>(null!);
  const bodyG = useRef<Group>(null!);
  const armL  = useRef<Group>(null!);
  const armR  = useRef<Group>(null!);
  const legL  = useRef<Group>(null!);
  const legR  = useRef<Group>(null!);
  const gunG  = useRef<Group>(null!);
  const muzzle= useRef<Group>(null!);
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

    // PUNCH — jab(1), cross(2), hook(3), uppercut(4)
    const pt = (now - avatar.punchAt) / (avatar.comboCount >= 4 ? 360 : 260);
    if (pt >= 0 && pt < 1) {
      const k = Math.sin(pt * Math.PI);
      const m = avatar.comboCount;
      if (m === 1) {
        // Jab — quick right straight
        armR.current.rotation.x = MathUtils.lerp(armR.current.rotation.x, -1.7, k);
        armL.current.rotation.x = MathUtils.lerp(armL.current.rotation.x, -0.7, k * 0.6);
        bodyG.current.rotation.y = MathUtils.lerp(0, -0.3, k);
      } else if (m === 2) {
        // Cross — powerful left straight with hip turn
        armL.current.rotation.x = MathUtils.lerp(armL.current.rotation.x, -1.8, k);
        armR.current.rotation.x = MathUtils.lerp(armR.current.rotation.x, -0.7, k * 0.6);
        bodyG.current.rotation.y = MathUtils.lerp(0, 0.4, k);
      } else if (m === 3) {
        // Hook — left arm swings horizontally
        armL.current.rotation.x = MathUtils.lerp(armL.current.rotation.x, -1.3, k);
        armL.current.rotation.z = MathUtils.lerp(armL.current.rotation.z, -1.1, k);
        armR.current.rotation.x = MathUtils.lerp(armR.current.rotation.x, -0.7, k * 0.6);
        bodyG.current.rotation.y = MathUtils.lerp(0, 0.5, k);
      } else {
        // Uppercut — right arm scoops up + little hop
        armR.current.rotation.x = MathUtils.lerp(armR.current.rotation.x, -2.4, k);
        armR.current.rotation.z = MathUtils.lerp(armR.current.rotation.z, 0.4, k);
        armL.current.rotation.x = MathUtils.lerp(armL.current.rotation.x, -0.7, k * 0.6);
        bodyG.current.rotation.y = MathUtils.lerp(0, -0.2, k);
        bodyG.current.position.y += k * 0.15;
      }
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

    // WEAPON — pistol aim pose (overrides arm swing), recoil + muzzle flash
    const armed = avatar.weapon === "pistol";
    if (gunG.current) gunG.current.visible = armed;
    if (armed) {
      const aim = 1 - Math.exp(-18 * delta);
      armR.current.rotation.x = MathUtils.lerp(armR.current.rotation.x, -1.32, aim);
      armL.current.rotation.x = MathUtils.lerp(armL.current.rotation.x, -1.08, aim);
      armR.current.rotation.z = MathUtils.lerp(armR.current.rotation.z, -0.04, aim);
      armL.current.rotation.z = MathUtils.lerp(armL.current.rotation.z, 0.34, aim);
      const ft = (now - avatar.fireAt) / 130;
      if (ft >= 0 && ft < 1) {
        const k = Math.sin(ft * Math.PI);
        armR.current.rotation.x -= 0.4 * k; // recoil kick up
        bodyG.current.rotation.y = MathUtils.lerp(0, -0.12, k);
      }
      if (muzzle.current) muzzle.current.visible = ft >= 0 && ft < 0.45;
    } else if (muzzle.current) {
      muzzle.current.visible = false;
    }

    // MOTORCYCLE SITTING POSE
    if (avatar.ridingMode === "moto") {
      legL.current.rotation.x = MathUtils.lerp(legL.current.rotation.x, -1.2, sm);
      legR.current.rotation.x = MathUtils.lerp(legR.current.rotation.x, -1.2, sm);
      legL.current.rotation.z = MathUtils.lerp(legL.current.rotation.z, 0.2, sm);
      legR.current.rotation.z = MathUtils.lerp(legR.current.rotation.z, -0.2, sm);
      armL.current.rotation.x = MathUtils.lerp(armL.current.rotation.x, -1.0, sm);
      armR.current.rotation.x = MathUtils.lerp(armR.current.rotation.x, -1.0, sm);
      lean.current = MathUtils.lerp(lean.current, 0.25, sm);
    } else {
      legL.current.rotation.z = MathUtils.lerp(legL.current.rotation.z, 0, sm);
      legR.current.rotation.z = MathUtils.lerp(legR.current.rotation.z, 0, sm);
    }

    bodyG.current.rotation.x = lean.current;
    bodyG.current.position.y = idleBob;

    // KNOCKDOWN (ragdoll-lite): fall back → lie a moment → get up.
    const kd = now - avatar.knockdownAt;
    if (avatar.knockdownAt > 0 && kd < KNOCKDOWN_MS) {
      const p = kd / KNOCKDOWN_MS;
      let tilt: number;
      if (p < 0.18) tilt = (-Math.PI / 2) * (p / 0.18);          // fall
      else if (p < 0.72) tilt = -Math.PI / 2;                    // lie
      else tilt = (-Math.PI / 2) * (1 - (p - 0.72) / 0.28);      // get up
      rootG.current.rotation.x = tilt;
      rootG.current.position.y = 0;
    } else {
      rootG.current.rotation.x = MathUtils.lerp(rootG.current.rotation.x, 0, sm);
      if (avatar.sitting) {
        // sit pose: bend hips/knees and drop slightly onto the seat
        legL.current.rotation.x = MathUtils.lerp(legL.current.rotation.x, -1.45, sm);
        legR.current.rotation.x = MathUtils.lerp(legR.current.rotation.x, -1.45, sm);
        rootG.current.position.y = MathUtils.lerp(rootG.current.position.y, -0.35, sm);
      } else {
        rootG.current.position.y = MathUtils.lerp(rootG.current.position.y, 0, sm);
      }
    }
  });

  return (
    <group ref={rootG}>
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
      {/* Right arm pivot (holds the pistol) */}
      <group ref={armR} position={[0.31, 1.34, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow><boxGeometry args={[0.14, 0.44, 0.16]} /><meshLambertMaterial color={JACKET} /></mesh>
        <mesh position={[0, -0.56, 0.02]} castShadow><boxGeometry args={[0.12, 0.34, 0.14]} /><meshLambertMaterial color={SKIN} /></mesh>
        {/* Pistol in hand — pointing along -Y of the arm (forward when arm is raised) */}
        <group ref={gunG} position={[0, -0.72, 0.12]} visible={false}>
          {/* slide/body */}
          <mesh position={[0, 0, 0.1]} castShadow><boxGeometry args={[0.09, 0.13, 0.34]} /><meshLambertMaterial color="#33373d" /></mesh>
          {/* barrel */}
          <mesh position={[0, 0.03, 0.3]}><boxGeometry args={[0.06, 0.07, 0.16]} /><meshLambertMaterial color="#22252a" /></mesh>
          {/* grip */}
          <mesh position={[0, -0.12, -0.02]} rotation={[0.35, 0, 0]} castShadow><boxGeometry args={[0.08, 0.18, 0.1]} /><meshLambertMaterial color="#1a1c20" /></mesh>
          {/* muzzle flash */}
          <group ref={muzzle} position={[0, 0.03, 0.42]} visible={false}>
            <mesh><sphereGeometry args={[0.12, 6, 5]} /><meshBasicMaterial color="#fff1a0" /></mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[0.1, 0.3, 6]} /><meshBasicMaterial color="#ffd23a" /></mesh>
          </group>
        </group>
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
