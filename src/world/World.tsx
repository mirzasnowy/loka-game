"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { Object3D, Color, InstancedMesh } from "three";
import { Text } from "@react-three/drei";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import { Asset } from "@/core/assetRegistry";
import { WORLD, DISTRICTS } from "./worldConfig";
import { generateCity } from "./proc";

const tmp = new Object3D();
const tmpColor = new Color();

// ─── Buildings ────────────────────────────────────────────────────────────────
function Buildings() {
  const ref = useRef<InstancedMesh>(null!);
  const roofRef = useRef<InstancedMesh>(null!);
  const data = useMemo(() => generateCity().buildings, []);

  useLayoutEffect(() => {
    data.forEach((b, i) => {
      // Main body
      tmp.position.set(b.x, b.h / 2, b.z);
      tmp.scale.set(b.w, b.h, b.d);
      tmp.rotation.set(0, 0, 0);
      tmp.updateMatrix();
      ref.current.setMatrixAt(i, tmp.matrix);
      ref.current.setColorAt(i, tmpColor.set(b.color));

      // Rooftop cap (darker / contrasting color)
      tmp.position.set(b.x, b.h + 0.4, b.z);
      tmp.scale.set(b.w * 0.88, 0.9, b.d * 0.88);
      tmp.updateMatrix();
      roofRef.current.setMatrixAt(i, tmp.matrix);
      // Roof: desaturated/darker version of building color
      const rc = new Color(b.color).multiplyScalar(0.65);
      roofRef.current.setColorAt(i, rc);
    });
    ref.current.instanceMatrix.needsUpdate = true;
    if (ref.current.instanceColor) ref.current.instanceColor.needsUpdate = true;
    roofRef.current.instanceMatrix.needsUpdate = true;
    if (roofRef.current.instanceColor) roofRef.current.instanceColor.needsUpdate = true;
  }, [data]);

  return (
    <>
      <instancedMesh ref={ref} args={[undefined, undefined, data.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial vertexColors />
      </instancedMesh>
      <instancedMesh ref={roofRef} args={[undefined, undefined, data.length]} castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial vertexColors />
      </instancedMesh>
    </>
  );
}

// ─── Roads ────────────────────────────────────────────────────────────────────
function Roads() {
  const ref = useRef<InstancedMesh>(null!);
  const data = useMemo(() => generateCity().roads, []);
  useLayoutEffect(() => {
    data.forEach((r, i) => {
      tmp.position.set(r.x, 0.02, r.z);
      tmp.scale.set(WORLD.cell, 1, WORLD.cell);
      tmp.rotation.set(-Math.PI / 2, 0, 0);
      tmp.updateMatrix();
      ref.current.setMatrixAt(i, tmp.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [data]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, data.length]} receiveShadow>
      <planeGeometry args={[1, 1]} />
      <meshLambertMaterial color="#353535" />
    </instancedMesh>
  );
}

// ─── Sidewalks ────────────────────────────────────────────────────────────────
function Sidewalks() {
  const ref = useRef<InstancedMesh>(null!);
  const data = useMemo(() => generateCity().roads, []);
  useLayoutEffect(() => {
    data.forEach((r, i) => {
      // Narrow strip at the edge of road tiles
      tmp.position.set(r.x, 0.03, r.z);
      tmp.scale.set(WORLD.cell, 1, WORLD.cell * 0.18);
      tmp.rotation.set(-Math.PI / 2, 0, 0);
      tmp.updateMatrix();
      ref.current.setMatrixAt(i, tmp.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  }, [data]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, data.length]} receiveShadow>
      <planeGeometry args={[1, 1]} />
      <meshLambertMaterial color="#c8c4bc" />
    </instancedMesh>
  );
}

// ─── Trees ───────────────────────────────────────────────────────────────────
// 3 instanced meshes: trunks, lower canopy, upper canopy
const TREE_CANOPY_COLORS = ["#2d7d46", "#3b9b5a", "#246338", "#4db86a", "#1e5c34"];
const TREE_CANOPY2_COLORS = ["#3b9b5a", "#4db86a", "#57c872", "#2d7d46", "#38a860"];

function Trees() {
  const trunkRef = useRef<InstancedMesh>(null!);
  const canopy1Ref = useRef<InstancedMesh>(null!);
  const canopy2Ref = useRef<InstancedMesh>(null!);
  const data = useMemo(() => generateCity().trees, []);

  useLayoutEffect(() => {
    data.forEach((t, i) => {
      const s = t.scale;
      const trunkH = 3 * s;
      const trunkR = 0.22 * s;

      // Trunk
      tmp.position.set(t.x, trunkH / 2, t.z);
      tmp.rotation.set(0, 0, 0);
      tmp.scale.set(trunkR * 2, trunkH, trunkR * 2);
      tmp.updateMatrix();
      trunkRef.current.setMatrixAt(i, tmp.matrix);
      trunkRef.current.setColorAt(i, tmpColor.set("#6b4423"));

      // Lower canopy (wider cone)
      tmp.position.set(t.x, trunkH + 1.6 * s, t.z);
      tmp.scale.set(2.2 * s, 3.0 * s, 2.2 * s);
      tmp.updateMatrix();
      canopy1Ref.current.setMatrixAt(i, tmp.matrix);
      canopy1Ref.current.setColorAt(i, tmpColor.set(TREE_CANOPY_COLORS[t.variant % 5]));

      // Upper canopy (narrower cone)
      tmp.position.set(t.x, trunkH + 3.5 * s, t.z);
      tmp.scale.set(1.4 * s, 2.4 * s, 1.4 * s);
      tmp.updateMatrix();
      canopy2Ref.current.setMatrixAt(i, tmp.matrix);
      canopy2Ref.current.setColorAt(i, tmpColor.set(TREE_CANOPY2_COLORS[t.variant % 5]));
    });
    [trunkRef, canopy1Ref, canopy2Ref].forEach((r) => {
      r.current.instanceMatrix.needsUpdate = true;
      if (r.current.instanceColor) r.current.instanceColor.needsUpdate = true;
    });
  }, [data]);

  return (
    <>
      <instancedMesh ref={trunkRef} args={[undefined, undefined, data.length]} castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.7, 1, 7]} />
        <meshLambertMaterial vertexColors />
      </instancedMesh>
      <instancedMesh ref={canopy1Ref} args={[undefined, undefined, data.length]} castShadow receiveShadow>
        <coneGeometry args={[0.5, 1, 7]} />
        <meshLambertMaterial vertexColors />
      </instancedMesh>
      <instancedMesh ref={canopy2Ref} args={[undefined, undefined, data.length]} castShadow receiveShadow>
        <coneGeometry args={[0.5, 1, 7]} />
        <meshLambertMaterial vertexColors />
      </instancedMesh>
    </>
  );
}

// ─── Street Lamps ─────────────────────────────────────────────────────────────
function StreetLamps() {
  // Place lamps at road intersections (every WORLD.roadEvery grid lines)
  const positions = useMemo(() => {
    const { size, cell, roadEvery, seaLine } = WORLD;
    const pts: [number, number][] = [];
    for (let x = -size; x <= size; x += cell * roadEvery) {
      for (let z = -size; z <= size; z += cell * roadEvery) {
        if (z < seaLine + 20) continue;
        if (Math.hypot(x, z) < 40) continue; // skip Monas plaza
        pts.push([x + 4, z + 4]);
        pts.push([x - 4, z + 4]);
        pts.push([x + 4, z - 4]);
        pts.push([x - 4, z - 4]);
      }
    }
    return pts;
  }, []);

  const poleRef = useRef<InstancedMesh>(null!);
  const globeRef = useRef<InstancedMesh>(null!);

  useLayoutEffect(() => {
    positions.forEach(([x, z], i) => {
      tmp.position.set(x, 2, z);
      tmp.rotation.set(0, 0, 0);
      tmp.scale.set(0.12, 4, 0.12);
      tmp.updateMatrix();
      poleRef.current.setMatrixAt(i, tmp.matrix);

      tmp.position.set(x, 4.2, z);
      tmp.scale.setScalar(0.28);
      tmp.updateMatrix();
      globeRef.current.setMatrixAt(i, tmp.matrix);
    });
    poleRef.current.instanceMatrix.needsUpdate = true;
    globeRef.current.instanceMatrix.needsUpdate = true;
  }, [positions]);

  return (
    <>
      <instancedMesh ref={poleRef} args={[undefined, undefined, positions.length]} castShadow>
        <cylinderGeometry args={[0.5, 0.6, 1, 6]} />
        <meshLambertMaterial color="#888890" />
      </instancedMesh>
      <instancedMesh ref={globeRef} args={[undefined, undefined, positions.length]}>
        <sphereGeometry args={[1, 6, 5]} />
        <meshLambertMaterial color="#fff8d0" emissive="#ffe060" emissiveIntensity={0.9} />
      </instancedMesh>
    </>
  );
}

// ─── Monas Park ───────────────────────────────────────────────────────────────
function MonasPark() {
  return (
    <group>
      {/* Circular green park */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} receiveShadow>
        <circleGeometry args={[32, 32]} />
        <meshLambertMaterial color="#4a9c38" />
      </mesh>

      {/* Round pathway ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[20, 23, 48]} />
        <meshLambertMaterial color="#c8c0a8" />
      </mesh>

      {/* Inner circle path */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[10, 12, 32]} />
        <meshLambertMaterial color="#c8c0a8" />
      </mesh>

      {/* Central plaza */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[8, 16]} />
        <meshLambertMaterial color="#d4cebA" />
      </mesh>

      {/* Fountain pool */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <circleGeometry args={[3.5, 20]} />
        <meshLambertMaterial color="#5ab0d0" />
      </mesh>
      {/* Fountain basin rim */}
      <mesh position={[0, 0.25, 0]}>
        <torusGeometry args={[3.5, 0.2, 6, 20]} />
        <meshLambertMaterial color="#d0c8b0" />
      </mesh>
      {/* Fountain pillar */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.18, 0.25, 1.5, 8]} />
        <meshLambertMaterial color="#d0c8b0" />
      </mesh>
      {/* Fountain water spray sphere */}
      <mesh position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.5, 8, 6]} />
        <meshLambertMaterial color="#80d0f0" transparent opacity={0.7} />
      </mesh>

      {/* Benches around inner path — 8 benches */}
      {Array.from({ length: 8 }, (_, k) => {
        const a = (k / 8) * Math.PI * 2;
        const r = 16;
        return (
          <group key={k} position={[Math.cos(a) * r, 0, Math.sin(a) * r]} rotation={[0, a + Math.PI / 2, 0]}>
            {/* Seat */}
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[1.2, 0.1, 0.4]} />
              <meshLambertMaterial color="#8b5e3c" />
            </mesh>
            {/* Backrest */}
            <mesh position={[0, 0.8, -0.15]}>
              <boxGeometry args={[1.2, 0.4, 0.08]} />
              <meshLambertMaterial color="#7a5030" />
            </mesh>
            {/* Legs */}
            {[-0.5, 0.5].map((x) => (
              <mesh key={x} position={[x, 0.25, 0]}>
                <boxGeometry args={[0.08, 0.5, 0.38]} />
                <meshLambertMaterial color="#6a4020" />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Flagpole */}
      <mesh position={[6, 7, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 14, 6]} />
        <meshLambertMaterial color="#d0ccc0" />
      </mesh>
      {/* Indonesian flag */}
      <mesh position={[6 + 0.85, 13.2, 0]}>
        <planeGeometry args={[1.7, 0.55]} />
        <meshLambertMaterial color="#cb2026" side={2} />
      </mesh>
      <mesh position={[6 + 0.85, 12.82, 0]}>
        <planeGeometry args={[1.7, 0.55]} />
        <meshLambertMaterial color="#ffffff" side={2} />
      </mesh>
    </group>
  );
}

// ─── District Labels ──────────────────────────────────────────────────────────
function DistrictLabels() {
  return (
    <>
      {DISTRICTS.map((d) => (
        <Text
          key={d.id}
          position={[d.pos[0], 40, d.pos[1]]}
          fontSize={9}
          color="#ffffff"
          outlineWidth={0.5}
          outlineColor="#000000"
          anchorX="center"
        >
          {d.label}
        </Text>
      ))}
    </>
  );
}

// ─── World root ───────────────────────────────────────────────────────────────
export default function World() {
  const s = WORLD.size;
  return (
    <group>
      {/* Ground — thick collider (top face at y=0) */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[s, 1, s]} position={[0, -1, 0]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[s * 2, s * 2]} />
          <meshLambertMaterial color="#5d9c4a" />
        </mesh>
      </RigidBody>

      {/* Sea */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, (-s + WORLD.seaLine) / 2]}>
        <planeGeometry args={[s * 2, WORLD.seaLine + s]} />
        <meshLambertMaterial color="#3a8fbf" transparent opacity={0.88} />
      </mesh>

      <Roads />
      <Sidewalks />
      <Buildings />
      <Trees />
      <StreetLamps />

      {/* Monas landmark */}
      <MonasPark />
      <Asset id="monas" position={[0, 0, 0]} />

      <DistrictLabels />
    </group>
  );
}
