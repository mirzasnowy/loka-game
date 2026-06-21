"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedMesh, Object3D, Color, MathUtils } from "three";
import { useGame, MAX_NPCS, npcPositions } from "@/core/store";
import { BLOCK, SIDEWALK_OFF, snapToSidewalk } from "@/world/grid";
import { npcHp, npcFleeUntil, npcHitAt, npcDead } from "./npcState";

const SPAWN_RING = 70;
const DESPAWN = 120;

// shirt / skin / pants — all vivid, none black
const ARCHETYPES = [
  { shirt: "#ffffff", skin: "#caa176", pants: "#22408a" }, // student
  { shirt: "#eaeaea", skin: "#e0b890", pants: "#384a64" }, // office
  { shirt: "#2faa48", skin: "#caa176", pants: "#2a2a38" }, // ojol (green)
  { shirt: "#6a90c8", skin: "#e0b890", pants: "#2c3a4e" }, // police (blue)
  { shirt: "#b09a82", skin: "#d8a870", pants: "#5a4a3a" }, // elderly
  { shirt: "#f08038", skin: "#caa176", pants: "#7a4a26" }, // vendor (orange)
];

type St = "walk" | "idle" | "cross";
interface Agent {
  axis: "x" | "z";
  line: number;
  side: 1 | -1;
  along: number;
  dir: 1 | -1;
  speed: number;
  state: St;
  timer: number;
  crossT: number;
  crossFrom: 1 | -1;
  rot: number;
  arche: number;
  turnedAt: number; // last intersection index handled (avoid re-trigger)
  phase: number;    // gait phase for walk bob
}

const dummy = new Object3D();
const cSkin = new Color();
const cShirt = new Color();
const cPants = new Color();

/** Continuous world position given a (possibly interpolated) side offset. */
function posOf(axis: "x" | "z", line: number, sideOffset: number, along: number): [number, number] {
  if (axis === "x") return [along, line + sideOffset];
  return [line + sideOffset, along];
}

function spawnNear(a: Agent, px: number, pz: number) {
  const ang = Math.random() * Math.PI * 2;
  const r = 20 + Math.random() * SPAWN_RING;
  const sp = snapToSidewalk(px + Math.cos(ang) * r, pz + Math.sin(ang) * r);
  a.axis = sp.axis; a.line = sp.line; a.side = sp.side; a.along = sp.along;
  a.dir = Math.random() < 0.5 ? 1 : -1;
  a.state = "walk";
  a.timer = 1 + Math.random() * 3;
  a.crossT = 0;
}

export default function NPCSystem() {
  const headRef = useRef<InstancedMesh>(null!);
  const bodyRef = useRef<InstancedMesh>(null!);
  const legsRef = useRef<InstancedMesh>(null!);
  const armLRef = useRef<InstancedMesh>(null!);
  const armRRef = useRef<InstancedMesh>(null!);

  const agents = useMemo<Agent[]>(() => {
    const [px, , pz] = useGame.getState().runtime.pos;
    return Array.from({ length: MAX_NPCS }, () => {
      const a: Agent = {
        axis: "x", line: 0, side: 1, along: 0, dir: 1,
        speed: 1.2 + Math.random() * 1.1, state: "walk", timer: Math.random() * 3,
        crossT: 0, crossFrom: 1, rot: 0, arche: (Math.random() * ARCHETYPES.length) | 0, turnedAt: 9999,
        phase: Math.random() * 6.28,
      };
      spawnNear(a, px, pz);
      return a;
    });
  }, []);

  // Init color buffers so nothing renders black on the first frame.
  useLayoutEffect(() => {
    agents.forEach((a, i) => {
      const { shirt, skin, pants } = ARCHETYPES[a.arche];
      headRef.current.setColorAt(i, cSkin.set(skin));
      bodyRef.current.setColorAt(i, cShirt.set(shirt));
      legsRef.current.setColorAt(i, cPants.set(pants));
      armLRef.current.setColorAt(i, cShirt.set(shirt));
      armRRef.current.setColorAt(i, cShirt.set(shirt));
    });
    [headRef, bodyRef, legsRef, armLRef, armRRef].forEach((r) => { if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true; });
  }, [agents]);

  useFrame((_, delta) => {
    const st = useGame.getState();
    if (st.paused) return;
    const [px, , pz] = st.runtime.pos;
    const density = st.timeOfDay === "night" ? 0.4 : st.timeOfDay === "afternoon" ? 1 : 0.85;
    const active = Math.floor(MAX_NPCS * density);
    const HIDE = -3000;

    for (let i = 0; i < MAX_NPCS; i++) {
      const a = agents[i];

      if (i >= active) {
        npcPositions[i * 2] = 99999;
        npcPositions[i * 2 + 1] = 99999;
        dummy.position.set(0, HIDE, 0); dummy.scale.setScalar(0.0001); dummy.updateMatrix();
        headRef.current.setMatrixAt(i, dummy.matrix);
        bodyRef.current.setMatrixAt(i, dummy.matrix);
        legsRef.current.setMatrixAt(i, dummy.matrix);
        armLRef.current.setMatrixAt(i, dummy.matrix);
        armRRef.current.setMatrixAt(i, dummy.matrix);
        continue;
      }

      // Dead → hide, then respawn fresh elsewhere after a short delay.
      if (npcDead[i]) {
        if (performance.now() - npcHitAt[i] > 1400) {
          spawnNear(a, px, pz); npcDead[i] = 0; npcHp[i] = 30; npcFleeUntil[i] = 0;
        } else {
          npcPositions[i * 2] = 99999; npcPositions[i * 2 + 1] = 99999;
          dummy.position.set(0, HIDE, 0); dummy.scale.setScalar(0.0001); dummy.updateMatrix();
          headRef.current.setMatrixAt(i, dummy.matrix);
          bodyRef.current.setMatrixAt(i, dummy.matrix);
          legsRef.current.setMatrixAt(i, dummy.matrix);
          armLRef.current.setMatrixAt(i, dummy.matrix);
          armRRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }
      }

      const fleeing = performance.now() < npcFleeUntil[i];
      if (fleeing) {
        // run directly away from the player along the current sidewalk axis
        a.state = "walk";
        const playerAlong = a.axis === "z" ? pz : px;
        a.dir = a.along >= playerAlong ? 1 : -1;
      }
      const spd = fleeing ? a.speed * 2.5 : a.speed;

      // current position
      let sideOffset = a.side * SIDEWALK_OFF;
      let [x, z] = posOf(a.axis, a.line, sideOffset, a.along);

      if (Math.hypot(x - px, z - pz) > DESPAWN) { spawnNear(a, px, pz); [x, z] = posOf(a.axis, a.line, a.side * SIDEWALK_OFF, a.along); }

      const prevX = x, prevZ = z;
      a.timer -= delta;

      if (a.state === "idle") {
        if (a.timer <= 0) { a.state = "walk"; a.timer = 3 + Math.random() * 5; }
      } else if (a.state === "cross") {
        a.crossT += delta / 1.3;
        const t = Math.min(1, a.crossT);
        sideOffset = MathUtils.lerp(a.crossFrom * SIDEWALK_OFF, -a.crossFrom * SIDEWALK_OFF, t);
        [x, z] = posOf(a.axis, a.line, sideOffset, a.along);
        if (t >= 1) { a.side = (-a.crossFrom) as 1 | -1; a.state = "walk"; a.timer = 2 + Math.random() * 4; }
      } else {
        // walk
        a.along += spd * a.dir * delta;
        [x, z] = posOf(a.axis, a.line, a.side * SIDEWALK_OFF, a.along);

        // at an intersection? (along near a multiple of BLOCK)
        const interIdx = Math.round(a.along / BLOCK);
        const nearInter = Math.abs(a.along - interIdx * BLOCK) < 1.5;
        if (nearInter && a.turnedAt !== interIdx) {
          a.turnedAt = interIdx;
          const roll = Math.random();
          if (roll < 0.25) {
            // turn onto the perpendicular road's sidewalk (stay on the corner)
            const newLine = interIdx * BLOCK;
            const fixedCoord = a.line + a.side * SIDEWALK_OFF;
            a.axis = a.axis === "x" ? "z" : "x";
            a.line = newLine;
            a.along = fixedCoord;
            a.side = (Math.random() < 0.5 ? 1 : -1);
            a.dir = (Math.random() < 0.5 ? 1 : -1);
            a.turnedAt = 9999;
          } else if (roll < 0.4) {
            // cross the street to the opposite sidewalk
            a.state = "cross"; a.crossT = 0; a.crossFrom = a.side;
          } else if (roll < 0.5) {
            a.state = "idle"; a.timer = 1.5 + Math.random() * 3;
          }
        }
        // occasional idle mid-block
        if (a.timer <= 0) {
          if (Math.random() < 0.3) { a.state = "idle"; a.timer = 1.5 + Math.random() * 3; }
          else a.timer = 3 + Math.random() * 4;
        }
      }

      // heading from movement
      const dx = x - prevX, dz = z - prevZ;
      const stepping = dx * dx + dz * dz > 1e-6;
      if (stepping) a.rot = MathUtils.lerp(a.rot, Math.atan2(dx, dz), 0.25);

      // walk bob + slight forward tilt while moving
      if (stepping) a.phase += delta * (5 + a.speed * 3.5);
      const bob = stepping ? Math.abs(Math.sin(a.phase)) * 0.06 : 0;
      const tilt = stepping ? 0.06 : 0;

      npcPositions[i * 2] = x;
      npcPositions[i * 2 + 1] = z;

      // render stacked boxes: head, torso, legs
      dummy.position.set(x, 1.58 + bob, z); dummy.rotation.set(tilt, a.rot, 0); dummy.scale.set(0.38, 0.38, 0.36); dummy.updateMatrix();
      headRef.current.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, 1.1 + bob, z); dummy.scale.set(0.44, 0.6, 0.28); dummy.updateMatrix();
      bodyRef.current.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x, 0.44 + bob * 0.5, z); dummy.scale.set(0.38, 0.52, 0.22); dummy.updateMatrix();
      legsRef.current.setMatrixAt(i, dummy.matrix);

      // arms with walk swing (offsets in the NPC's local frame, rotated by a.rot)
      const cs = Math.cos(a.rot), sn = Math.sin(a.rot);
      const swing = stepping ? Math.sin(a.phase) * 0.18 : 0;
      // left arm: localX -0.28, localZ +swing
      let lx = -0.28, lz = swing;
      dummy.position.set(x + lx * cs + lz * sn, 1.06 + bob, z - lx * sn + lz * cs);
      dummy.rotation.set(0, a.rot, 0); dummy.scale.set(0.13, 0.46, 0.15); dummy.updateMatrix();
      armLRef.current.setMatrixAt(i, dummy.matrix);
      // right arm: localX +0.28, localZ -swing
      lx = 0.28; lz = -swing;
      dummy.position.set(x + lx * cs + lz * sn, 1.06 + bob, z - lx * sn + lz * cs);
      dummy.rotation.set(0, a.rot, 0); dummy.scale.set(0.13, 0.46, 0.15); dummy.updateMatrix();
      armRRef.current.setMatrixAt(i, dummy.matrix);
    }

    [headRef, bodyRef, legsRef, armLRef, armRRef].forEach((r) => { r.current.instanceMatrix.needsUpdate = true; });
  });

  return (
    <>
      <instancedMesh ref={headRef} args={[undefined, undefined, MAX_NPCS]} castShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="white" />
      </instancedMesh>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, MAX_NPCS]} castShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="white" />
      </instancedMesh>
      <instancedMesh ref={legsRef} args={[undefined, undefined, MAX_NPCS]} castShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="white" />
      </instancedMesh>
      <instancedMesh ref={armLRef} args={[undefined, undefined, MAX_NPCS]} castShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="white" />
      </instancedMesh>
      <instancedMesh ref={armRRef} args={[undefined, undefined, MAX_NPCS]} castShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="white" />
      </instancedMesh>
    </>
  );
}
