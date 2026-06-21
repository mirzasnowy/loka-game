"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedMesh, Object3D, Color, MathUtils } from "three";
import { useGame } from "@/core/store";
import { WORLD } from "@/world/worldConfig";

const MAX = 40;
const SPACING = WORLD.roadEvery * WORLD.cell;
const HALF = WORLD.size;
const LANE = 3;
const DESPAWN = 160;
const STOP_DIST = 10;

// kind: { body color, cab color, w, h, l, speed, wheelR }
const KINDS = [
  { body: "#e82828", cab: "#e82828", w: 0.62, h: 0.56, l: 1.75, speed: 9,  wheelR: 0.28 }, // motorcycle red
  { body: "#f0f0f0", cab: "#f0f0f0", w: 0.62, h: 0.56, l: 1.75, speed: 10, wheelR: 0.28 }, // motorcycle white
  { body: "#1a2060", cab: "#1a2060", w: 0.62, h: 0.56, l: 1.75, speed: 9,  wheelR: 0.28 }, // motorcycle blue
  { body: "#d8d8d8", cab: "#d8d8d8", w: 1.80, h: 0.72, l: 4.40, speed: 11, wheelR: 0.36 }, // car silver
  { body: "#c82020", cab: "#c82020", w: 1.78, h: 0.70, l: 4.30, speed: 11, wheelR: 0.36 }, // car red
  { body: "#2a3a50", cab: "#2a3a50", w: 1.82, h: 0.76, l: 4.70, speed: 10, wheelR: 0.36 }, // innova dark
  { body: "#4070a8", cab: "#4070a8", w: 1.88, h: 0.68, l: 4.60, speed: 10, wheelR: 0.36 }, // pickup blue
  { body: "#e02020", cab: "#ffffff", w: 2.40, h: 2.40, l: 10.0, speed: 8,  wheelR: 0.50 }, // TransJakarta
];
const MOTO_KINDS = 3;

interface Veh {
  axis: "x" | "z";
  line: number;
  along: number;
  dirSign: 1 | -1;
  speed: number;
  cur: number;
  kind: number;
}

const bodyDummy = new Object3D();
const cabDummy  = new Object3D();
const whlDummy  = new Object3D();
const bodyCol   = new Color();
const cabCol    = new Color();
const whlCol    = new Color("#181818");

function snapLine(v: number) {
  return Math.round((v + HALF) / SPACING) * SPACING - HALF;
}
function nextIntersection(along: number, dirSign: number) {
  const k = dirSign > 0 ? Math.ceil((along + HALF) / SPACING) : Math.floor((along + HALF) / SPACING);
  return k * SPACING - HALF;
}
function spawnVeh(v: Veh, px: number, pz: number) {
  v.kind = (Math.random() * KINDS.length) | 0;
  v.speed = KINDS[v.kind].speed * (0.85 + Math.random() * 0.3);
  v.cur = v.speed;
  v.dirSign = Math.random() < 0.5 ? 1 : -1;
  if (Math.random() < 0.5) {
    v.axis = "z";
    v.line = snapLine(px + (Math.random() - 0.5) * 120);
    v.along = pz + (Math.random() - 0.5) * 200;
  } else {
    v.axis = "x";
    v.line = snapLine(pz + (Math.random() - 0.5) * 120);
    v.along = px + (Math.random() - 0.5) * 200;
  }
}

// Total wheel instances: MAX * 4 (or 2 for motos)
const WHEEL_COUNT = MAX * 4;

export default function TrafficSystem() {
  const bodyRef  = useRef<InstancedMesh>(null!);
  const cabRef   = useRef<InstancedMesh>(null!);
  const whlRef   = useRef<InstancedMesh>(null!);
  const phase    = useRef(0);
  const phaseTmr = useRef(8);

  const vehicles = useMemo<Veh[]>(() => {
    const [px, , pz] = useGame.getState().runtime.pos;
    return Array.from({ length: MAX }, () => {
      const v: Veh = { axis: "z", line: 0, along: 0, dirSign: 1, speed: 9, cur: 9, kind: 3 };
      spawnVeh(v, px, pz);
      return v;
    });
  }, []);

  useFrame((_, delta) => {
    const st = useGame.getState();
    if (st.paused) return;
    const [px, , pz] = st.runtime.pos;

    phaseTmr.current -= delta;
    if (phaseTmr.current <= 0) {
      phase.current = phase.current === 0 ? 1 : 0;
      phaseTmr.current = 8;
    }

    const HIDE = -2000;

    for (let i = 0; i < MAX; i++) {
      const v = vehicles[i];
      const onZ = v.axis === "z";
      const hasGreen = (phase.current === 0) === onZ;

      let targetSpeed = v.speed;
      if (!hasGreen) {
        const inter = nextIntersection(v.along, v.dirSign);
        const distAhead = (inter - v.along) * v.dirSign;
        if (distAhead > 0 && distAhead < STOP_DIST) targetSpeed = 0;
      }
      v.cur = MathUtils.lerp(v.cur, targetSpeed, 1 - Math.exp(-6 * delta));
      v.along += v.cur * v.dirSign * delta;

      let x: number, z: number, rotY: number;
      if (onZ) {
        x = v.line + LANE * v.dirSign;
        z = v.along;
        rotY = v.dirSign > 0 ? 0 : Math.PI;
      } else {
        x = v.along;
        z = v.line - LANE * v.dirSign;
        rotY = v.dirSign > 0 ? Math.PI / 2 : -Math.PI / 2;
      }

      if (Math.hypot(x - px, z - pz) > DESPAWN) {
        spawnVeh(v, px, pz);
        // Hide this frame's body/wheels while recycled
        bodyDummy.position.set(0, HIDE, 0); bodyDummy.scale.setScalar(0.001); bodyDummy.updateMatrix();
        bodyRef.current.setMatrixAt(i, bodyDummy.matrix);
        cabRef.current.setMatrixAt(i, bodyDummy.matrix);
        for (let w = 0; w < 4; w++) {
          whlDummy.position.set(0, HIDE, 0); whlDummy.scale.setScalar(0.001); whlDummy.updateMatrix();
          whlRef.current.setMatrixAt(i * 4 + w, whlDummy.matrix);
        }
        continue;
      }

      const k = KINDS[v.kind];
      const isMoto = v.kind < MOTO_KINDS;
      const bodyY = k.wheelR + k.h / 2;
      const cabY  = bodyY + k.h * (isMoto ? 0 : 0.5) + k.h * 0.38;

      // Body
      bodyDummy.position.set(x, bodyY, z);
      bodyDummy.rotation.set(0, rotY, 0);
      bodyDummy.scale.set(k.w, k.h, k.l);
      bodyDummy.updateMatrix();
      bodyRef.current.setMatrixAt(i, bodyDummy.matrix);
      bodyRef.current.setColorAt(i, bodyCol.set(k.body));

      // Cab / roof (skip for motorcycles)
      if (!isMoto) {
        cabDummy.position.set(x, cabY, z);
        cabDummy.rotation.set(0, rotY, 0);
        const isLargeBus = k.l > 8;
        cabDummy.scale.set(k.w * 0.9, k.h * (isLargeBus ? 0.95 : 0.72), k.l * (isLargeBus ? 0.96 : 0.52));
        cabDummy.updateMatrix();
      } else {
        cabDummy.position.set(0, HIDE, 0);
        cabDummy.scale.setScalar(0.001);
        cabDummy.updateMatrix();
      }
      cabRef.current.setMatrixAt(i, cabDummy.matrix);
      cabRef.current.setColorAt(i, cabCol.set(k.cab));

      // Wheels — 4 per vehicle (2 axles)
      // For z-axis vehicles: axle along world X → cylinder tilt (0, 0, PI/2)
      // For x-axis vehicles: axle along world Z → cylinder tilt (PI/2, 0, 0)
      const wheelR = k.wheelR;
      const halfW  = k.w / 2;
      const axleOff = isMoto ? k.l * 0.42 : k.l / 2 - 0.72;
      const wheelRot: [number, number, number] = onZ ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0];

      // Compute 4 wheel world positions
      type WheelPos = [number, number, number];
      let wheelPositions: WheelPos[];
      if (onZ) {
        // vehicle goes along Z, width along X
        wheelPositions = [
          [x - halfW, wheelR, z + axleOff],
          [x + halfW, wheelR, z + axleOff],
          [x - halfW, wheelR, z - axleOff],
          [x + halfW, wheelR, z - axleOff],
        ];
      } else {
        // vehicle goes along X, width along Z
        wheelPositions = [
          [x + axleOff, wheelR, z - halfW],
          [x + axleOff, wheelR, z + halfW],
          [x - axleOff, wheelR, z - halfW],
          [x - axleOff, wheelR, z + halfW],
        ];
      }

      for (let w = 0; w < 4; w++) {
        whlDummy.position.set(...wheelPositions[w]);
        whlDummy.rotation.set(...wheelRot);
        whlDummy.scale.set(1, 1, 1);
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
      {/* Vehicle bodies */}
      <instancedMesh ref={bodyRef} args={[undefined, undefined, MAX]} castShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial vertexColors />
      </instancedMesh>
      {/* Cabs / roofs */}
      <instancedMesh ref={cabRef} args={[undefined, undefined, MAX]} castShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial vertexColors />
      </instancedMesh>
      {/* Wheels — flat cylinders (axis Y, tilted 90° per instance) */}
      <instancedMesh ref={whlRef} args={[undefined, undefined, WHEEL_COUNT]} castShadow frustumCulled={false}>
        <cylinderGeometry args={[1, 1, 0.2, 12]} />
        <meshLambertMaterial vertexColors />
      </instancedMesh>
    </>
  );
}
