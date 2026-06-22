"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedMesh, Object3D, Color, MathUtils } from "three";
import { useGame, MAX_NPCS, npcPositions } from "@/core/store";
import { BLOCK, ROAD_LINES, ROAD_HALF, lanePoint, PARK_RADIUS, MAP } from "@/world/grid";
import { traffic, GREEN_TIME, YELLOW_TIME } from "./trafficState";
import { avatar } from "@/player/avatarState";
import { addShake, addSpark, dropMoney } from "./effects";
import { damageNpc } from "./npcState";
import { drivables } from "./registries";

const MAX = 36;
const DESPAWN = 170;
const MIN_GAP = 1.6;       // bumper gap kept behind the vehicle ahead
const SLOW_RANGE = 7;      // start slowing this far before an obstacle

// Realistic palette. cab defaults to body; bus has a white roof. (no pure black)
interface Kind { body: string; cab?: string; w: number; h: number; l: number; speed: number; wheelR: number; }
const KINDS: Kind[] = [
  // motorcycles (index < MOTO_KINDS)
  { body: "#e23a3a", w: 0.6, h: 0.56, l: 1.8, speed: 9.5, wheelR: 0.28 },
  { body: "#efefef", w: 0.6, h: 0.56, l: 1.8, speed: 10.5, wheelR: 0.28 },
  { body: "#2a48c8", w: 0.6, h: 0.56, l: 1.8, speed: 9.5, wheelR: 0.28 },
  { body: "#222831", w: 0.6, h: 0.56, l: 1.8, speed: 11, wheelR: 0.28 },
  // cars / MPV / SUV / pickup / taxi
  { body: "#ececef", w: 1.78, h: 0.72, l: 4.4, speed: 11, wheelR: 0.34 }, // white
  { body: "#c7cbd2", w: 1.78, h: 0.72, l: 4.4, speed: 11, wheelR: 0.34 }, // silver
  { body: "#3a3f48", w: 1.80, h: 0.74, l: 4.6, speed: 11, wheelR: 0.35 }, // gunmetal
  { body: "#23262c", w: 1.80, h: 0.74, l: 4.6, speed: 11, wheelR: 0.35 }, // charcoal
  { body: "#b5302e", w: 1.76, h: 0.70, l: 4.25, speed: 12, wheelR: 0.34 }, // red
  { body: "#27478a", w: 1.84, h: 0.80, l: 4.8, speed: 10, wheelR: 0.36 }, // navy MPV
  { body: "#2f6f4f", w: 1.80, h: 0.76, l: 4.6, speed: 10, wheelR: 0.35 }, // green
  { body: "#cdb78a", w: 1.80, h: 0.74, l: 4.55, speed: 10, wheelR: 0.35 }, // beige
  { body: "#2f88c4", w: 1.88, h: 0.70, l: 4.75, speed: 10, wheelR: 0.36 }, // pickup
  { body: "#1f63c8", w: 1.78, h: 0.72, l: 4.3, speed: 11, wheelR: 0.34 }, // taxi blue
  // bus (last)
  { body: "#e02424", cab: "#ffffff", w: 2.4, h: 2.4, l: 10, speed: 8, wheelR: 0.5 },
];
const MOTO_KINDS = 4;
const BUS_KIND = KINDS.length - 1;
const WHEEL_COUNT = MAX * 4;

interface Veh { axis: "x" | "z"; line: number; along: number; dir: 1 | -1; speed: number; cur: number; kind: number; }

const bodyD = new Object3D();
const cabD = new Object3D();
const winD = new Object3D();
const whlD = new Object3D();
const ltD = new Object3D();
const rTorso = new Object3D();
const rHead = new Object3D();
const tmpCol = new Color();
const winCol = new Color("#bfe6f4");
const whlCol = new Color("#222");
const rTorsoCol = new Color("#2a2e3a");
const HELMET = ["#e6e6ee", "#d83030", "#2a64c0", "#2a2a2a"];
const HEAD_COL = new Color("#fff6d8");
const TAIL_COL = new Color("#ff2a2a");

function spawnVeh(v: Veh, px: number, pz: number) {
  v.kind = (Math.random() * KINDS.length) | 0;
  v.speed = KINDS[v.kind].speed * (0.85 + Math.random() * 0.3);
  v.cur = v.speed;
  v.dir = Math.random() < 0.5 ? 1 : -1;
  v.axis = Math.random() < 0.5 ? "z" : "x";
  const center = v.axis === "z" ? px : pz;
  const cands = ROAD_LINES.filter((c) => Math.abs(c - center) < 130 && Math.abs(c) >= PARK_RADIUS);
  v.line = cands.length ? cands[(Math.random() * cands.length) | 0] : (center >= 0 ? 96 : -96);
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
  const cabRef = useRef<InstancedMesh>(null!);
  const winRef = useRef<InstancedMesh>(null!);
  const whlRef = useRef<InstancedMesh>(null!);
  const headRef = useRef<InstancedMesh>(null!); // headlights (white)
  const tailRef = useRef<InstancedMesh>(null!); // taillights (red)
  const rTorsoRef = useRef<InstancedMesh>(null!);
  const rHeadRef = useRef<InstancedMesh>(null!);
  const hitCd = useRef(0);

  const vehicles = useMemo<Veh[]>(() => {
    const [px, , pz] = useGame.getState().runtime.pos;
    return Array.from({ length: MAX }, () => {
      const v: Veh = { axis: "z", line: 0, along: 0, dir: 1, speed: 9, cur: 9, kind: 4 };
      spawnVeh(v, px, pz);
      return v;
    });
  }, []);

  // Colors are static per vehicle → set once + on respawn only (saves GPU uploads).
  const setColors = (i: number, v: Veh) => {
    const k = KINDS[v.kind];
    bodyRef.current.setColorAt(i, tmpCol.set(k.body));
    cabRef.current.setColorAt(i, tmpCol.set(k.cab ?? k.body));
    winRef.current.setColorAt(i, winCol);
    headRef.current.setColorAt(i, HEAD_COL);
    tailRef.current.setColorAt(i, TAIL_COL);
    for (let w = 0; w < 4; w++) whlRef.current.setColorAt(i * 4 + w, whlCol);
    rTorsoRef.current.setColorAt(i, rTorsoCol);
    rHeadRef.current.setColorAt(i, tmpCol.set(HELMET[v.kind % HELMET.length]));
  };
  useLayoutEffect(() => {
    vehicles.forEach((v, i) => setColors(i, v));
    [bodyRef, cabRef, winRef, headRef, tailRef, whlRef, rTorsoRef, rHeadRef].forEach((r) => {
      if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles]);

  useFrame((_, delta) => {
    const st = useGame.getState();
    if (st.paused) return;
    const [px, , pz] = st.runtime.pos;
    const HIDE = -3000;
    const onFoot = !st.runtime.inVehicleId;
    hitCd.current -= delta;
    let colorsDirty = false;

    traffic.timer -= delta;
    if (traffic.timer <= 0) { traffic.phase = traffic.phase === 0 ? 1 : 0; traffic.timer = GREEN_TIME + YELLOW_TIME; }

    // player vehicle (for crash + run-over while driving)
    const drv = st.runtime.inVehicleId ? drivables.get(st.runtime.inVehicleId) : null;
    let drvX = 0, drvZ = 0, drvSpd = 0;
    if (drv) { const t = drv.body.translation(); const lv = drv.body.linvel(); drvX = t.x; drvZ = t.z; drvSpd = Math.hypot(lv.x, lv.z); }

    for (let i = 0; i < MAX; i++) {
      const v = vehicles[i];
      const k = KINDS[v.kind];
      const halfLen = k.l / 2;
      const onZ = v.axis === "z";
      const hasGreen = (traffic.phase === 0) === onZ;
      const lp0 = lanePoint(v.axis, v.line, v.dir, v.along);
      const fwdX = Math.sin(lp0.rotY), fwdZ = Math.cos(lp0.rotY);
      const frontAlong = v.along + v.dir * halfLen;

      // ── how far the FRONT can advance before hitting something ──
      let clearance = 1e9;

      // red/yellow light → stop just before the intersection box
      if (!hasGreen) {
        const nextInter = (v.dir > 0 ? Math.ceil((v.along + 0.01) / BLOCK) : Math.floor((v.along - 0.01) / BLOCK)) * BLOCK;
        const stopLine = nextInter - v.dir * (ROAD_HALF + 1.0);
        const d = (stopLine - frontAlong) * v.dir;
        if (d < clearance) clearance = d;
      }
      // vehicle ahead in the same lane
      for (let j = 0; j < MAX; j++) {
        if (j === i) continue;
        const o = vehicles[j];
        if (o.axis !== v.axis || o.dir !== v.dir || Math.abs(o.line - v.line) > 1.5) continue;
        const leadRear = o.along - v.dir * (KINDS[o.kind].l / 2);
        const d = (leadRear - frontAlong) * v.dir - MIN_GAP;
        if (d < clearance) clearance = d;
      }
      // pedestrians + player on foot → brake (never run them over)
      for (let j = 0; j <= MAX_NPCS; j++) {
        let ox: number, oz: number;
        if (j === MAX_NPCS) { if (!onFoot) continue; ox = px; oz = pz; }
        else { ox = npcPositions[j * 2]; if (ox > 90000) continue; oz = npcPositions[j * 2 + 1]; }
        const dx = ox - lp0.x, dz = oz - lp0.z;
        const ahead = dx * fwdX + dz * fwdZ;
        if (ahead <= 0) continue;
        const lateral = Math.abs(dx * fwdZ - dz * fwdX); // perpendicular distance
        if (lateral > 1.5) continue;
        const d = ahead - halfLen - 0.7;
        if (d < clearance) clearance = d;
      }

      // desired speed from clearance, then advance with a HARD CLAMP (no overlap ever)
      const target = clearance > SLOW_RANGE ? v.speed : v.speed * Math.max(0, clearance / SLOW_RANGE);
      v.cur = MathUtils.lerp(v.cur, target, 1 - Math.exp(-7 * delta));
      const move = Math.min(v.cur * delta, Math.max(0, clearance));
      v.along += v.dir * move;

      const lp = lanePoint(v.axis, v.line, v.dir, v.along);
      const x = lp.x, z = lp.z, rotY = lp.rotY;

      // recycle far / off-map / park
      if (Math.hypot(x - px, z - pz) > DESPAWN || Math.abs(v.along) > MAP - 6 || Math.hypot(x, z) < PARK_RADIUS + 6) {
        spawnVeh(v, px, pz);
        bodyD.position.set(0, HIDE, 0); bodyD.scale.setScalar(0.001); bodyD.updateMatrix();
        bodyRef.current.setMatrixAt(i, bodyD.matrix);
        cabRef.current.setMatrixAt(i, bodyD.matrix);
        winRef.current.setMatrixAt(i, bodyD.matrix);
        headRef.current.setMatrixAt(i, bodyD.matrix);
        tailRef.current.setMatrixAt(i, bodyD.matrix);
        rTorsoRef.current.setMatrixAt(i, bodyD.matrix);
        rHeadRef.current.setMatrixAt(i, bodyD.matrix);
        for (let w = 0; w < 4; w++) whlRef.current.setMatrixAt(i * 4 + w, bodyD.matrix);
        setColors(i, v); colorsDirty = true;
        continue;
      }

      // player driving rams this vehicle → crash feedback
      if (drv && hitCd.current <= 0 && Math.hypot(drvX - x, drvZ - z) < 2.8) {
        const lv = drv.body.linvel();
        drv.body.setLinvel({ x: lv.x * -0.25, y: lv.y, z: lv.z * -0.25 }, true);
        addShake(0.7); addSpark(x, 0.9, z);
        avatar.hurtAt = performance.now(); hitCd.current = 0.8;
        st.notify("BRAK! 💥");
        spawnVeh(v, px, pz); setColors(i, v); colorsDirty = true; continue;
      }

      const isMoto = v.kind < MOTO_KINDS;
      const isBus = v.kind === BUS_KIND;
      const bodyY = k.h / 2 + k.wheelR * 0.4;
      const cabY = bodyY + (isMoto ? 0 : k.h * 0.5) + k.h * 0.38;

      bodyD.position.set(x, bodyY, z); bodyD.rotation.set(0, rotY, 0); bodyD.scale.set(k.w, k.h, k.l); bodyD.updateMatrix();
      bodyRef.current.setMatrixAt(i, bodyD.matrix);

      if (!isMoto) {
        cabD.position.set(x, cabY, z); cabD.rotation.set(0, rotY, 0);
        cabD.scale.set(k.w * 0.9, k.h * (isBus ? 0.95 : 0.66), k.l * (isBus ? 0.96 : 0.5)); cabD.updateMatrix();
        winD.position.set(x, cabY + 0.02, z); winD.rotation.set(0, rotY, 0);
        winD.scale.set(k.w * 0.93, k.h * (isBus ? 0.6 : 0.4), k.l * (isBus ? 0.92 : 0.48)); winD.updateMatrix();
      } else {
        const fx = fwdX * k.l * 0.34, fz = fwdZ * k.l * 0.34;
        cabD.position.set(x + fx, bodyY + 0.34, z + fz); cabD.rotation.set(0, rotY, 0);
        cabD.scale.set(k.w * 0.92, k.h * 1.25, k.l * 0.26); cabD.updateMatrix();
        winD.position.set(x + fx, bodyY + 0.78, z + fz); winD.rotation.set(0, rotY, 0);
        winD.scale.set(k.w * 0.8, k.h * 0.7, 0.05); winD.updateMatrix();
      }
      cabRef.current.setMatrixAt(i, cabD.matrix);
      winRef.current.setMatrixAt(i, winD.matrix);

      // head + tail lights (front white / rear red), proud of the body ends
      const lz = halfLen + 0.04;
      ltD.position.set(x + fwdX * lz, bodyY + 0.02, z + fwdZ * lz); ltD.rotation.set(0, rotY, 0);
      ltD.scale.set(k.w * 0.8, 0.14, 0.06); ltD.updateMatrix();
      headRef.current.setMatrixAt(i, ltD.matrix);
      ltD.position.set(x - fwdX * lz, bodyY + 0.04, z - fwdZ * lz);
      ltD.scale.set(k.w * 0.82, 0.14, 0.06); ltD.updateMatrix();
      tailRef.current.setMatrixAt(i, ltD.matrix);

      // wheels
      const wheelR = k.wheelR, halfW = k.w / 2, axleOff = isMoto ? k.l * 0.42 : k.l / 2 - 0.72;
      const wRot: [number, number, number] = onZ ? [0, 0, Math.PI / 2] : [Math.PI / 2, 0, 0];
      const wpos: [number, number, number][] = onZ
        ? [[x - halfW, wheelR, z + axleOff], [x + halfW, wheelR, z + axleOff], [x - halfW, wheelR, z - axleOff], [x + halfW, wheelR, z - axleOff]]
        : [[x + axleOff, wheelR, z - halfW], [x + axleOff, wheelR, z + halfW], [x - axleOff, wheelR, z - halfW], [x - axleOff, wheelR, z + halfW]];
      for (let w = 0; w < 4; w++) {
        if (isMoto && w >= 2) { whlD.position.set(0, HIDE, 0); whlD.scale.setScalar(0.001); }
        else { whlD.position.set(...wpos[w]); whlD.rotation.set(...wRot); whlD.scale.set(wheelR, wheelR, wheelR); }
        whlD.updateMatrix();
        whlRef.current.setMatrixAt(i * 4 + w, whlD.matrix);
      }

      // motorcycle rider
      if (isMoto) {
        rTorso.position.set(x - fwdX * 0.08, bodyY + 0.5, z - fwdZ * 0.08); rTorso.rotation.set(0.28, rotY, 0); rTorso.scale.set(0.36, 0.62, 0.32); rTorso.updateMatrix();
        rTorsoRef.current.setMatrixAt(i, rTorso.matrix);
        rHead.position.set(x - fwdX * 0.02, bodyY + 1.0, z - fwdZ * 0.02); rHead.rotation.set(0, rotY, 0); rHead.scale.setScalar(0.22); rHead.updateMatrix();
        rHeadRef.current.setMatrixAt(i, rHead.matrix);
      } else {
        rTorso.position.set(0, HIDE, 0); rTorso.scale.setScalar(0.001); rTorso.updateMatrix();
        rTorsoRef.current.setMatrixAt(i, rTorso.matrix);
        rHead.position.set(0, HIDE, 0); rHead.scale.setScalar(0.001); rHead.updateMatrix();
        rHeadRef.current.setMatrixAt(i, rHead.matrix);
      }
    }

    // player driving over pedestrians (intentional) → kill + drops
    if (drv && drvSpd > 4) {
      for (let j = 0; j < MAX_NPCS; j++) {
        const nx = npcPositions[j * 2]; if (nx > 90000) continue;
        const nz = npcPositions[j * 2 + 1];
        if ((nx - drvX) ** 2 + (nz - drvZ) ** 2 < 4) {
          if (damageNpc(j, 999)) { st.addKill("warga"); dropMoney(nx, nz, 2000 + ((Math.random() * 5000) | 0)); addSpark(nx, 0.8, nz); }
        }
      }
    }

    [bodyRef, cabRef, winRef, headRef, tailRef, whlRef, rTorsoRef, rHeadRef].forEach((r) => {
      r.current.instanceMatrix.needsUpdate = true;
      if (colorsDirty && r.current.instanceColor) r.current.instanceColor.needsUpdate = true;
    });
  });

  return (
    <>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, MAX]} castShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={cabRef} args={[undefined, undefined, MAX]} castShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={winRef} args={[undefined, undefined, MAX]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="#ffffff" transparent opacity={0.8} />
      </instancedMesh>
      <instancedMesh ref={whlRef} args={[undefined, undefined, WHEEL_COUNT]} frustumCulled={false}>
        <cylinderGeometry args={[1, 1, 0.2, 10]} /><meshLambertMaterial color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, MAX]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={tailRef} args={[undefined, undefined, MAX]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={rTorsoRef} args={[undefined, undefined, MAX]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="#ffffff" />
      </instancedMesh>
      <instancedMesh ref={rHeadRef} args={[undefined, undefined, MAX]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} /><meshLambertMaterial color="#ffffff" />
      </instancedMesh>
    </>
  );
}
