"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, Mesh, Vector3 } from "three";
import { Asset } from "@/core/assetRegistry";
import { useGame } from "@/core/store";
import { input } from "@/core/input";
import { enemies, type EnemyEntry } from "./registries";
import { avatar } from "@/player/avatarState";

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
  const cooldown = useRef(0);
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

    if (entry.dead) {
      g.visible = false;
      return;
    }
    g.visible = true;

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
      const invuln = performance.now() < input.iframeUntil;
      if (!invuln) {
        useGame.getState().damage(input.block ? ENEMY_HIT * 0.35 : ENEMY_HIT);
        avatar.hurtAt = performance.now();
      }
    }

    g.position.set(entry.pos[0], 0, entry.pos[2]);

    // HP bar faces camera.
    if (bar.current) {
      bar.current.lookAt(camera.position);
      const fg = bar.current.children[1] as Mesh;
      const ratio = Math.max(0, entry.hp / entry.maxHp);
      fg.scale.x = ratio;
      fg.position.x = -(1 - ratio) * 0.5;
    }
  });

  return (
    <group ref={group} position={spawn.pos}>
      <Asset id="enemy_preman" />
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

  useFrame(() => {
    const st = useGame.getState();
    if (st.paused) return;

    // Resolve player melee.
    const punch = input.consume("punch");
    const kick = input.consume("kick");
    if (punch || kick) {
      // fire the strike animation immediately on input (even if it misses)
      if (kick) avatar.kickAt = performance.now();
      else avatar.punchAt = performance.now();
      const dmg = kick ? KICK_DMG : PUNCH_DMG;
      const [px, , pz] = st.runtime.pos;
      const yaw = st.runtime.facing;
      fwd.set(Math.sin(yaw), 0, Math.cos(yaw));

      let best: EnemyEntry | null = null;
      let bestDist = PLAYER_REACH;
      enemies.forEach((e) => {
        if (e.dead) return;
        ev.set(e.pos[0] - px, 0, e.pos[2] - pz);
        const d = ev.length();
        if (d > bestDist) return;
        ev.normalize();
        if (ev.dot(fwd) < ATTACK_ARC) return; // outside frontal arc
        best = e;
        bestDist = d;
      });

      const now = performance.now();
      if (best) {
        // combo within 1.2s window scales damage
        combo.current.count = now < combo.current.until ? combo.current.count + 1 : 1;
        combo.current.until = now + 1200;
        const target = best as EnemyEntry;
        const mult = 1 + Math.min(combo.current.count - 1, 4) * 0.15;
        target.hp -= dmg * mult;
        if (target.hp <= 0) {
          target.dead = true;
          addExp(40);
          report("defeat", { target: "preman" });
          notify(`Preman kalah! Combo x${combo.current.count}`);
        }
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
