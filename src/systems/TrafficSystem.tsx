"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedMesh, Object3D, Color, MathUtils } from "three";
import { useGame } from "@/core/store";
import { WORLD } from "@/world/worldConfig";

/**
 * Grid traffic. Vehicles drive along road lines (one axis each), obey a global
 * 2-phase traffic signal at intersections, and recycle around the player. One
 * instanced mesh for the fleet; scale per instance distinguishes motorcycle /
 * car / bus. Visual swap to GLB = split into per-kind instanced meshes later.
 */

const MAX = 40;
const SPACING = WORLD.roadEvery * WORLD.cell; // distance between road lines
const HALF = WORLD.size;
const LANE = 3; // offset from road centerline
const DESPAWN = 160;
const STOP_DIST = 10; // start braking this far before a red intersection

const KINDS = [
  { color: "#c43b3b", w: 0.7, h: 0.6, l: 1.6, speed: 9 }, // motorcycle
  { color: "#d8d8d8", w: 1.8, h: 1.4, l: 4, speed: 11 }, // car
  { color: "#9fb3c8", w: 1.9, h: 1.4, l: 4.2, speed: 10 }, // car 2
  { color: "#1f6fb2", w: 2.4, h: 2.6, l: 10, speed: 8 }, // bus
];

interface Veh {
  axis: "x" | "z"; // travel axis
  line: number; // fixed coordinate on the other axis
  along: number; // position on travel axis
  dirSign: 1 | -1;
  speed: number;
  cur: number; // current speed (for braking)
  kind: number;
}

const dummy = new Object3D();
const col = new Color();

function snapLine(v: number) {
  return Math.round((v + HALF) / SPACING) * SPACING - HALF;
}
function nextIntersection(along: number, dirSign: number) {
  // nearest road line strictly ahead in travel direction
  const k = dirSign > 0 ? Math.ceil((along + HALF) / SPACING) : Math.floor((along + HALF) / SPACING);
  return k * SPACING - HALF;
}

function spawn(v: Veh, px: number, pz: number) {
  const k = (Math.random() * KINDS.length) | 0;
  v.kind = k;
  v.speed = KINDS[k].speed * (0.85 + Math.random() * 0.3);
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

export default function TrafficSystem() {
  const ref = useRef<InstancedMesh>(null!);
  const phase = useRef(0); // 0 => z-axis go, 1 => x-axis go
  const phaseTimer = useRef(8);

  const vehicles = useMemo<Veh[]>(() => {
    const [px, , pz] = useGame.getState().runtime.pos;
    return Array.from({ length: MAX }, () => {
      const v: Veh = { axis: "z", line: 0, along: 0, dirSign: 1, speed: 9, cur: 9, kind: 1 };
      spawn(v, px, pz);
      return v;
    });
  }, []);

  useFrame((_, delta) => {
    const st = useGame.getState();
    if (st.paused) return;
    const mesh = ref.current;
    const [px, , pz] = st.runtime.pos;

    phaseTimer.current -= delta;
    if (phaseTimer.current <= 0) {
      phase.current = phase.current === 0 ? 1 : 0;
      phaseTimer.current = 8;
    }

    for (let i = 0; i < MAX; i++) {
      const v = vehicles[i];
      const goingAxisIsZ = v.axis === "z";
      const hasGreen = (phase.current === 0) === goingAxisIsZ;

      // Brake for a red light near the next intersection.
      let targetSpeed = v.speed;
      if (!hasGreen) {
        const inter = nextIntersection(v.along, v.dirSign);
        const distAhead = (inter - v.along) * v.dirSign;
        if (distAhead > 0 && distAhead < STOP_DIST) targetSpeed = 0;
      }
      v.cur = MathUtils.lerp(v.cur, targetSpeed, 1 - Math.exp(-6 * delta));
      v.along += v.cur * v.dirSign * delta;

      // World position from axis + lane offset.
      let x: number, z: number, rotY: number;
      if (goingAxisIsZ) {
        x = v.line + LANE * v.dirSign;
        z = v.along;
        rotY = v.dirSign > 0 ? 0 : Math.PI;
      } else {
        x = v.along;
        z = v.line - LANE * v.dirSign;
        rotY = v.dirSign > 0 ? Math.PI / 2 : -Math.PI / 2;
      }

      if (Math.hypot(x - px, z - pz) > DESPAWN) {
        spawn(v, px, pz);
        continue;
      }

      const kind = KINDS[v.kind];
      dummy.position.set(x, kind.h / 2 + 0.1, z);
      dummy.rotation.set(0, rotY, 0);
      dummy.scale.set(kind.w, kind.h, kind.l);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, col.set(kind.color));
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, MAX]} castShadow frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial vertexColors />
    </instancedMesh>
  );
}
