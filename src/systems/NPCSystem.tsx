"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedMesh, Object3D, Color, MathUtils, BoxGeometry } from "three";
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
  turnedAt: number;
  phase: number;
}

const dummy = new Object3D();
dummy.rotation.order = "YXZ"; // yaw first, then limb swing about local X
const cSkin = new Color();
const cShirt = new Color();
const cPants = new Color();
const HIDE = -3000;

// Joint heights / local offsets (NPC ~1.75m)
const SHOULDER_Y = 1.34, HIP_Y = 0.74, SHOULDER_X = 0.28, HIP_X = 0.12;

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
  const armLRef = useRef<InstancedMesh>(null!);
  const armRRef = useRef<InstancedMesh>(null!);
  const legLRef = useRef<InstancedMesh>(null!);
  const legRRef = useRef<InstancedMesh>(null!);
  const fxRef   = useRef<InstancedMesh>(null!);

  // Pivot-translated limb geometries: origin sits at the joint so rotating the
  // instance swings the whole limb (real walk/run animation, fully instanced).
  const headGeo = useMemo(() => new BoxGeometry(0.38, 0.38, 0.36), []);
  const bodyGeo = useMemo(() => new BoxGeometry(0.46, 0.62, 0.28), []);
  const armGeo  = useMemo(() => new BoxGeometry(0.13, 0.48, 0.15).translate(0, -0.24, 0), []);
  const legGeo  = useMemo(() => new BoxGeometry(0.17, 0.54, 0.22).translate(0, -0.27, 0), []);
  const fxGeo   = useMemo(() => new BoxGeometry(1, 1, 1), []);

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

  useLayoutEffect(() => {
    agents.forEach((a, i) => {
      const { shirt, skin, pants } = ARCHETYPES[a.arche];
      headRef.current.setColorAt(i, cSkin.set(skin));
      bodyRef.current.setColorAt(i, cShirt.set(shirt));
      armLRef.current.setColorAt(i, cShirt.set(shirt));
      armRRef.current.setColorAt(i, cShirt.set(shirt));
      legLRef.current.setColorAt(i, cPants.set(pants));
      legRRef.current.setColorAt(i, cPants.set(pants));
    });
    [headRef, bodyRef, armLRef, armRRef, legLRef, legRRef].forEach((r) => { if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true; });
  }, [agents]);

  useFrame((_, delta) => {
    const st = useGame.getState();
    if (st.paused) return;
    const [px, , pz] = st.runtime.pos;
    const density = st.timeOfDay === "night" ? 0.4 : st.timeOfDay === "afternoon" ? 1 : 0.85;
    const active = Math.floor(MAX_NPCS * density);

    const hideAll = (i: number) => {
      dummy.position.set(0, HIDE, 0); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(0.0001); dummy.updateMatrix();
      headRef.current.setMatrixAt(i, dummy.matrix);
      bodyRef.current.setMatrixAt(i, dummy.matrix);
      armLRef.current.setMatrixAt(i, dummy.matrix);
      armRRef.current.setMatrixAt(i, dummy.matrix);
      legLRef.current.setMatrixAt(i, dummy.matrix);
      legRRef.current.setMatrixAt(i, dummy.matrix);
      fxRef.current.setMatrixAt(i, dummy.matrix);
    };

    for (let i = 0; i < MAX_NPCS; i++) {
      const a = agents[i];

      if (i >= active) { npcPositions[i * 2] = 99999; hideAll(i); continue; }

      // Dead → death puff, then respawn fresh.
      if (npcDead[i]) {
        const dt = performance.now() - npcHitAt[i];
        if (dt > 1400) { spawnNear(a, px, pz); npcDead[i] = 0; npcHp[i] = 30; npcFleeUntil[i] = 0; }
        else {
          const lx = npcPositions[i * 2], lz = npcPositions[i * 2 + 1];
          npcPositions[i * 2] = 99999;
          hideAll(i);
          if (dt < 400 && lx < 90000) {
            dummy.position.set(lx, 1.0, lz); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(0.4 + (dt / 400)); dummy.updateMatrix();
            fxRef.current.setMatrixAt(i, dummy.matrix);
          }
          continue;
        }
      }

      const fleeing = performance.now() < npcFleeUntil[i];
      if (fleeing) {
        a.state = "walk";
        const playerAlong = a.axis === "z" ? pz : px;
        a.dir = a.along >= playerAlong ? 1 : -1;
      }
      const spd = fleeing ? a.speed * 2.6 : a.speed;

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
        a.along += spd * a.dir * delta;
        [x, z] = posOf(a.axis, a.line, a.side * SIDEWALK_OFF, a.along);
        const interIdx = Math.round(a.along / BLOCK);
        const nearInter = Math.abs(a.along - interIdx * BLOCK) < 1.5;
        if (nearInter && a.turnedAt !== interIdx && !fleeing) {
          a.turnedAt = interIdx;
          const roll = Math.random();
          if (roll < 0.25) {
            const newLine = interIdx * BLOCK;
            const fixedCoord = a.line + a.side * SIDEWALK_OFF;
            a.axis = a.axis === "x" ? "z" : "x";
            a.line = newLine; a.along = fixedCoord;
            a.side = (Math.random() < 0.5 ? 1 : -1);
            a.dir = (Math.random() < 0.5 ? 1 : -1);
            a.turnedAt = 9999;
          } else if (roll < 0.4) { a.state = "cross"; a.crossT = 0; a.crossFrom = a.side; }
          else if (roll < 0.5) { a.state = "idle"; a.timer = 1.5 + Math.random() * 3; }
        }
        if (a.timer <= 0) {
          if (Math.random() < 0.3 && !fleeing) { a.state = "idle"; a.timer = 1.5 + Math.random() * 3; }
          else a.timer = 3 + Math.random() * 4;
        }
      }

      // heading + gait
      const dx = x - prevX, dz = z - prevZ;
      const moving = dx * dx + dz * dz > 1e-6;
      if (moving) a.rot = MathUtils.lerp(a.rot, Math.atan2(dx, dz), 0.25);
      const running = fleeing;
      if (moving) a.phase += delta * (running ? 13 : 7 + a.speed * 1.5);
      const amp = moving ? (running ? 0.95 : 0.55) : Math.sin(performance.now() * 0.0018 + i) * 0.04;
      const bob = moving ? Math.abs(Math.sin(a.phase)) * (running ? 0.09 : 0.06) : 0;
      const lean = moving ? (running ? 0.22 : 0.08) : 0;

      const cs = Math.cos(a.rot), sn = Math.sin(a.rot);
      const yaw = a.rot;
      const swing = Math.sin(a.phase) * amp;

      // Head
      dummy.position.set(x, 1.58 + bob, z); dummy.rotation.set(lean, yaw, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
      headRef.current.setMatrixAt(i, dummy.matrix);
      // Torso
      dummy.position.set(x, 1.12 + bob, z); dummy.rotation.set(lean, yaw, 0); dummy.updateMatrix();
      bodyRef.current.setMatrixAt(i, dummy.matrix);

      // Limbs swing about shoulders/hips (geometry is pivot-translated)
      // left arm forward when right leg forward (opposite swing)
      const sxL = -SHOULDER_X, sxR = SHOULDER_X, hxL = -HIP_X, hxR = HIP_X;
      // arms
      dummy.position.set(x + sxL * cs, SHOULDER_Y + bob, z - sxL * sn); dummy.rotation.set(-swing, yaw, 0); dummy.updateMatrix();
      armLRef.current.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x + sxR * cs, SHOULDER_Y + bob, z - sxR * sn); dummy.rotation.set(swing, yaw, 0); dummy.updateMatrix();
      armRRef.current.setMatrixAt(i, dummy.matrix);
      // legs
      dummy.position.set(x + hxL * cs, HIP_Y + bob * 0.5, z - hxL * sn); dummy.rotation.set(swing, yaw, 0); dummy.updateMatrix();
      legLRef.current.setMatrixAt(i, dummy.matrix);
      dummy.position.set(x + hxR * cs, HIP_Y + bob * 0.5, z - hxR * sn); dummy.rotation.set(-swing, yaw, 0); dummy.updateMatrix();
      legRRef.current.setMatrixAt(i, dummy.matrix);

      npcPositions[i * 2] = x;
      npcPositions[i * 2 + 1] = z;

      // hit spark
      const hitDt = performance.now() - npcHitAt[i];
      if (npcHitAt[i] > 0 && hitDt < 200) {
        dummy.position.set(x, 1.3, z); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(0.2 + (hitDt / 200) * 0.5); dummy.updateMatrix();
        fxRef.current.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.position.set(0, HIDE, 0); dummy.scale.setScalar(0.0001); dummy.updateMatrix();
        fxRef.current.setMatrixAt(i, dummy.matrix);
      }
    }

    [headRef, bodyRef, armLRef, armRRef, legLRef, legRRef, fxRef].forEach((r) => { r.current.instanceMatrix.needsUpdate = true; });
  });

  return (
    <>
      <instancedMesh ref={headRef} args={[headGeo, undefined, MAX_NPCS]} castShadow frustumCulled={false}>
        <meshLambertMaterial color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={bodyRef} args={[bodyGeo, undefined, MAX_NPCS]} castShadow frustumCulled={false}>
        <meshLambertMaterial color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={armLRef} args={[armGeo, undefined, MAX_NPCS]} castShadow frustumCulled={false}>
        <meshLambertMaterial color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={armRRef} args={[armGeo, undefined, MAX_NPCS]} castShadow frustumCulled={false}>
        <meshLambertMaterial color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={legLRef} args={[legGeo, undefined, MAX_NPCS]} castShadow frustumCulled={false}>
        <meshLambertMaterial color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={legRRef} args={[legGeo, undefined, MAX_NPCS]} castShadow frustumCulled={false}>
        <meshLambertMaterial color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={fxRef} args={[fxGeo, undefined, MAX_NPCS]} frustumCulled={false}>
        <meshBasicMaterial color="#ffcf3a" />
      </instancedMesh>
    </>
  );
}
