"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { InstancedMesh, Object3D, Vector3, Quaternion } from "three";
import { useGame, MAX_NPCS, npcPositions } from "@/core/store";
import { input } from "@/core/input";
import { enemies, type EnemyEntry } from "./registries";
import { avatar } from "@/player/avatarState";
import { npcDead, damageNpc } from "./npcState";
import { dropMoney } from "./effects";

/**
 * Pistol shooting — a PRECISE ray straight through the crosshair (camera forward).
 * You must actually aim at a target; a tight cylinder radius means stray shots
 * miss. Picks the closest thing the ray passes through (preman or pedestrian).
 */

const RANGE = 60;
const HIT_RADIUS = 0.55; // how close the ray must pass to a body to count
const DMG = 34;
const TRACER_MAX = 10;
const TRACER_MS = 70;

const dir = new Vector3();
const muzzle = new Vector3();
const hit = new Vector3();
const mid = new Vector3();
const up = new Vector3(0, 1, 0);
const dummy = new Object3D();
const quat = new Quaternion();

/** Distance along the ray to the closest approach to a point, or -1 if it misses. */
function rayHitT(cx: number, cy: number, cz: number, ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, radius: number, maxT: number): number {
  const t = (cx - ox) * dx + (cy - oy) * dy + (cz - oz) * dz;
  if (t < 0 || t > maxT) return -1;
  const px = ox + dx * t, py = oy + dy * t, pz = oz + dz * t;
  const d2 = (px - cx) ** 2 + (py - cy) ** 2 + (pz - cz) ** 2;
  return d2 <= radius * radius ? t : -1;
}

interface Tracer { from: Vector3; to: Vector3; until: number; }

export default function GunSystem() {
  const tracerRef = useRef<InstancedMesh>(null!);
  const tracers = useRef<Tracer[]>(Array.from({ length: TRACER_MAX }, () => ({ from: new Vector3(), to: new Vector3(), until: 0 })));
  const tIdx = useRef(0);
  const { camera } = useThree();

  useFrame(() => {
    const st = useGame.getState();
    if (st.paused) return;
    const armed = st.equipped === "pistol" && !st.runtime.inVehicleId;

    if (input.consume("reload")) { if (armed) st.reloadMag(); }

    if (input.consume("fire")) {
      if (!armed) { st.setEquipped("pistol"); }
      else {
        if (st.ammo <= 0) st.reloadMag();
        if (st.fireRound()) {
          const now = performance.now();
          avatar.fireAt = now;

          // ray from the camera straight through the crosshair
          camera.getWorldDirection(dir).normalize();
          const ox = camera.position.x, oy = camera.position.y, oz = camera.position.z;
          const [px, py, pz] = st.runtime.pos;
          muzzle.set(px + dir.x * 0.6, py + 1.4, pz + dir.z * 0.6);

          // find the closest body the ray actually passes through
          let bestT = RANGE;
          let bestEnemy: EnemyEntry | null = null;
          let bestNpc = -1;

          enemies.forEach((e) => {
            if (e.dead) return;
            const t = rayHitT(e.pos[0], 1.1, e.pos[2], ox, oy, oz, dir.x, dir.y, dir.z, HIT_RADIUS + 0.15, bestT);
            if (t >= 0) { bestT = t; bestEnemy = e; bestNpc = -1; }
          });
          for (let i = 0; i < MAX_NPCS; i++) {
            if (npcDead[i]) continue;
            const nx = npcPositions[i * 2], nz = npcPositions[i * 2 + 1];
            if (nx > 90000) continue;
            const t = rayHitT(nx, 1.1, nz, ox, oy, oz, dir.x, dir.y, dir.z, HIT_RADIUS, bestT);
            if (t >= 0) { bestT = t; bestNpc = i; bestEnemy = null; }
          }

          if (bestEnemy) {
            const e = bestEnemy as EnemyEntry;
            hit.set(e.pos[0], 1.1, e.pos[2]);
            e.hp -= DMG; e.hitAt = now;
            st.triggerHitMarker();
            if (e.hp <= 0 && !e.dead) {
              e.dead = true; e.diedAt = now; st.addExp(45); st.reportEvent("defeat", { target: "preman" });
              st.notify("Preman tertembak! 🎯"); st.addKill("preman");
              dropMoney(e.pos[0], e.pos[2], 6000 + ((Math.random() * 10000) | 0));
            }
          } else if (bestNpc >= 0) {
            hit.set(npcPositions[bestNpc * 2], 1.1, npcPositions[bestNpc * 2 + 1]);
            st.triggerHitMarker();
            if (damageNpc(bestNpc, DMG)) {
              st.addExp(15); st.notify("Warga tertembak 💀"); st.addKill("warga");
              dropMoney(npcPositions[bestNpc * 2], npcPositions[bestNpc * 2 + 1], 2000 + ((Math.random() * 6000) | 0));
            }
          } else {
            // clean miss — tracer flies to max range
            hit.set(ox + dir.x * RANGE, oy + dir.y * RANGE, oz + dir.z * RANGE);
          }

          const tr = tracers.current[tIdx.current];
          tIdx.current = (tIdx.current + 1) % TRACER_MAX;
          tr.from.copy(muzzle); tr.to.copy(hit); tr.until = now + TRACER_MS;
        }
      }
    }

    // render tracers
    const now = performance.now();
    const mesh = tracerRef.current;
    for (let i = 0; i < TRACER_MAX; i++) {
      const t = tracers.current[i];
      if (now < t.until) {
        const len = mid.copy(t.to).sub(t.from).length();
        dummy.position.copy(mid.copy(t.from).add(t.to).multiplyScalar(0.5));
        quat.setFromUnitVectors(up, mid.copy(t.to).sub(t.from).normalize());
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
