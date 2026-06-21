"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, MathUtils } from "three";
import { avatar, KNOCKDOWN_MS } from "./avatarState";

/**
 * Articulated hero with a real two-segment arm rig (shoulder + ELBOW). Punches
 * land forward with correct joint bends: jab/cross straighten the elbow, hook
 * brings a bent arm across to the front, uppercut drives a bent forearm upward.
 * Pure procedural — no GLTF.
 */

const SKIN = "#caa176";
const JACKET = "#27406e";
const TRIM = "#e8e8ec";
const PANTS = "#2a2f3a";
const HAIR = "#241608";
const SHOE = "#eef0f4";
const PACK = "#3a4a5a";

const lerp = MathUtils.lerp;

export default function PlayerModel() {
  const rootG = useRef<Group>(null!);
  const bodyG = useRef<Group>(null!);
  const headG = useRef<Group>(null!);
  const armL  = useRef<Group>(null!);
  const armR  = useRef<Group>(null!);
  const foreL = useRef<Group>(null!);
  const foreR = useRef<Group>(null!);
  const legL  = useRef<Group>(null!);
  const legR  = useRef<Group>(null!);
  const shinL = useRef<Group>(null!);
  const shinR = useRef<Group>(null!);
  const gunG  = useRef<Group>(null!);
  const muzzle= useRef<Group>(null!);
  const phase = useRef(0);
  const lean  = useRef(0);

  useFrame((_, delta) => {
    const now = performance.now();
    const speed = avatar.speed;
    const moving = speed > 0.3;
    const running = avatar.running && moving;

    if (moving) phase.current += delta * (running ? 11 : 7);
    const amp = running ? 0.95 : moving ? 0.6 : 0;
    const sw = Math.sin(phase.current) * amp;

    // ── target pose (radians). shoulder.x<0 = arm forward; elbow.x<0 = bent up/fwd ──
    let LSx = -sw * 0.8, LSz = 0.12, LSy = 0, LE = -0.18;   // left shoulder + elbow
    let RSx = sw * 0.8,  RSz = -0.12, RSy = 0, RE = -0.18;  // right shoulder + elbow
    let LLx = sw, LLz = 0, RLx = -sw, RLz = 0;              // legs (hip)
    let kneeL = 0.12, kneeR = 0.12;                         // knees (bend>0)
    if (moving) { kneeL = 0.2 + Math.max(0, -sw) * 0.7; kneeR = 0.2 + Math.max(0, sw) * 0.7; }
    let bodyY = 0;        // torso twist
    let bodyPitch = 0;    // lean into / out of a punch
    let headTurn = 0, headTuck = 0; // head follows the punch like a boxer
    let leanT = running ? 0.20 : moving ? 0.09 : 0;
    const idleBob = moving ? 0 : Math.sin(now * 0.0022) * 0.012;

    // jump tuck
    const jt = (now - avatar.jumpAt) / 500;
    if (jt >= 0 && jt < 1) {
      const k = Math.sin(jt * Math.PI);
      LLx = lerp(LLx, -0.9, k); RLx = lerp(RLx, -0.7, k);
      kneeL = lerp(kneeL, 0.9, k); kneeR = lerp(kneeR, 0.9, k);
      LSx = lerp(LSx, -1.5, k); RSx = lerp(RSx, -1.5, k); LE = lerp(LE, -1.2, k); RE = lerp(RE, -1.2, k);
    }

    // combat stance (kuda-kuda + guard up) + idle bob-and-weave when standing still
    const inCombat = now - Math.max(avatar.punchAt, avatar.kickAt) < 1500;
    if (inCombat && !moving) {
      LLx = -0.3; RLx = 0.28; LLz = 0.06; RLz = -0.06;
      LSx = -0.7; RSx = -0.7; LE = -1.1; RE = -1.1; LSz = 0.2; RSz = -0.2;
      bodyY = Math.sin(now * 0.005) * 0.08;     // subtle weave
      headTurn = Math.sin(now * 0.005) * 0.06;
    }

    // ── PUNCH: jab(1) cross(2) hook(3) uppercut(4) — all LAND FORWARD ──
    const pt = (now - avatar.punchAt) / (avatar.comboCount >= 3 ? 340 : 250);
    if (pt >= 0 && pt < 1) {
      const k = Math.sin(pt * Math.PI); // 0→1→0 extend + retract
      const m = avatar.comboCount;
      if (m === 1) {
        // Jab — right straight, elbow extends; torso & head rotate into it
        RSx = lerp(RSx, -1.55, k); RSz = lerp(RSz, -0.04, k); RE = lerp(RE, -0.06, k);
        LSx = lerp(LSx, -0.7, k); LE = lerp(LE, -1.1, k);
        bodyY = lerp(0, -0.30, k); bodyPitch = lerp(0, 0.14, k); headTurn = lerp(0, -0.16, k);
      } else if (m === 2) {
        // Cross — left straight with big hip + shoulder rotation
        LSx = lerp(LSx, -1.62, k); LSz = lerp(LSz, 0.05, k); LE = lerp(LE, -0.06, k);
        RSx = lerp(RSx, -0.7, k); RE = lerp(RE, -1.1, k);
        bodyY = lerp(0, 0.45, k); bodyPitch = lerp(0, 0.18, k); headTurn = lerp(0, 0.2, k);
      } else if (m === 3) {
        // Hook — bent left arm swings across to the FRONT, body whips around
        LSx = lerp(LSx, -1.35, k); LSz = lerp(LSz, -0.5, k); LSy = lerp(0, 0.7, k); LE = lerp(LE, -1.5, k);
        RSx = lerp(RSx, -0.7, k); RE = lerp(RE, -1.1, k);
        bodyY = lerp(0, 0.55, k); bodyPitch = lerp(0, 0.10, k); headTurn = lerp(0, 0.28, k);
      } else {
        // Uppercut — bent right forearm drives UP; body sinks then rises, chin up
        RSx = lerp(RSx, -0.25, k); RSz = lerp(RSz, 0.1, k); RE = lerp(RE, -2.35, k);
        LSx = lerp(LSx, -0.7, k); LE = lerp(LE, -1.1, k);
        bodyY = lerp(0, -0.2, k); bodyPitch = lerp(0, -0.14, k); headTuck = lerp(0, -0.18, k);
      }
    }

    // KICK — right leg snaps forward
    const kt = (now - avatar.kickAt) / 320;
    if (kt >= 0 && kt < 1) {
      const k = Math.sin(kt * Math.PI);
      RLx = lerp(RLx, -1.5, k);
      LSx = lerp(LSx, 0.5, k);
      leanT = lerp(leanT, -0.12, k);
    }

    // WEAPON — pistol aim straightens the right arm forward, gun points ahead
    const armed = avatar.weapon === "pistol";
    if (gunG.current) gunG.current.visible = armed;
    if (armed) {
      RSx = -1.3; RSz = -0.04; RE = -0.1;
      LSx = -1.05; LSz = 0.34; LE = -0.55;
      const ft = (now - avatar.fireAt) / 130;
      if (ft >= 0 && ft < 1) { const k = Math.sin(ft * Math.PI); RSx -= 0.35 * k; bodyY = lerp(bodyY, -0.12, k); }
      if (muzzle.current) muzzle.current.visible = ft >= 0 && ft < 0.45;
    } else if (muzzle.current) muzzle.current.visible = false;

    // MOTORCYCLE riding pose — thighs forward + splayed, knees bent onto pegs,
    // hands forward on the bars, torso leaned in.
    if (avatar.ridingMode === "moto") {
      LLx = -1.15; RLx = -1.15; LLz = 0.28; RLz = -0.28;
      kneeL = 1.0; kneeR = 1.0;
      LSx = -1.05; RSx = -1.05; LSz = 0.18; RSz = -0.18; LE = -0.55; RE = -0.55;
      leanT = 0.28;
      bodyY = 0;
    } else if (avatar.ridingMode === "car") {
      // seated in a car: thighs forward, hands on the wheel
      LLx = -1.3; RLx = -1.3; kneeL = 1.1; kneeR = 1.1;
      LSx = -1.0; RSx = -1.0; LE = -0.8; RE = -0.8;
    }

    // SITTING on a chair — thighs horizontal, knees down (feet on floor), hands on lap
    const sitTransition = avatar.sitting;
    if (sitTransition) {
      LLx = -1.55; RLx = -1.55; LLz = 0.08; RLz = -0.08;
      kneeL = 1.6; kneeR = 1.6;
      LSx = -0.35; RSx = -0.35; LSz = 0.15; RSz = -0.15; LE = -0.5; RE = -0.5;
      leanT = 0.0; bodyY = 0;
    }

    // ── smooth toward targets ──
    const sm = 1 - Math.exp(-16 * delta);
    lean.current = lerp(lean.current, leanT, 1 - Math.exp(-8 * delta));
    armL.current.rotation.set(lerp(armL.current.rotation.x, LSx, sm), lerp(armL.current.rotation.y, LSy, sm), lerp(armL.current.rotation.z, LSz, sm));
    armR.current.rotation.set(lerp(armR.current.rotation.x, RSx, sm), lerp(armR.current.rotation.y, RSy, sm), lerp(armR.current.rotation.z, RSz, sm));
    foreL.current.rotation.x = lerp(foreL.current.rotation.x, LE, sm);
    foreR.current.rotation.x = lerp(foreR.current.rotation.x, RE, sm);
    legL.current.rotation.set(lerp(legL.current.rotation.x, LLx, sm), 0, lerp(legL.current.rotation.z, LLz, sm));
    legR.current.rotation.set(lerp(legR.current.rotation.x, RLx, sm), 0, lerp(legR.current.rotation.z, RLz, sm));
    shinL.current.rotation.x = lerp(shinL.current.rotation.x, kneeL, sm);
    shinR.current.rotation.x = lerp(shinR.current.rotation.x, kneeR, sm);
    bodyG.current.rotation.y = lerp(bodyG.current.rotation.y, bodyY, sm);
    bodyG.current.rotation.x = lerp(bodyG.current.rotation.x, lean.current + bodyPitch, sm);
    bodyG.current.position.y = idleBob;
    if (headG.current) {
      headG.current.rotation.x = lerp(headG.current.rotation.x, headTuck, sm);
      headG.current.rotation.y = lerp(headG.current.rotation.y, headTurn, sm);
    }

    // KNOCKDOWN ragdoll + SIT on the root
    const kd = now - avatar.knockdownAt;
    if (avatar.knockdownAt > 0 && kd < KNOCKDOWN_MS) {
      const p = kd / KNOCKDOWN_MS;
      let tilt: number;
      if (p < 0.18) tilt = (-Math.PI / 2) * (p / 0.18);
      else if (p < 0.72) tilt = -Math.PI / 2;
      else tilt = (-Math.PI / 2) * (1 - (p - 0.72) / 0.28);
      rootG.current.rotation.x = tilt;
      rootG.current.position.y = 0;
    } else {
      rootG.current.rotation.x = lerp(rootG.current.rotation.x, 0, sm);
      // sitting lowers the whole body so the hips meet the seat (legs already posed)
      rootG.current.position.y = lerp(rootG.current.position.y, avatar.sitting ? -0.28 : 0, sm);
    }
  });

  return (
    <group ref={rootG}>
      {/* Body */}
      <group ref={bodyG}>
        {/* Head on its own pivot (neck) so it can turn/tuck like a boxer */}
        <group ref={headG} position={[0, 1.42, 0]}>
          <mesh position={[0, 0.18, 0]} castShadow><boxGeometry args={[0.38, 0.38, 0.36]} /><meshLambertMaterial color={SKIN} /></mesh>
          <mesh position={[0, 0.40, 0]}><boxGeometry args={[0.41, 0.13, 0.39]} /><meshLambertMaterial color={HAIR} /></mesh>
          <mesh position={[-0.08, 0.20, 0.185]}><boxGeometry args={[0.05, 0.05, 0.02]} /><meshLambertMaterial color="#1a1a1a" /></mesh>
          <mesh position={[0.08, 0.20, 0.185]}><boxGeometry args={[0.05, 0.05, 0.02]} /><meshLambertMaterial color="#1a1a1a" /></mesh>
        </group>
        <mesh position={[0, 1.12, 0]} castShadow><boxGeometry args={[0.48, 0.64, 0.30]} /><meshLambertMaterial color={JACKET} /></mesh>
        <mesh position={[0, 1.12, 0.156]}><boxGeometry args={[0.06, 0.62, 0.02]} /><meshLambertMaterial color={TRIM} /></mesh>
        <mesh position={[0.13, 1.30, 0.158]}><boxGeometry args={[0.16, 0.10, 0.02]} /><meshLambertMaterial color="#f0c020" /></mesh>
        <mesh position={[0, 1.14, -0.24]} castShadow><boxGeometry args={[0.40, 0.50, 0.20]} /><meshLambertMaterial color={PACK} /></mesh>
        <mesh position={[0, 1.22, -0.35]}><boxGeometry args={[0.30, 0.30, 0.04]} /><meshLambertMaterial color="#566678" /></mesh>
        <mesh position={[0, 0.80, 0]}><boxGeometry args={[0.49, 0.09, 0.31]} /><meshLambertMaterial color="#3a2a18" /></mesh>
      </group>

      {/* Left arm: shoulder → upper arm → elbow → forearm + fist */}
      <group ref={armL} position={[-0.31, 1.34, 0]}>
        <mesh position={[0, -0.20, 0]} castShadow><boxGeometry args={[0.14, 0.40, 0.16]} /><meshLambertMaterial color={JACKET} /></mesh>
        <group ref={foreL} position={[0, -0.42, 0]}>
          <mesh position={[0, -0.17, 0.01]} castShadow><boxGeometry args={[0.12, 0.34, 0.14]} /><meshLambertMaterial color={SKIN} /></mesh>
          <mesh position={[0, -0.36, 0.02]}><boxGeometry args={[0.13, 0.12, 0.15]} /><meshLambertMaterial color={SKIN} /></mesh>
        </group>
      </group>

      {/* Right arm (holds the pistol in the forearm) */}
      <group ref={armR} position={[0.31, 1.34, 0]}>
        <mesh position={[0, -0.20, 0]} castShadow><boxGeometry args={[0.14, 0.40, 0.16]} /><meshLambertMaterial color={JACKET} /></mesh>
        <group ref={foreR} position={[0, -0.42, 0]}>
          <mesh position={[0, -0.17, 0.01]} castShadow><boxGeometry args={[0.12, 0.34, 0.14]} /><meshLambertMaterial color={SKIN} /></mesh>
          <mesh position={[0, -0.36, 0.02]}><boxGeometry args={[0.13, 0.12, 0.15]} /><meshLambertMaterial color={SKIN} /></mesh>
          {/* pistol points along -Y of the forearm → forward when the arm is raised */}
          <group ref={gunG} position={[0, -0.4, 0.06]} rotation={[Math.PI / 2, 0, 0]} visible={false}>
            <mesh position={[0, 0, 0.08]} castShadow><boxGeometry args={[0.08, 0.12, 0.3]} /><meshLambertMaterial color="#33373d" /></mesh>
            <mesh position={[0, 0.02, 0.26]}><boxGeometry args={[0.06, 0.06, 0.14]} /><meshLambertMaterial color="#22252a" /></mesh>
            <mesh position={[0, -0.12, -0.02]} rotation={[0.35, 0, 0]} castShadow><boxGeometry args={[0.08, 0.18, 0.1]} /><meshLambertMaterial color="#1a1c20" /></mesh>
            <group ref={muzzle} position={[0, 0.02, 0.38]} visible={false}>
              <mesh><sphereGeometry args={[0.1, 6, 5]} /><meshBasicMaterial color="#fff1a0" /></mesh>
            </group>
          </group>
        </group>
      </group>

      {/* Legs: hip → thigh → knee → shin + shoe */}
      <group ref={legL} position={[-0.12, 0.74, 0]}>
        <mesh position={[0, -0.16, 0]} castShadow><boxGeometry args={[0.18, 0.34, 0.22]} /><meshLambertMaterial color={PANTS} /></mesh>
        <group ref={shinL} position={[0, -0.34, 0]}>
          <mesh position={[0, -0.16, 0]} castShadow><boxGeometry args={[0.16, 0.32, 0.2]} /><meshLambertMaterial color={PANTS} /></mesh>
          <mesh position={[0, -0.34, 0.06]}><boxGeometry args={[0.17, 0.13, 0.34]} /><meshLambertMaterial color={SHOE} /></mesh>
        </group>
      </group>
      <group ref={legR} position={[0.12, 0.74, 0]}>
        <mesh position={[0, -0.16, 0]} castShadow><boxGeometry args={[0.18, 0.34, 0.22]} /><meshLambertMaterial color={PANTS} /></mesh>
        <group ref={shinR} position={[0, -0.34, 0]}>
          <mesh position={[0, -0.16, 0]} castShadow><boxGeometry args={[0.16, 0.32, 0.2]} /><meshLambertMaterial color={PANTS} /></mesh>
          <mesh position={[0, -0.34, 0.06]}><boxGeometry args={[0.17, 0.13, 0.34]} /><meshLambertMaterial color={SHOE} /></mesh>
        </group>
      </group>
    </group>
  );
}
