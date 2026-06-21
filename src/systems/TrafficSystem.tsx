"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedMesh, Object3D, Color, MathUtils } from "three";
import { useGame, MAX_NPCS, npcPositions } from "@/core/store";
import { BLOCK, ROAD_LINES, lanePoint, inPark, PARK_RADIUS, MAP } from "@/world/grid";
import { traffic, GREEN_TIME, YELLOW_TIME } from "./trafficState";
import { avatar } from "@/player/avatarState";

const MAX = 38;
const DESPAWN = 170;
const STOP_DIST = 9;

// All non-black, vivid colors. cab = roof/cabin color.
const KINDS = [
  { body: "#e83838", cab: "#e83838", w: 0.62, h: 0.56, l: 1.75, speed: 9,  wheelR: 0.28 }, // moto red
  { body: "#f4f4f4", cab: "#f4f4f4", w: 0.62, h: 0.56, l: 1.75, speed: 10, wheelR: 0.28 }, // moto white
  { body: "#2840c8", cab: "#2840c8", w: 0.62, h: 0.56, l: 1.75, speed: 9,  wheelR: 0.28 }, // moto blue
  { body: "#dadada", cab: "#dadada", w: 1.80, h: 0.72, l: 4.40, speed: 11, wheelR: 0.36 }, // car silver
  { body: "#d02828", cab: "#d02828", w: 1.78, h: 0.70, l: 4.30, speed: 11, wheelR: 0.36 }, // car red
  { body: "#3858a0", cab: "#3858a0", w: 1.82, h: 0.76, l: 4.70, speed: 10, wheelR: 0.36 }, // innova blue
  { body: "#48a0d8", cab: "#48a0d8", w: 1.88, h: 0.68, l: 4.60, speed: 10, wheelR: 0.36 }, // pickup cyan
  { body: "#e02020", cab: "#ffffff", w: 2.40, h: 2.40, l: 10.0, speed: 8,  wheelR: 0.50 }, // TransJakarta
];
const MOTO_KINDS = 3;
const WHEEL_COUNT = MAX * 4;

interface Veh {
  axis: "x" | "z";
  line: number;
  along: number;
  dir: 1 | -1;
  speed: number;
  cur: number;
  kind: number;
}

const bodyDummy = new Object3D();
const cabDummy  = new Object3D();
const winDummy  = new Object3D();
const whlDummy  = new Object3D();
const rTorso    = new Object3D();
const rHead     = new Object3D();
const bodyCol   = new Color();
const cabCol    = new Color();
const winCol    = new Color("#bfe6f4");
const whlCol    = new Color("#2b2b2b");
const rTorsoCol = new Color("#2a2e3a");
const rHeadCol  = new Color("#e6e6ee");
const HELMET_COLORS = ["#e6e6ee", "#d83030", "#2a64c0", "#222"];

function spawnVeh(v: Veh, px: number, pz: number) {
  v.kind = (Math.random() * KINDS.length) | 0;
  v.speed = KINDS[v.kind].speed * (0.85 + Math.random() * 0.3);
  v.cur = v.speed;
  v.dir = Math.random() < 0.5 ? 1 : -1;
  v.axis = Math.random() < 0.5 ? "z" : "x";

  const center = v.axis === "z" ? px : pz;        // road line varies on the cross axis
  const cands = ROAD_LINES.filter((c) => Math.abs(c - center) < 130 && Math.abs(c) >= PARK_RADIUS);
  v.line = cands.length ? cands[(Math.random() * cands.length) | 0] : (center >= 0 ? 96 : -96);

  // A line that runs through the park (|line| < PARK_RADIUS, i.e. the centre line)
  // must keep its cars OUTSIDE the park and driving AWAY from it.
  if (Math.abs(v.line) < PARK_RADIUS) {
    const s = Math.random() < 0.5 ? 1 : -1;
    v.along = s * (PARK_RADIUS + 30 + Math.random() * 150);
    v.dir = (v.along > 0 ? 1 : -1);
  } else {
    const alongCenter = v.axis === "z" ? pz : px;
    v.along = alongCenter + (Math.random() - 0.5) * 220;
  }
}

export default function TrafficSystem() {
  const bodyRef = useRef<InstancedMesh>(null!);
  const cabRef  = useRef<InstancedMesh>(null!);
  const whlRef  = useRef<InstancedMesh>(null!);
  const winRef  = useRef<InstancedMesh>(null!);
  const rTorsoRef = useRef<InstancedMesh>(null!);
  const rHeadRef  = useRef<InstancedMesh>(null!);
  const hitCd   = useRef(0);

  const vehicles = useMemo<Veh[]>(() => {
    const [px, , pz] = useGame.getState().runtime.pos;
    return Array.from({ length: MAX }, () => {
      const v: Veh = { axis: "z", line: 0, along: 0, dir: 1, speed: 9, cur: 9, kind: 3 };
      spawnVeh(v, px, pz);
      return v;
    });
  }, []);

  useFrame((_, delta) => {
    const st = useGame.getState();
    if (st.paused) return;
    const [px, , pz] = st.runtime.pos;
    const HIDE = -3000;
    hitCd.current -= delta;

    // Shared traffic-signal phase (full green + yellow window).
    traffic.timer -= delta;
    if (traffic.timer <= 0) { traffic.phase = traffic.phase === 0 ? 1 : 0; traffic.timer = GREEN_TIME + YELLOW_TIME; }
    const phase = traffic;

    for (let i = 0; i < MAX; i++) {
      const v = vehicles[i];
      const onZ = v.axis === "z";
      const hasGreen = (phase.phase === 0) === onZ;

      // brake for red at next intersection (intersections at multiples of BLOCK)
      let targetSpeed = v.speed;
      if (!hasGreen) {
        const nextInter = (v.dir > 0 ? Math.ceil(v.along / BLOCK) : Math.floor(v.along / BLOCK)) * BLOCK;
        const distAhead = (nextInter - v.along) * v.dir;
        if (distAhead > 0 && distAhead < STOP_DIST) targetSpeed = 0;
      }
      
      // brake for pedestrians (NPCs) ahead
      if (targetSpeed > 0) {
        const lp = lanePoint(v.axis, v.line, v.dir, v.along);
        for (let j = 0; j < MAX_NPCS; j++) {
          const nx = npcPositions[j * 2];
          const nz = npcPositions[j * 2 + 1];
          if (nx > 90000) continue;
          
          // is NPC near the vehicle?
          const dx = nx - lp.x;
          const dz = nz - lp.z;
          const distSq = dx * dx + dz * dz;
          
          if (distSq < 36) { // within 6 meters radius
            // check if they are in front
            const fwdX = Math.sin(lp.rotY);
            const fwdZ = Math.cos(lp.rotY);
            const dot = dx * fwdX + dz * fwdZ;
            
            if (dot > 0 && dot < 8 && distSq - dot*dot < 6) { // in front up to 8m, lateral < 2.4m
              targetSpeed = 0;
              break;
            }
          }
        }
      }

      v.cur = MathUtils.lerp(v.cur, targetSpeed, 1 - Math.exp(-6 * delta));
      v.along += v.cur * v.dir * delta;

      const lp = lanePoint(v.axis, v.line, v.dir, v.along);
      const x = lp.x, z = lp.z, rotY = lp.rotY;

      // recycle if far, off-map, or anywhere inside the park (no oscillating).
      const tooFar = Math.hypot(x - px, z - pz) > DESPAWN;
      const offMap = Math.abs(v.along) > MAP - 6;
      const intoPark = Math.hypot(x, z) < PARK_RADIUS + 6;
      if (tooFar || offMap || intoPark) {
        {
          spawnVeh(v, px, pz);
          bodyDummy.position.set(0, HIDE, 0); bodyDummy.scale.setScalar(0.001); bodyDummy.updateMatrix();
          bodyRef.current.setMatrixAt(i, bodyDummy.matrix);
          cabRef.current.setMatrixAt(i, bodyDummy.matrix);
          winRef.current.setMatrixAt(i, bodyDummy.matrix);
          rTorsoRef.current.setMatrixAt(i, bodyDummy.matrix);
          rHeadRef.current.setMatrixAt(i, bodyDummy.matrix);
          for (let w = 0; w < 4; w++) { whlRef.current.setMatrixAt(i * 4 + w, bodyDummy.matrix); }
          bodyRef.current.setColorAt(i, bodyCol.set(KINDS[v.kind].body));
          cabRef.current.setColorAt(i, cabCol.set(KINDS[v.kind].cab));
          winRef.current.setColorAt(i, winCol);
          for (let w = 0; w < 4; w++) whlRef.current.setColorAt(i * 4 + w, whlCol);
          continue;
        }
      }

      // Run over the player on foot → damage + knockback + red flash.
      if (!st.runtime.inVehicleId && hitCd.current <= 0 && v.cur > 3) {
        const ddx = px - x, ddz = pz - z;
        if (ddx * ddx + ddz * ddz < 3.2) {
          st.damage(Math.min(45, 12 + v.cur * 2.2));
          const now2 = performance.now();
          avatar.hurtAt = now2;
          avatar.knockX = Math.sin(rotY) * 10;
          avatar.knockZ = Math.cos(rotY) * 10;
          avatar.knockAt = now2;
          avatar.knockdownAt = now2; // ragdoll fall + get up
          avatar.sitting = false;
          hitCd.current = 1.6;
          st.notify("Tertabrak kendaraan! 🚗💥");
        }
      }

      const k = KINDS[v.kind];
      const isMoto = v.kind < MOTO_KINDS;
      const bodyY = k.h / 2 + k.wheelR * 0.4;     // body bottom just above the wheels (no float)
      const cabY  = bodyY + (isMoto ? 0 : k.h * 0.5) + k.h * 0.38;

      bodyDummy.position.set(x, bodyY, z);
      bodyDummy.rotation.set(0, rotY, 0);
      bodyDummy.scale.set(k.w, k.h, k.l);
      bodyDummy.updateMatrix();
      bodyRef.current.setMatrixAt(i, bodyDummy.matrix);
      bodyRef.current.setColorAt(i, bodyCol.set(k.body));

      if (!isMoto) {
        const bus = k.l > 8;
        cabDummy.position.set(x, cabY, z);
        cabDummy.rotation.set(0, rotY, 0);
        cabDummy.scale.set(k.w * 0.9, k.h * (bus ? 0.95 : 0.72), k.l * (bus ? 0.96 : 0.52));
        cabDummy.updateMatrix();
        // glass band slightly proud of the cabin → reads as windscreen + windows
        winDummy.position.set(x, cabY + 0.02, z);
        winDummy.rotation.set(0, rotY, 0);
        winDummy.scale.set(k.w * 0.92, k.h * (bus ? 0.6 : 0.42), k.l * (bus ? 0.9 : 0.5));
        winDummy.updateMatrix();
      } else {
        // motorcycle: front fairing (cab slot) + windscreen (win slot) → real scooter shape
        const fwdX = Math.sin(rotY), fwdZ = Math.cos(rotY);
        const fx = fwdX * k.l * 0.34, fz = fwdZ * k.l * 0.34;
        cabDummy.position.set(x + fx, bodyY + 0.34, z + fz);
        cabDummy.rotation.set(0, rotY, 0);
        cabDummy.scale.set(k.w * 0.92, k.h * 1.25, k.l * 0.26);
        cabDummy.updateMatrix();
        winDummy.position.set(x + fx, bodyY + 0.78, z + fz);
        winDummy.rotation.set(0, rotY, 0);
        winDummy.scale.set(k.w * 0.8, k.h * 0.7, 0.05);
        winDummy.updateMatrix();
      }
      cabRef.current.setMatrixAt(i, cabDummy.matrix);
      cabRef.current.setColorAt(i, cabCol.set(k.cab));
      winRef.current.setMatrixAt(i, winDummy.matrix);
      winRef.current.setColorAt(i, winCol);

      // wheels
      const wheelR = k.wheelR, halfW = k.w / 2;
      const axleOff = isMoto ? k.l * 0.42 : k.l / 2 - 0.72;
      const wRot: [number, number, number] = onZ ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0];
      const wpos: [number, number, number][] = onZ
        ? [[x - halfW, wheelR, z + axleOff], [x + halfW, wheelR, z + axleOff], [x - halfW, wheelR, z - axleOff], [x + halfW, wheelR, z - axleOff]]
        : [[x + axleOff, wheelR, z - halfW], [x + axleOff, wheelR, z + halfW], [x - axleOff, wheelR, z - halfW], [x - axleOff, wheelR, z + halfW]];
      for (let w = 0; w < 4; w++) {
        whlDummy.position.set(...wpos[w]);
        whlDummy.rotation.set(...wRot);
        whlDummy.scale.set(wheelR, isMoto && w >= 2 ? 0.0001 : wheelR, wheelR); // motos: only 2 wheels
        if (isMoto && w >= 2) { whlDummy.position.set(0, HIDE, 0); }
        whlDummy.updateMatrix();
        whlRef.current.setMatrixAt(i * 4 + w, whlDummy.matrix);
        whlRef.current.setColorAt(i * 4 + w, whlCol);
      }

      // Motorcycle rider — leaning torso + helmet (so motos aren't ghost-driven)
      if (isMoto) {
        const fwdX = Math.sin(rotY), fwdZ = Math.cos(rotY);
        rTorso.position.set(x - fwdX * 0.08, bodyY + 0.5, z - fwdZ * 0.08);
        rTorso.rotation.set(0.28, rotY, 0);
        rTorso.scale.set(0.36, 0.62, 0.32);
        rTorso.updateMatrix();
        rTorsoRef.current.setMatrixAt(i, rTorso.matrix);
        rTorsoRef.current.setColorAt(i, rTorsoCol);
        rHead.position.set(x - fwdX * 0.02, bodyY + 1.0, z - fwdZ * 0.02);
        rHead.rotation.set(0, rotY, 0);
        rHead.scale.setScalar(0.22);
        rHead.updateMatrix();
        rHeadRef.current.setMatrixAt(i, rHead.matrix);
        rHeadRef.current.setColorAt(i, rHeadCol.set(HELMET_COLORS[v.kind % HELMET_COLORS.length]));
      } else {
        rTorso.position.set(0, HIDE, 0); rTorso.scale.setScalar(0.001); rTorso.updateMatrix();
        rTorsoRef.current.setMatrixAt(i, rTorso.matrix);
        rHead.position.set(0, HIDE, 0); rHead.scale.setScalar(0.001); rHead.updateMatrix();
        rHeadRef.current.setMatrixAt(i, rHead.matrix);
      }
    }

    [bodyRef, cabRef, winRef, rTorsoRef, rHeadRef].forEach((r) => {
      r.current.instanceMatrix.needsUpdate = true;
      if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true;
    });
    whlRef.current.instanceMatrix.needsUpdate = true;
    if (whlRef.current.instanceColor) whlRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, MAX]} castShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="white" />
      </instancedMesh>
      <instancedMesh ref={cabRef} args={[undefined, undefined, MAX]} castShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="white" />
      </instancedMesh>
      <instancedMesh ref={winRef} args={[undefined, undefined, MAX]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="white" transparent opacity={0.85} />
      </instancedMesh>
      <instancedMesh ref={whlRef} args={[undefined, undefined, WHEEL_COUNT]} castShadow frustumCulled={false}>
        <cylinderGeometry args={[1, 1, 0.2, 12]} /><meshLambertMaterial color="white" />
      </instancedMesh>
      <instancedMesh ref={rTorsoRef} args={[undefined, undefined, MAX]} castShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="white" />
      </instancedMesh>
      <instancedMesh ref={rHeadRef} args={[undefined, undefined, MAX]} castShadow frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} /><meshLambertMaterial color="white" />
      </instancedMesh>
    </>
  );
}
