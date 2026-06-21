"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, Mesh, Vector3, MeshBasicMaterial, MathUtils } from "three";
import { useGame } from "@/core/store";
import { input } from "@/core/input";
import { enemies, type EnemyEntry } from "./registries";
import { avatar } from "@/player/avatarState";
import { combat, COMBO_MOVES } from "./combatState";
import { hitNpcNear } from "./npcState";

/**
 * Arkham-lite melee. Enemies (preman) aggro, close in and strike on a cooldown;
 * the player punches/kicks in a frontal arc, blocks to halve damage, and dodges
 * for i-frames. Damage resolution is distance + facing based (no per-limb
 * colliders) — cheap, deterministic, mobile-friendly.
 */

const PUNCH_DMG = 12;
const KICK_DMG = 20;
const PLAYER_REACH = 2.6;
const ATTACK_ARC = Math.cos(Math.PI / 3); // 60° half-cone
const ENEMY_REACH = 2.2;
const AGGRO = 22;
const ENEMY_HIT = 8;
const ENEMY_COOLDOWN = 1.4;

interface PremanSpawn {
  uid: string;
  pos: [number, number, number];
}

// Gang placements (data-driven world content; tied to the "preman" side quest).
// On sidewalks (grid-aligned) so they loiter on the street, not in traffic.
const GANG: PremanSpawn[] = [
  { uid: "preman_1", pos: [-41, 0, -120] },
  { uid: "preman_2", pos: [-41, 0, -126] },
  { uid: "preman_3", pos: [-35, 0, -123] },
  { uid: "preman_4", pos: [55, 0, 60] },
  { uid: "preman_5", pos: [55, 0, 66] },
];

const pv = new Vector3();
const ev = new Vector3();
const fwd = new Vector3();

function Preman({ uid, spawn }: { uid: string; spawn: PremanSpawn }) {
  const group = useRef<Group>(null!);
  const bar = useRef<Group>(null!);
  const blood = useRef<Group>(null!);
  const cooldown = useRef(0);
  const lastStrike = useRef(-999);
  const pPhase = useRef(0);
  const pArmL = useRef<Group>(null!);
  const pArmR = useRef<Group>(null!);
  const pLegL = useRef<Group>(null!);
  const pLegR = useRef<Group>(null!);
  const { camera } = useThree();

  const entry = useMemo<EnemyEntry>(
    () => ({ uid, hp: 40, maxHp: 40, pos: [...spawn.pos], dead: false }),
    [uid, spawn]
  );

  useEffect(() => {
    enemies.set(uid, entry);
    return () => void enemies.delete(uid);
  }, [uid, entry]);

  useFrame((_, delta) => {
    const st = useGame.getState();
    if (st.paused) return;
    const g = group.current;
    if (!g) return;

    const now = performance.now();

    // Death: fall backward, then disappear.
    if (entry.dead) {
      const dt = (now - (entry.diedAt ?? now)) / 1000;
      if (dt > 2.4) { g.visible = false; if (bar.current) bar.current.visible = false; return; }
      g.visible = true;
      if (bar.current) bar.current.visible = false;
      const k = Math.min(1, dt / 0.55);
      g.rotation.x = (-Math.PI / 2) * k; // topple over
      g.position.set(entry.pos[0], 0.05, entry.pos[2]);
      return;
    }
    g.visible = true;
    g.rotation.x = 0;

    const [px, , pz] = st.runtime.pos;
    pv.set(px, 0, pz);
    ev.set(entry.pos[0], 0, entry.pos[2]);
    const dist = pv.distanceTo(ev);

    // Approach when aggro'd; stop at strike range.
    if (dist < AGGRO && dist > ENEMY_REACH) {
      fwd.subVectors(pv, ev).normalize();
      const speed = 2.4 * delta;
      entry.pos[0] += fwd.x * speed;
      entry.pos[2] += fwd.z * speed;
      g.rotation.y = Math.atan2(fwd.x, fwd.z);
    }

    // Strike.
    cooldown.current -= delta;
    if (dist <= ENEMY_REACH && cooldown.current <= 0) {
      cooldown.current = ENEMY_COOLDOWN;
      lastStrike.current = now; // trigger the lunge animation
      const invuln = performance.now() < input.iframeUntil;
      if (!invuln) {
        useGame.getState().damage(input.block ? ENEMY_HIT * 0.35 : ENEMY_HIT);
        avatar.hurtAt = performance.now();
      }
    }

    // Hit flinch: shove back from the player + quick squash.
    let fx = 0, fz = 0, sc = 1;
    if (entry.hitAt && now - entry.hitAt < 170) {
      const k = 1 - (now - entry.hitAt) / 170;
      const away = ev.clone().sub(pv);
      const len = away.length() || 1;
      fx = (away.x / len) * 0.35 * k;
      fz = (away.z / len) * 0.35 * k;
      sc = 1 + 0.12 * k;
    }

    // Attack lunge: thrust toward the player when striking.
    const sdt = now - lastStrike.current;
    if (sdt < 260) {
      const lng = Math.sin((sdt / 260) * Math.PI) * 0.6;
      const dx = px - entry.pos[0], dz = pz - entry.pos[2];
      const L = Math.hypot(dx, dz) || 1;
      fx += (dx / L) * lng; fz += (dz / L) * lng;
    }
    g.position.set(entry.pos[0] + fx, 0, entry.pos[2] + fz);
    g.scale.setScalar(sc);

    // ── Preman rig: walk swing while approaching + jab on strike ──
    const approaching = dist < AGGRO && dist > ENEMY_REACH;
    if (approaching) pPhase.current += delta * 9;
    const sw = approaching ? Math.sin(pPhase.current) * 0.6 : 0;
    const lsm = 1 - Math.exp(-12 * delta);
    if (pLegL.current) {
      pLegL.current.rotation.x = MathUtils.lerp(pLegL.current.rotation.x, sw, lsm);
      pLegR.current.rotation.x = MathUtils.lerp(pLegR.current.rotation.x, -sw, lsm);
      pArmL.current.rotation.x = MathUtils.lerp(pArmL.current.rotation.x, -sw * 0.8, lsm);
      let armRTarget = sw * 0.8;
      const sdt = now - lastStrike.current;
      if (sdt < 260) armRTarget = -1.9 * Math.sin((sdt / 260) * Math.PI); // jab forward
      pArmR.current.rotation.x = MathUtils.lerp(pArmR.current.rotation.x, armRTarget, lsm);
    }

    // HP bar faces camera + blood effect
    if (bar.current) {
      bar.current.lookAt(camera.position);
      const fg = bar.current.children[1] as Mesh;
      const ratio = Math.max(0, entry.hp / entry.maxHp);
      fg.scale.x = ratio;
      fg.position.x = -(1 - ratio) * 0.5;
    }
    if (blood.current) {
      if (entry.hitAt && now - entry.hitAt < 200) {
        blood.current.visible = true;
        const bk = (now - entry.hitAt) / 200;
        blood.current.scale.setScalar(1 + bk * 2);
        blood.current.position.y = 1 + bk;
        ((blood.current.children[0] as Mesh).material as MeshBasicMaterial).opacity = 1 - bk;
        ((blood.current.children[1] as Mesh).material as MeshBasicMaterial).opacity = 1 - bk;
      } else {
        blood.current.visible = false;
      }
    }
  });

  return (
    <group ref={group} position={spawn.pos}>
      {/* Rigged preman (burly thug) — limbs animate in useFrame */}
      <group>
        {/* head + hair */}
        <mesh position={[0, 1.58, 0]} castShadow><boxGeometry args={[0.4, 0.4, 0.38]} /><meshLambertMaterial color="#b07848" /></mesh>
        <mesh position={[0, 1.8, 0]}><boxGeometry args={[0.43, 0.14, 0.4]} /><meshLambertMaterial color="#241008" /></mesh>
        {/* angry brow */}
        <mesh position={[0, 1.66, 0.2]}><boxGeometry args={[0.34, 0.05, 0.04]} /><meshLambertMaterial color="#1a0c04" /></mesh>
        {/* torso (singlet) */}
        <mesh position={[0, 1.12, 0]} castShadow><boxGeometry args={[0.54, 0.66, 0.34]} /><meshLambertMaterial color="#5a2733" /></mesh>
        {/* arm pivots (bare, muscular) */}
        <group ref={pArmL} position={[-0.35, 1.36, 0]}>
          <mesh position={[0, -0.27, 0]} castShadow><boxGeometry args={[0.16, 0.52, 0.18]} /><meshLambertMaterial color="#b07848" /></mesh>
        </group>
        <group ref={pArmR} position={[0.35, 1.36, 0]}>
          <mesh position={[0, -0.27, 0]} castShadow><boxGeometry args={[0.16, 0.52, 0.18]} /><meshLambertMaterial color="#b07848" /></mesh>
        </group>
        {/* leg pivots */}
        <group ref={pLegL} position={[-0.14, 0.76, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow><boxGeometry args={[0.2, 0.6, 0.24]} /><meshLambertMaterial color="#2c2c38" /></mesh>
          <mesh position={[0, -0.62, 0.06]}><boxGeometry args={[0.19, 0.13, 0.32]} /><meshLambertMaterial color="#1a1410" /></mesh>
        </group>
        <group ref={pLegR} position={[0.14, 0.76, 0]}>
          <mesh position={[0, -0.3, 0]} castShadow><boxGeometry args={[0.2, 0.6, 0.24]} /><meshLambertMaterial color="#2c2c38" /></mesh>
          <mesh position={[0, -0.62, 0.06]}><boxGeometry args={[0.19, 0.13, 0.32]} /><meshLambertMaterial color="#1a1410" /></mesh>
        </group>
      </group>

      {/* Blood burst effect */}
      <group ref={blood} visible={false}>
        <mesh position={[0.2, 0, 0.1]} rotation={[0.2, 0.4, 0]}>
          <planeGeometry args={[0.3, 0.3]} />
          <meshBasicMaterial color="#d32f2f" transparent opacity={0.8} />
        </mesh>
        <mesh position={[-0.2, 0.1, 0.1]} rotation={[-0.1, -0.3, 0.2]}>
          <planeGeometry args={[0.25, 0.25]} />
          <meshBasicMaterial color="#b71c1c" transparent opacity={0.8} />
        </mesh>
      </group>

      <group ref={bar} position={[0, 1.6, 0]}>
        <mesh>
          <planeGeometry args={[1, 0.12]} />
          <meshBasicMaterial color="#400" />
        </mesh>
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[1, 0.12]} />
          <meshBasicMaterial color="#e53935" />
        </mesh>
      </group>
    </group>
  );
}

export default function CombatSystem() {
  const [gang] = useState(GANG);
  const setCombat = useGame((s) => s.setCombat);
  const report = useGame((s) => s.reportEvent);
  const addExp = useGame((s) => s.addExp);
  const notify = useGame((s) => s.notify);
  const combo = useRef({ count: 0, until: 0 });
  const pressSeq = useRef(0); // increments on every attack press → cycles the move
  const { camera } = useThree();

  useFrame(() => {
    const st = useGame.getState();
    if (st.paused) return;

    // Resolve player melee.
    const punch = input.consume("punch");
    const kick = input.consume("kick");
    if (punch || kick) {
      const now = performance.now();
      pressSeq.current++;
      // pick the move: kick = Tendang(5); punch cycles jab/cross/hook/uppercut(1..4)
      // cycling on EVERY press (not just hits) so the animation always varies.
      const moveIdx = kick ? 5 : ((pressSeq.current - 1) % 4) + 1;
      if (kick) avatar.kickAt = now; else avatar.punchAt = now;
      avatar.comboCount = moveIdx;
      const dmg = (kick ? KICK_DMG : PUNCH_DMG) * (moveIdx === 4 ? 1.4 : moveIdx === 5 ? 1.3 : 1);

      // aim a melee cone along where the camera looks
      const rayDir = fwd;
      camera.getWorldDirection(rayDir);
      rayDir.y = 0; rayDir.normalize();
      const [px0, , pz0] = st.runtime.pos;

      // 1) try preman (registry)
      let best: EnemyEntry | null = null;
      let bestScore = -Infinity;
      enemies.forEach((e) => {
        if (e.dead) return;
        ev.set(e.pos[0] - px0, 0, e.pos[2] - pz0);
        const d = ev.length();
        if (d > PLAYER_REACH || d < 0.01) return;
        ev.normalize();
        const dot = ev.x * rayDir.x + ev.z * rayDir.z;
        if (dot < 0.4) return;
        const score = dot - d / PLAYER_REACH;
        if (score > bestScore) { bestScore = score; best = e; }
      });

      let landed = false;
      if (best) {
        combo.current.count = now < combo.current.until ? combo.current.count + 1 : 1;
        combo.current.until = now + 1400;
        const target = best as EnemyEntry;
        const mult = 1 + Math.min(combo.current.count - 1, 6) * 0.12;
        target.hp -= dmg * mult;
        target.hitAt = now;
        landed = true;
        if (target.hp <= 0 && !target.dead) {
          target.dead = true; target.diedAt = now;
          addExp(40);
          report("defeat", { target: "preman" });
        }
      } else {
        // 2) try an ordinary pedestrian → they flee and can die
        const res = hitNpcNear(px0, pz0, rayDir.x, rayDir.z, PLAYER_REACH, dmg);
        if (res.idx >= 0) {
          combo.current.count = now < combo.current.until ? combo.current.count + 1 : 1;
          combo.current.until = now + 1400;
          landed = true;
          if (res.killed) { addExp(15); notify("Warga tewas 💀"); }
        }
      }

      if (landed) {
        st.triggerHitMarker();
        combat.comboCount = combo.current.count;
        combat.comboAt = now;
        combat.lastMove = COMBO_MOVES[moveIdx - 1];
      }
    }

    // Combat HUD state.
    const [px, , pz] = st.runtime.pos;
    let near = 0;
    enemies.forEach((e) => {
      if (e.dead) return;
      if (Math.hypot(e.pos[0] - px, e.pos[2] - pz) < AGGRO) near++;
    });
    if (near !== st.enemiesAlive || (near > 0) !== st.inCombat) setCombat(near > 0, near);
  });

  return (
    <>
      {gang.map((s) => (
        <Preman key={s.uid} uid={s.uid} spawn={s} />
      ))}
    </>
  );
}
