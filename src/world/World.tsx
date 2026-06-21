"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Object3D, Color, InstancedMesh } from "three";
import { Text } from "@react-three/drei";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Asset } from "@/core/assetRegistry";
import { WORLD, DISTRICTS } from "./worldConfig";
import { generateCity } from "./proc";
import {
  ROAD_LINES, ROAD_HALF, SIDEWALK_OFF, SIDEWALK_W, PARK_RADIUS, MAP, inPark,
} from "./grid";

const tmp = new Object3D();
const tmpColor = new Color();

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
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial vertexColors />
      </instancedMesh>
      <instancedMesh ref={roofRef} args={[undefined, undefined, n]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial vertexColors />
      </instancedMesh>
      <instancedMesh ref={winRef} args={[undefined, undefined, n]}>
        <planeGeometry args={[1, 1]} /><meshLambertMaterial vertexColors transparent opacity={0.62} />
      </instancedMesh>
      <instancedMesh ref={win2Ref} args={[undefined, undefined, n]}>
        <planeGeometry args={[1, 1]} /><meshLambertMaterial vertexColors transparent opacity={0.62} />
      </instancedMesh>
      <instancedMesh ref={doorRef} args={[undefined, undefined, n]}>
        <planeGeometry args={[1, 1]} /><meshLambertMaterial vertexColors transparent opacity={0.85} />
      </instancedMesh>
      <instancedMesh ref={acRef} args={[undefined, undefined, n]} castShadow>
        <boxGeometry args={[1, 1, 1]} /><meshLambertMaterial vertexColors />
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

  useLayoutEffect(() => {
    data.forEach((t, i) => {
      const s = t.scale;
      const th = 2.8 * s, tr = 0.20 * s, v = t.variant % 5;

      tmp.position.set(t.x, th / 2, t.z); tmp.rotation.set(0, 0, 0);
      tmp.scale.set(tr * 2, th, tr * 2); tmp.updateMatrix();
      trunkRef.current.setMatrixAt(i, tmp.matrix);
      trunkRef.current.setColorAt(i, tmpColor.set("#6b4018"));

      tmp.position.set(t.x, th + 1.1 * s, t.z);
      tmp.scale.set(2.6 * s, 1.8 * s, 2.6 * s); tmp.updateMatrix();
      botRef.current.setMatrixAt(i, tmp.matrix);
      botRef.current.setColorAt(i, tmpColor.set(CANOPY_BOT[v]));

      tmp.position.set(t.x, th + 2.4 * s, t.z);
      tmp.scale.set(2.1 * s, 1.7 * s, 2.1 * s); tmp.updateMatrix();
      midRef.current.setMatrixAt(i, tmp.matrix);
      midRef.current.setColorAt(i, tmpColor.set(CANOPY_MID[v]));

      tmp.position.set(t.x, th + 3.5 * s, t.z);
      tmp.scale.set(1.4 * s, 1.4 * s, 1.4 * s); tmp.updateMatrix();
      topRef.current.setMatrixAt(i, tmp.matrix);
      topRef.current.setColorAt(i, tmpColor.set(CANOPY_TOP[v]));

      tmp.position.set(t.x + 0.5 * s, 0.4 * s, t.z + 0.35 * s);
      tmp.scale.setScalar(0.7 * s); tmp.updateMatrix();
      bushRef.current.setMatrixAt(i, tmp.matrix);
      bushRef.current.setColorAt(i, tmpColor.set("#1d7034"));
    });
    [trunkRef, botRef, midRef, topRef, bushRef].forEach((r) => {
      r.current.instanceMatrix.needsUpdate = true;
      if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true;
    });
  }, [data]);

  return (
    <>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, data.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.7, 1, 7]} /><meshLambertMaterial vertexColors />
      </instancedMesh>
      <instancedMesh ref={botRef} args={[undefined, undefined, data.length]} castShadow>
        <sphereGeometry args={[1, 8, 6]} /><meshLambertMaterial vertexColors />
      </instancedMesh>
      <instancedMesh ref={midRef} args={[undefined, undefined, data.length]} castShadow>
        <sphereGeometry args={[1, 8, 6]} /><meshLambertMaterial vertexColors />
      </instancedMesh>
      <instancedMesh ref={topRef} args={[undefined, undefined, data.length]} castShadow>
        <sphereGeometry args={[1, 7, 5]} /><meshLambertMaterial vertexColors />
      </instancedMesh>
      <instancedMesh ref={bushRef} args={[undefined, undefined, data.length]} castShadow>
        <sphereGeometry args={[1, 6, 5]} /><meshLambertMaterial vertexColors />
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
        <meshLambertMaterial color="#fff8e0" emissive="#ffe060" emissiveIntensity={1.0} />
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
  return (
    <group>
      {/* Ground */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[s, 1, s]} position={[0, -1, 0]} />
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

      <Asset id="monas" position={[0, 0, 0]} />
      <DistrictLabels />
    </group>
  );
}
