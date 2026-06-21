"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedMesh, Object3D, Vector3, Quaternion } from "three";
import { useGame } from "@/core/store";
import { input } from "@/core/input";
import { enemies, type EnemyEntry } from "./registries";
import { avatar } from "@/player/avatarState";
import { hitNpcNear } from "./npcState";

/**
 * Pistol shooting. Fire (F / mobile button) chambers a round, plays the recoil +
 * muzzle flash (via avatar.fireAt → PlayerModel), auto-aims at the nearest enemy
 * in a forward cone, applies damage, and draws a bullet tracer. Enemies flash on
 * hit (entry.hitAt) and fall on death (entry.diedAt) — handled in CombatSystem.
 */

const RANGE = 44;
const CONE = Math.cos((38 * Math.PI) / 180); // forward aim cone half-angle
const DMG = 34;
const TRACER_MAX = 10;
const TRACER_MS = 70;

const fwd = new Vector3();
const muzzle = new Vector3();
const toE = new Vector3();
const hit = new Vector3();
const mid = new Vector3();
const up = new Vector3(0, 1, 0);
const dummy = new Object3D();
const quat = new Quaternion();

interface Tracer { from: Vector3; to: Vector3; until: number; }

export default function GunSystem() {
  const tracerRef = useRef<InstancedMesh>(null!);
  const tracers = useRef<Tracer[]>(Array.from({ length: TRACER_MAX }, () => ({ from: new Vector3(), to: new Vector3(), until: 0 })));
  const tIdx = useRef(0);

  useFrame(() => {
    const st = useGame.getState();
    if (st.paused) return;

    const armed = st.equipped === "pistol" && !st.runtime.inVehicleId;

    // Reload
    if (input.consume("reload")) {
      if (armed) st.reloadMag();
    }

    // Fire
    if (input.consume("fire")) {
      if (!armed) {
        st.setEquipped("pistol"); // auto-equip on first shot
      } else {
        if (st.ammo <= 0) st.reloadMag(); // seamless auto-reload when empty
        if (st.fireRound()) {
          const now = performance.now();
          avatar.fireAt = now;

          const [px, py, pz] = st.runtime.pos;
          const yaw = st.runtime.facing;
          fwd.set(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
          muzzle.set(px + fwd.x * 0.6, py + 1.4, pz + fwd.z * 0.6);

          // auto-aim: nearest preman in the forward cone within range
          let best: EnemyEntry | null = null;
          let bestScore = -Infinity;
          enemies.forEach((e) => {
            if (e.dead) return;
            toE.set(e.pos[0] - px, 0, e.pos[2] - pz);
            const d = toE.length();
            if (d > RANGE) return;
            toE.normalize();
            const dot = toE.x * fwd.x + toE.z * fwd.z;
            if (dot < CONE) return;
            const score = dot - d / RANGE;
            if (score > bestScore) { bestScore = score; best = e; }
          });

          if (best) {
            const e = best as EnemyEntry;
            hit.set(e.pos[0], 1.1, e.pos[2]);
            e.hp -= DMG;
            e.hitAt = now;
            st.triggerHitMarker();
            if (e.hp <= 0 && !e.dead) {
              e.dead = true; e.diedAt = now;
              st.addExp(45);
              st.reportEvent("defeat", { target: "preman" });
              st.notify("Preman tertembak! 🎯");
            }
          } else {
            // no preman — try to hit an ordinary pedestrian
            const res = hitNpcNear(px, pz, fwd.x, fwd.z, RANGE, DMG);
            if (res.idx >= 0) {
              st.triggerHitMarker();
              hit.set(px + fwd.x * 8, 1.1, pz + fwd.z * 8);
              if (res.killed) { st.addExp(15); st.notify("Warga tertembak 💀"); }
            } else hit.copy(muzzle).addScaledVector(fwd, RANGE);
          }

          const t = tracers.current[tIdx.current];
          tIdx.current = (tIdx.current + 1) % TRACER_MAX;
          t.from.copy(muzzle);
          t.to.copy(hit);
          t.until = now + TRACER_MS;
        }
      }
    }

    // Render tracers (thin stretched cylinders)
    const now = performance.now();
    const mesh = tracerRef.current;
    for (let i = 0; i < TRACER_MAX; i++) {
      const t = tracers.current[i];
      if (now < t.until) {
        const len = mid.copy(t.to).sub(t.from).length();
        dummy.position.copy(mid.copy(t.from).add(t.to).multiplyScalar(0.5));
        // orient +Y axis along (to-from)
        toE.copy(t.to).sub(t.from).normalize();
        quat.setFromUnitVectors(up, toE);
        dummy.quaternion.copy(quat);
        dummy.scale.set(1, Math.max(0.01, len), 1);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.position.set(0, -9999, 0); dummy.scale.setScalar(0.0001); dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={tracerRef} args={[undefined, undefined, TRACER_MAX]} frustumCulled={false}>
      <cylinderGeometry args={[0.04, 0.04, 1, 5]} />
      <meshBasicMaterial color="#ffe27a" />
    </instancedMesh>
  );
}
