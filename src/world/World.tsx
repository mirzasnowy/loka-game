"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, Color, InstancedMesh, CanvasTexture } from "three";
import { Text } from "@react-three/drei";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Asset } from "@/core/assetRegistry";
import { WORLD, DISTRICTS } from "./worldConfig";
import { generateCity } from "./proc";
import { traffic, YELLOW_TIME } from "@/systems/trafficState";
import {
  ROAD_LINES, ROAD_HALF, SIDEWALK_OFF, SIDEWALK_W, PARK_RADIUS, MAP, inPark,
} from "./grid";

const tmp = new Object3D();
const tmpColor = new Color();

const winTex = (() => {
  if (typeof document === "undefined") return undefined;
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const ctx = c.getContext("2d")!;
  // mullion frame color
  ctx.fillStyle = "#2a3540"; ctx.fillRect(0, 0, 256, 256);
  // glass panes with slight per-pane variation (some lit, some sky-reflective)
  const cols = 6, rows = 8, pad = 3;
  const pw = 256 / cols, ph = 256 / rows;
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const r = (Math.sin(x * 12.9 + y * 78.2) * 43758.5) % 1;
      const lit = (r + 1) % 1;
      // base blue glass, occasionally warm-lit window
      const col = lit > 0.86 ? "#ffe9a8" : lit > 0.6 ? "#bfe2f4" : "#9fcbe6";
      ctx.fillStyle = col;
      ctx.fillRect(x * pw + pad, y * ph + pad, pw - pad * 2, ph - pad * 2);
      // subtle highlight streak
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(x * pw + pad, y * ph + pad, (pw - pad * 2) * 0.35, ph - pad * 2);
    }
  }
  const t = new CanvasTexture(c);
  t.anisotropy = 4;
  return t;
})();

// ─── Buildings (body + roof + glass facade + tall entrance + rooftop unit) ───
function Buildings() {
  const bodyRef  = useRef<InstancedMesh>(null!);
  const roofRef  = useRef<InstancedMesh>(null!);
  const winRef   = useRef<InstancedMesh>(null!);   // window/glass facade overlay (4 sides via duplication on +Z/-Z)
  const win2Ref  = useRef<InstancedMesh>(null!);   // side facade (+X face)
  const doorRef  = useRef<InstancedMesh>(null!);   // tall ground-floor glass entrance
  const acRef    = useRef<InstancedMesh>(null!);   // rooftop unit
  const data = useMemo(() => generateCity().buildings, []);
  const HIDE = -9000;

  useLayoutEffect(() => {
    data.forEach((b, i) => {
      // body
      tmp.position.set(b.x, b.h / 2, b.z); tmp.rotation.set(0, 0, 0); tmp.scale.set(b.w, b.h, b.d); tmp.updateMatrix();
      bodyRef.current.setMatrixAt(i, tmp.matrix);
      bodyRef.current.setColorAt(i, tmpColor.set(b.color));

      // roof cap (ruko gets a colored awning-ish darker roof)
      tmp.position.set(b.x, b.h + 0.45, b.z); tmp.scale.set(b.w * 0.94, 0.9, b.d * 0.94); tmp.updateMatrix();
      roofRef.current.setMatrixAt(i, tmp.matrix);
      roofRef.current.setColorAt(i, tmpColor.set(b.color).multiplyScalar(0.58));

      // glass facade coverage by style
      const cover = b.style === "glass" ? 0.92 : b.kind === "office" ? 0.8 : 0.66;
      const hcov  = b.style === "glass" ? 0.94 : b.kind === "office" ? 0.7 : 0.5;
      const glassCol = b.style === "glass" ? "#cfeaf8" : b.kind === "office" ? "#a4d2ee" : "#f6edbc";

      // facade on +Z
      tmp.position.set(b.x, b.h * 0.54, b.z + b.d * 0.503); tmp.rotation.set(0, 0, 0); tmp.scale.set(b.w * cover, b.h * hcov, 1); tmp.updateMatrix();
      winRef.current.setMatrixAt(i, tmp.matrix); winRef.current.setColorAt(i, tmpColor.set(glassCol));
      // facade on +X (rotated)
      tmp.position.set(b.x + b.w * 0.503, b.h * 0.54, b.z); tmp.rotation.set(0, Math.PI / 2, 0); tmp.scale.set(b.d * cover, b.h * hcov, 1); tmp.updateMatrix();
      win2Ref.current.setMatrixAt(i, tmp.matrix); win2Ref.current.setColorAt(i, tmpColor.set(glassCol));

      // tall ground-floor glass entrance (the "kaca pintu menjulang")
      const doorH = Math.min(b.h * 0.32, 5.5);
      tmp.position.set(b.x, doorH / 2 + 0.1, b.z + b.d * 0.505); tmp.rotation.set(0, 0, 0); tmp.scale.set(b.w * 0.42, doorH, 1); tmp.updateMatrix();
      doorRef.current.setMatrixAt(i, tmp.matrix); doorRef.current.setColorAt(i, tmpColor.set("#274a66"));

      // rooftop AC/water unit for taller buildings
      if (b.h > 18) {
        tmp.position.set(b.x + b.w * 0.18, b.h + 1.4, b.z - b.d * 0.12); tmp.rotation.set(0, 0, 0); tmp.scale.set(b.w * 0.3, 1.6, b.d * 0.3); tmp.updateMatrix();
      } else {
        tmp.position.set(0, HIDE, 0); tmp.scale.setScalar(0.001); tmp.updateMatrix();
      }
      acRef.current.setMatrixAt(i, tmp.matrix); acRef.current.setColorAt(i, tmpColor.set("#aab0b8"));
    });
    [bodyRef, roofRef, winRef, win2Ref, doorRef, acRef].forEach((r) => {
      r.current.instanceMatrix.needsUpdate = true;
      if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true;
    });
  }, [data]);

  const n = data.length;
  return (
    <>
      <instancedMesh ref={bodyRef} args={[undefined, undefined, n]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="white" emissive="#20242b" emissiveIntensity={0.55} />
      </instancedMesh>
      <instancedMesh ref={roofRef} args={[undefined, undefined, n]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="white" emissive="#1c2026" emissiveIntensity={0.5} />
      </instancedMesh>
      <instancedMesh ref={winRef} args={[undefined, undefined, n]}>
        <planeGeometry args={[1, 1]} /><meshLambertMaterial color="white" transparent opacity={0.8} map={winTex} />
      </instancedMesh>
      <instancedMesh ref={win2Ref} args={[undefined, undefined, n]}>
        <planeGeometry args={[1, 1]} /><meshLambertMaterial color="white" transparent opacity={0.8} map={winTex} />
      </instancedMesh>
      <instancedMesh ref={doorRef} args={[undefined, undefined, n]}>
        <planeGeometry args={[1, 1]} /><meshLambertMaterial color="white" transparent opacity={0.85} />
      </instancedMesh>
      <instancedMesh ref={acRef} args={[undefined, undefined, n]} castShadow>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="white" />
      </instancedMesh>
    </>
  );
}

// ─── Roads, sidewalks (strips along grid centerlines) ────────────────────────
function Streets() {
  const len = MAP * 2;
  return (
    <group>
      {ROAD_LINES.map((c) => (
        <group key={`r${c}`}>
          {/* E-W road (z = c) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, c]} receiveShadow>
            <planeGeometry args={[len, ROAD_HALF * 2]} />
            <meshLambertMaterial color="#353535" />
          </mesh>
          {/* N-S road (x = c) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[c, 0.021, 0]} receiveShadow>
            <planeGeometry args={[ROAD_HALF * 2, len]} />
            <meshLambertMaterial color="#353535" />
          </mesh>
          {/* sidewalks beside E-W road */}
          {[1, -1].map((s) => (
            <mesh key={`sew${s}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, c + s * SIDEWALK_OFF]} receiveShadow>
              <planeGeometry args={[len, SIDEWALK_W]} />
              <meshLambertMaterial color="#bdbdbd" />
            </mesh>
          ))}
          {/* sidewalks beside N-S road */}
          {[1, -1].map((s) => (
            <mesh key={`sns${s}`} rotation={[-Math.PI / 2, 0, 0]} position={[c + s * SIDEWALK_OFF, 0.016, 0]} receiveShadow>
              <planeGeometry args={[SIDEWALK_W, len]} />
              <meshLambertMaterial color="#bdbdbd" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

// ─── Lane center dashes (yellow) ─────────────────────────────────────────────
function LaneDashes() {
  const ref = useRef<InstancedMesh>(null!);
  const data = useMemo(() => {
    const out: { x: number; z: number; axis: "x" | "z" }[] = [];
    const STEP = 7;
    for (const c of ROAD_LINES) {
      for (let v = -MAP + 4; v <= MAP - 4; v += STEP) {
        // E-W road dash (along x at z=c)
        if (!inPark(v, c)) out.push({ x: v, z: c, axis: "x" });
        // N-S road dash (along z at x=c)
        if (!inPark(c, v)) out.push({ x: c, z: v, axis: "z" });
      }
    }
    return out;
  }, []);

  useLayoutEffect(() => {
    data.forEach((d, i) => {
      tmp.position.set(d.x, 0.05, d.z);
      tmp.rotation.set(-Math.PI / 2, 0, 0);
      if (d.axis === "x") tmp.scale.set(3, 0.35, 1);
      else tmp.scale.set(0.35, 3, 1);
      tmp.updateMatrix();
      ref.current.setMatrixAt(i, tmp.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [data]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, data.length]}>
      <planeGeometry args={[1, 1]} />
      <meshLambertMaterial color="#e8d24a" />
    </instancedMesh>
  );
}

// ─── Zebra crosswalks at intersections ───────────────────────────────────────
function Crosswalks() {
  const ref = useRef<InstancedMesh>(null!);
  const data = useMemo(() => {
    const stripes: { x: number; z: number; axis: "x" | "z" }[] = [];
    const central = ROAD_LINES.filter((c) => Math.abs(c) <= 150);
    for (const ix of central) {
      for (const iz of central) {
        if (inPark(ix, iz)) continue;
        // North & South crosswalks across the N-S road (cars travel along Z → stripes run along Z)
        for (const sgn of [1, -1]) {
          const zc = iz + sgn * (ROAD_HALF + 1.6);
          for (let sx = -ROAD_HALF + 0.7; sx <= ROAD_HALF - 0.7; sx += 1.25) {
            stripes.push({ x: ix + sx, z: zc, axis: "z" });
          }
        }
        // East & West crosswalks across the E-W road (cars travel along X → stripes run along X)
        for (const sgn of [1, -1]) {
          const xc = ix + sgn * (ROAD_HALF + 1.6);
          for (let sz = -ROAD_HALF + 0.7; sz <= ROAD_HALF - 0.7; sz += 1.25) {
            stripes.push({ x: xc, z: iz + sz, axis: "x" });
          }
        }
      }
    }
    return stripes;
  }, []);

  useLayoutEffect(() => {
    data.forEach((d, i) => {
      tmp.position.set(d.x, 0.045, d.z);
      tmp.rotation.set(-Math.PI / 2, 0, 0);
      // stripe runs along its axis (length 2.4), thin across (0.5)
      if (d.axis === "z") tmp.scale.set(0.5, 2.4, 1);
      else tmp.scale.set(2.4, 0.5, 1);
      tmp.updateMatrix();
      ref.current.setMatrixAt(i, tmp.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [data]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, Math.max(1, data.length)]}>
      <planeGeometry args={[1, 1]} />
      <meshLambertMaterial color="#f2f2f2" />
    </instancedMesh>
  );
}

// ─── Trees (Synty sphere canopy) ─────────────────────────────────────────────
const CANOPY_BOT = ["#1e6b30", "#226238", "#1a5c2a", "#24703a", "#1c6432"];
const CANOPY_MID = ["#2d8a42", "#319050", "#298040", "#35964e", "#2b8848"];
const CANOPY_TOP = ["#44b060", "#4ab866", "#40a858", "#50be6a", "#48b462"];

function Trees() {
  const trunkRef = useRef<InstancedMesh>(null!);
  const botRef   = useRef<InstancedMesh>(null!);
  const midRef   = useRef<InstancedMesh>(null!);
  const topRef   = useRef<InstancedMesh>(null!);
  const bushRef  = useRef<InstancedMesh>(null!);
  const data = useMemo(() => generateCity().trees, []);

  // Clear brown trunk + rounded green crown. Variants tweak height/spread only,
  // and the trunk always stays visible below the foliage.
  const SHAPE = [
    { th: 3.2, sp: 1.00 }, // round
    { th: 3.8, sp: 0.88 }, // tall
    { th: 2.9, sp: 1.18 }, // broad
    { th: 4.2, sp: 0.80 }, // big
    { th: 2.6, sp: 1.05 }, // small
  ];

  useLayoutEffect(() => {
    data.forEach((t, i) => {
      const s = t.scale;
      const v = t.variant % 5;
      const sh = SHAPE[v];
      const th = sh.th * s;          // trunk height (visible)
      const tr = 0.22 * s;           // trunk radius
      const sp = sh.sp;

      // Trunk — brown, from ground up to th
      tmp.position.set(t.x, th / 2, t.z); tmp.rotation.set(0, 0, 0);
      tmp.scale.set(tr * 2, th, tr * 2); tmp.updateMatrix();
      trunkRef.current.setMatrixAt(i, tmp.matrix);
      trunkRef.current.setColorAt(i, tmpColor.set("#7a4f22"));

      // Green crown sits ON TOP of the trunk (trunk stays exposed)
      tmp.position.set(t.x, th + 0.9 * s, t.z);
      tmp.scale.set(1.9 * s * sp, 1.7 * s, 1.9 * s * sp); tmp.updateMatrix();
      botRef.current.setMatrixAt(i, tmp.matrix);
      botRef.current.setColorAt(i, tmpColor.set(CANOPY_BOT[v]));

      tmp.position.set(t.x, th + 2.0 * s, t.z);
      tmp.scale.set(1.55 * s * sp, 1.5 * s, 1.55 * s * sp); tmp.updateMatrix();
      midRef.current.setMatrixAt(i, tmp.matrix);
      midRef.current.setColorAt(i, tmpColor.set(CANOPY_MID[v]));

      tmp.position.set(t.x, th + 2.9 * s, t.z);
      tmp.scale.set(1.05 * s * sp, 1.1 * s, 1.05 * s * sp); tmp.updateMatrix();
      topRef.current.setMatrixAt(i, tmp.matrix);
      topRef.current.setColorAt(i, tmpColor.set(CANOPY_TOP[v]));

      // small shrub at the base
      tmp.position.set(t.x + 0.55 * s, 0.35 * s, t.z + 0.4 * s);
      tmp.scale.setScalar(0.55 * s); tmp.updateMatrix();
      bushRef.current.setMatrixAt(i, tmp.matrix);
      bushRef.current.setColorAt(i, tmpColor.set("#2a7a38"));
    });
    [trunkRef, botRef, midRef, topRef, bushRef].forEach((r) => {
      r.current.instanceMatrix.needsUpdate = true;
      if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true;
    });
  }, [data]);

  return (
    <>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, data.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.7, 1, 7]} /><meshLambertMaterial color="white" />
      </instancedMesh>
      <instancedMesh ref={botRef} args={[undefined, undefined, data.length]} castShadow>
        <sphereGeometry args={[1, 8, 6]} /><meshLambertMaterial color="white" />
      </instancedMesh>
      <instancedMesh ref={midRef} args={[undefined, undefined, data.length]} castShadow>
        <sphereGeometry args={[1, 8, 6]} /><meshLambertMaterial color="white" />
      </instancedMesh>
      <instancedMesh ref={topRef} args={[undefined, undefined, data.length]} castShadow>
        <sphereGeometry args={[1, 7, 5]} /><meshLambertMaterial color="white" />
      </instancedMesh>
      <instancedMesh ref={bushRef} args={[undefined, undefined, data.length]} castShadow>
        <sphereGeometry args={[1, 6, 5]} /><meshLambertMaterial color="white" />
      </instancedMesh>
    </>
  );
}

// ─── Street lamps at intersection corners ────────────────────────────────────
function StreetLamps() {
  const positions = useMemo(() => {
    const pts: [number, number][] = [];
    for (const ix of ROAD_LINES) {
      for (const iz of ROAD_LINES) {
        if (inPark(ix, iz)) continue;
        if (iz < WORLD.seaLine + 10) continue;
        const o = SIDEWALK_OFF;
        pts.push([ix + o, iz + o], [ix - o, iz + o], [ix + o, iz - o], [ix - o, iz - o]);
      }
    }
    return pts;
  }, []);

  const poleRef = useRef<InstancedMesh>(null!);
  const armRef  = useRef<InstancedMesh>(null!);
  const headRef = useRef<InstancedMesh>(null!);

  useLayoutEffect(() => {
    positions.forEach(([x, z], i) => {
      tmp.position.set(x, 2.1, z); tmp.rotation.set(0, 0, 0); tmp.scale.set(0.14, 4.2, 0.14); tmp.updateMatrix();
      poleRef.current.setMatrixAt(i, tmp.matrix);
      tmp.position.set(x, 4.3, z + 0.6); tmp.scale.set(0.1, 0.1, 1.3); tmp.updateMatrix();
      armRef.current.setMatrixAt(i, tmp.matrix);
      tmp.position.set(x, 4.2, z + 1.2); tmp.scale.setScalar(0.32); tmp.updateMatrix();
      headRef.current.setMatrixAt(i, tmp.matrix);
    });
    [poleRef, armRef, headRef].forEach((r) => { r.current.instanceMatrix.needsUpdate = true; });
  }, [positions]);

  return (
    <>
      <instancedMesh ref={poleRef} args={[undefined, undefined, positions.length]} castShadow>
        <cylinderGeometry args={[0.5, 0.6, 1, 6]} /><meshLambertMaterial color="#9090a0" />
      </instancedMesh>
      <instancedMesh ref={armRef} args={[undefined, undefined, positions.length]}>
        <cylinderGeometry args={[0.5, 0.5, 1, 5]} /><meshLambertMaterial color="#9090a0" />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, positions.length]}>
        <sphereGeometry args={[1, 7, 5]} />
        <meshLambertMaterial color="white" emissive="#ffe060" emissiveIntensity={1.0} />
      </instancedMesh>
    </>
  );
}

// ─── Monas park ──────────────────────────────────────────────────────────────
function Bollard({ pos }: { pos: [number, number, number] }) {
  return (
    <mesh position={pos} castShadow>
      <cylinderGeometry args={[0.12, 0.14, 0.9, 8]} />
      <meshLambertMaterial color="#c8c0b0" />
    </mesh>
  );
}
function FlowerPot({ pos }: { pos: [number, number, number] }) {
  return (
    <group position={pos}>
      <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.28, 0.18, 0.44, 8]} /><meshLambertMaterial color="#c87848" /></mesh>
      <mesh position={[0, 0.52, 0]}><sphereGeometry args={[0.28, 7, 5]} /><meshLambertMaterial color="#e84878" /></mesh>
    </group>
  );
}

function MonasPark() {
  // Everything sits OUTSIDE the 48m monument base (corners reach r≈34).
  const ringB = Array.from({ length: 28 }, (_, k) => {
    const a = (k / 28) * Math.PI * 2;
    return [Math.cos(a) * (PARK_RADIUS - 1.5), 0.45, Math.sin(a) * (PARK_RADIUS - 1.5)] as [number, number, number];
  });
  const pots: [number, number, number][] = Array.from({ length: 8 }, (_, k) => {
    const a = (k / 8) * Math.PI * 2 + 0.4;
    return [Math.cos(a) * 31, 0, Math.sin(a) * 31] as [number, number, number];
  });

  return (
    <group>
      {/* Ring road around the park (covers grid roads passing through center) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <ringGeometry args={[PARK_RADIUS, PARK_RADIUS + ROAD_HALF * 2, 56]} />
        <meshLambertMaterial color="#353535" />
      </mesh>
      {/* Green park */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
        <circleGeometry args={[PARK_RADIUS, 48]} />
        <meshLambertMaterial color="#4aaa38" />
      </mesh>
      {/* Perimeter pathway ring (outside monument) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <ringGeometry args={[35, 38, 48]} /><meshLambertMaterial color="#cdc5b2" />
      </mesh>
      {/* Four approach paths from monument plaza to the ring */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((a, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, a]} position={[0, 0.06, 0]}>
          <planeGeometry args={[5, PARK_RADIUS * 2 * 0.92]} /><meshLambertMaterial color="#cdc5b2" />
        </mesh>
      ))}
      {/* Benches facing the monument, just inside the perimeter ring */}
      {Array.from({ length: 12 }, (_, k) => {
        const a = (k / 12) * Math.PI * 2 + 0.26, r = 33;
        return (
          <group key={k} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} rotation={[0, a + Math.PI / 2, 0]}>
            <mesh position={[0, 0.5, 0]}><boxGeometry args={[1.4, 0.1, 0.42]} /><meshLambertMaterial color="#9a6838" /></mesh>
            <mesh position={[0, 0.82, -0.17]}><boxGeometry args={[1.4, 0.42, 0.08]} /><meshLambertMaterial color="#885c2c" /></mesh>
            {[-0.6, 0.6].map((x) => <mesh key={x} position={[x, 0.26, 0]}><boxGeometry args={[0.09, 0.52, 0.4]} /><meshLambertMaterial color="#704820" /></mesh>)}
          </group>
        );
      })}
      {ringB.map((p, i) => <Bollard key={`b${i}`} pos={p} />)}
      {pots.map((p, i) => <FlowerPot key={`p${i}`} pos={p} />)}
    </group>
  );
}

// ─── Indonesian street structures (halte + KRL station) ──────────────────────
function StreetProps() {
  return (
    <>
      {/* Bus stops along main roads, facing the carriageway */}
      <Asset id="halte" position={[-30, 0, 41]} />
      <Asset id="halte" position={[55, 0, -24]} rotation={[0, -Math.PI / 2, 0]} />
      <Asset id="halte" position={[89, 0, 12]} rotation={[0, Math.PI / 2, 0]} />
      <Asset id="halte" position={[-41, 0, -76]} rotation={[0, Math.PI / 2, 0]} />
      {/* KRL commuter station on a buildable block */}
      <Asset id="station" position={[122, 0, 122]} rotation={[0, Math.PI, 0]} />
    </>
  );
}

// ─── Minimarkets + warteg (placed by proc, never overlapping buildings) ──────
function Minimarkets() {
  const stores = useMemo(() => generateCity().stores, []);
  return (
    <>
      {stores.map((s, i) => (
        <Asset key={i} id={s.id} position={[s.x, 0, s.z]} rotation={[0, s.rot, 0]} />
      ))}
    </>
  );
}

// ─── Gerobak (Street Vendors) ────────────────────────────────────────────────
function Gerobaks() {
  const positions = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 40; i++) {
       const ix = ROAD_LINES[Math.floor(Math.random() * ROAD_LINES.length)];
       const iz = (Math.random() - 0.5) * 400;
       if (inPark(ix, iz)) continue;
       const side = Math.random() < 0.5 ? 1 : -1;
       pts.push({ x: ix + side * SIDEWALK_OFF, z: iz, rot: Math.random() > 0.5 ? 0 : Math.PI/2 });
    }
    return pts;
  }, []);

  const baseRef = useRef<InstancedMesh>(null!);
  const tarpRef = useRef<InstancedMesh>(null!);
  const wheelRef = useRef<InstancedMesh>(null!);

  useLayoutEffect(() => {
    positions.forEach((p, i) => {
      tmp.position.set(p.x, 0.8, p.z); tmp.rotation.set(0, p.rot, 0); tmp.scale.set(1.4, 0.8, 2.2); tmp.updateMatrix();
      baseRef.current.setMatrixAt(i, tmp.matrix); baseRef.current.setColorAt(i, tmpColor.set("#8b5a2b"));

      tmp.position.set(p.x, 2.1, p.z); tmp.scale.set(1.6, 0.1, 2.4); tmp.updateMatrix();
      tarpRef.current.setMatrixAt(i, tmp.matrix); tarpRef.current.setColorAt(i, tmpColor.set(Math.random() > 0.5 ? "#2c82c9" : "#27ae60"));

      for (let w = 0; w < 2; w++) {
        tmp.position.set(p.x + (w===0?0.8:-0.8), 0.4, p.z); tmp.rotation.set(Math.PI/2, 0, 0); tmp.scale.set(0.4, 0.1, 0.4); tmp.updateMatrix();
        wheelRef.current.setMatrixAt(i*2 + w, tmp.matrix); wheelRef.current.setColorAt(i*2 + w, tmpColor.set("#222222"));
      }
    });
    [baseRef, tarpRef, wheelRef].forEach(r => {
      r.current.instanceMatrix.needsUpdate = true;
      if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true;
    });
  }, [positions]);

  return (
    <>
      <instancedMesh ref={baseRef} args={[undefined, undefined, positions.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="white" />
      </instancedMesh>
      <instancedMesh ref={tarpRef} args={[undefined, undefined, positions.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="white" />
      </instancedMesh>
      <instancedMesh ref={wheelRef} args={[undefined, undefined, positions.length * 2]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 12]} /><meshLambertMaterial color="white" />
      </instancedMesh>
    </>
  );
}

// ─── Traffic lights (synced to the shared signal phase) ──────────────────────
const RED = new Color("#ff2a2a");
const YEL = new Color("#ffd21a");
const GRN = new Color("#2ad24a");

function TrafficLights() {
  const spots = useMemo(() => {
    const pts: { x: number; z: number }[] = [];
    const central = ROAD_LINES.filter((c) => Math.abs(c) <= 130);
    for (const ix of central) for (const iz of central) {
      if (inPark(ix, iz)) continue;
      pts.push({ x: ix + SIDEWALK_OFF + 0.6, z: iz + SIDEWALK_OFF + 0.6 });
    }
    return pts;
  }, []);

  const poleRef = useRef<InstancedMesh>(null!);
  const headRef = useRef<InstancedMesh>(null!);
  const zLampRef = useRef<InstancedMesh>(null!); // controls N-S (z-axis) traffic
  const xLampRef = useRef<InstancedMesh>(null!); // controls E-W (x-axis) traffic
  const n = spots.length;

  useLayoutEffect(() => {
    spots.forEach((p, i) => {
      tmp.position.set(p.x, 2.5, p.z); tmp.rotation.set(0, 0, 0); tmp.scale.set(0.16, 5, 0.16); tmp.updateMatrix();
      poleRef.current.setMatrixAt(i, tmp.matrix);
      tmp.position.set(p.x, 5.2, p.z); tmp.scale.set(0.5, 1.1, 0.5); tmp.updateMatrix();
      headRef.current.setMatrixAt(i, tmp.matrix);
      tmp.position.set(p.x, 5.45, p.z + 0.28); tmp.scale.setScalar(0.18); tmp.updateMatrix();
      zLampRef.current.setMatrixAt(i, tmp.matrix);
      tmp.position.set(p.x + 0.28, 5.45, p.z); tmp.scale.setScalar(0.18); tmp.updateMatrix();
      xLampRef.current.setMatrixAt(i, tmp.matrix);
    });
    poleRef.current.instanceMatrix.needsUpdate = true;
    headRef.current.instanceMatrix.needsUpdate = true;
    zLampRef.current.instanceMatrix.needsUpdate = true;
    xLampRef.current.instanceMatrix.needsUpdate = true;
  }, [spots]);

  useFrame(() => {
    const zGreen = traffic.phase === 0;
    const yellow = traffic.timer < YELLOW_TIME;
    const zc = zGreen ? (yellow ? YEL : GRN) : RED;
    const xc = !zGreen ? (yellow ? YEL : GRN) : RED;
    for (let i = 0; i < n; i++) {
      zLampRef.current.setColorAt(i, zc);
      xLampRef.current.setColorAt(i, xc);
    }
    if (zLampRef.current.instanceColor) zLampRef.current.instanceColor.needsUpdate = true;
    if (xLampRef.current.instanceColor) xLampRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={poleRef} args={[undefined, undefined, n]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 1, 6]} /><meshLambertMaterial color="#3a3f45" />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, n]} castShadow>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial color="#23272c" />
      </instancedMesh>
      <instancedMesh ref={zLampRef} args={[undefined, undefined, n]}>
        <sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial vertexColors />
      </instancedMesh>
      <instancedMesh ref={xLampRef} args={[undefined, undefined, n]}>
        <sphereGeometry args={[1, 8, 6]} /><meshBasicMaterial vertexColors />
      </instancedMesh>
    </>
  );
}

function DistrictLabels() {
  return (
    <>
      {DISTRICTS.map((d) => (
        <Text key={d.id} position={[d.pos[0], 42, d.pos[1]]} fontSize={9} color="#ffffff" outlineWidth={0.5} outlineColor="#000000" anchorX="center">
          {d.label}
        </Text>
      ))}
    </>
  );
}

export default function World() {
  const s = WORLD.size;
  const bldgData = useMemo(() => generateCity().buildings, []);
  return (
    <group>
      {/* Ground and Building Physics */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[s, 1, s]} position={[0, -1, 0]} />
        {bldgData.map((b, i) => (
          <CuboidCollider key={i} args={[b.w / 2, b.h / 2, b.d / 2]} position={[b.x, b.h / 2, b.z]} />
        ))}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[s * 2, s * 2]} />
          <meshLambertMaterial color="#5aaa40" />
        </mesh>
      </RigidBody>

      {/* Sea */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, (-s + WORLD.seaLine) / 2]}>
        <planeGeometry args={[s * 2, WORLD.seaLine + s]} />
        <meshLambertMaterial color="#3898cc" transparent opacity={0.9} />
      </mesh>

      <Streets />
      <LaneDashes />
      <Crosswalks />
      <Buildings />
      <Trees />
      <StreetLamps />
      <MonasPark />
      <StreetProps />
      <Minimarkets />
      <Gerobaks />
      <TrafficLights />

      {/* Monas solid colliders so the player stands on the base, never sinks in */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[19, 1.4, 19]} position={[0, 1.4, 0]} />
        <CuboidCollider args={[11.5, 6, 11.5]} position={[0, 7, 0]} />
        <CuboidCollider args={[4, 60, 4]} position={[0, 67, 0]} />
      </RigidBody>
      <Asset id="monas" position={[0, 0, 0]} />
      <DistrictLabels />
    </group>
  );
}
