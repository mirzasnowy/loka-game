"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedMesh, Object3D, Color, MathUtils } from "three";
import { useGame, MAX_NPCS, npcPositions } from "@/core/store";
import { BLOCK, ROAD_LINES, lanePoint, inPark, PARK_RADIUS, MAP } from "@/world/grid";

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
const whlDummy  = new Object3D();
const bodyCol   = new Color();
const cabCol    = new Color();
const whlCol    = new Color("#2b2b2b");

function spawnVeh(v: Veh, px: number, pz: number) {
  v.kind = (Math.random() * KINDS.length) | 0;
  v.speed = KINDS[v.kind].speed * (0.85 + Math.random() * 0.3);
  v.cur = v.speed;
  v.dir = Math.random() < 0.5 ? 1 : -1;
  
  // Try up to 10 times to find a spawn point outside the park
  for (let tries = 0; tries < 10; tries++) {
    v.axis = Math.random() < 0.5 ? "z" : "x";
    const center = v.axis === "z" ? px : pz;
    const cands = ROAD_LINES.filter((c) => Math.abs(c - center) < 110);
    v.line = cands.length ? cands[(Math.random() * cands.length) | 0] : 0;
    const alongCenter = v.axis === "z" ? pz : px;
    v.along = alongCenter + (Math.random() - 0.5) * 220;
    
    const sx = v.axis === "z" ? v.along : v.line;
    const sz = v.axis === "z" ? v.line : v.along;
    if (Math.hypot(sx, sz) >= PARK_RADIUS + 4) break;
  }
}

export default function TrafficSystem() {
  const bodyRef = useRef<InstancedMesh>(null!);
  const cabRef  = useRef<InstancedMesh>(null!);
  const whlRef  = useRef<InstancedMesh>(null!);
  const phase   = useRef(0);
  const phaseTmr= useRef(8);

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

    phaseTmr.current -= delta;
    if (phaseTmr.current <= 0) { phase.current = phase.current === 0 ? 1 : 0; phaseTmr.current = 8; }

    for (let i = 0; i < MAX; i++) {
      const v = vehicles[i];
      const onZ = v.axis === "z";
      const hasGreen = (phase.current === 0) === onZ;

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

      // recycle if far, off-map, or about to enter the park
      const tooFar = Math.hypot(x - px, z - pz) > DESPAWN;
      const offMap = Math.abs(v.along) > MAP - 6;
      const intoPark = Math.hypot(x, z) < PARK_RADIUS + 4;
      if (tooFar || offMap || intoPark) {
        if (intoPark && !tooFar && !offMap) v.dir = (v.dir * -1) as 1 | -1; // turn around at park edge
        else { spawnVeh(v, px, pz);
          bodyDummy.position.set(0, HIDE, 0); bodyDummy.scale.setScalar(0.001); bodyDummy.updateMatrix();
          bodyRef.current.setMatrixAt(i, bodyDummy.matrix);
          cabRef.current.setMatrixAt(i, bodyDummy.matrix);
          for (let w = 0; w < 4; w++) { whlRef.current.setMatrixAt(i * 4 + w, bodyDummy.matrix); }
          bodyRef.current.setColorAt(i, bodyCol.set(KINDS[v.kind].body));
          cabRef.current.setColorAt(i, cabCol.set(KINDS[v.kind].cab));
          for (let w = 0; w < 4; w++) whlRef.current.setColorAt(i * 4 + w, whlCol);
          continue;
        }
      }

      const k = KINDS[v.kind];
      const isMoto = v.kind < MOTO_KINDS;
      const bodyY = k.wheelR + k.h / 2;
      const cabY  = bodyY + (isMoto ? 0 : k.h * 0.5) + k.h * 0.38;

      bodyDummy.position.set(x, bodyY, z);
      bodyDummy.rotation.set(0, rotY, 0);
      bodyDummy.scale.set(k.w, k.h, k.l);
      bodyDummy.updateMatrix();
      bodyRef.current.setMatrixAt(i, bodyDummy.matrix);
      bodyRef.current.setColorAt(i, bodyCol.set(k.body));

      if (!isMoto) {
        cabDummy.position.set(x, cabY, z);
        cabDummy.rotation.set(0, rotY, 0);
        const bus = k.l > 8;
        cabDummy.scale.set(k.w * 0.9, k.h * (bus ? 0.95 : 0.72), k.l * (bus ? 0.96 : 0.52));
        cabDummy.updateMatrix();
      } else {
        cabDummy.position.set(0, HIDE, 0); cabDummy.scale.setScalar(0.001); cabDummy.updateMatrix();
      }
      cabRef.current.setMatrixAt(i, cabDummy.matrix);
      cabRef.current.setColorAt(i, cabCol.set(k.cab));

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
    }

    [bodyRef, cabRef].forEach((r) => {
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
      <instancedMesh ref={whlRef} args={[undefined, undefined, WHEEL_COUNT]} castShadow frustumCulled={false}>
        <cylinderGeometry args={[1, 1, 0.2, 12]} /><meshLambertMaterial color="white" />
      </instancedMesh>
    </>
  );
}
