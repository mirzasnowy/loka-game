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

/** Instanced building boxes — one draw call for the whole skyline. */
function Buildings() {
  const ref = useRef<InstancedMesh>(null!);
  const data = useMemo(() => generateCity().buildings, []);

  useLayoutEffect(() => {
    const mesh = ref.current;
    data.forEach((b, i) => {
      tmp.position.set(b.x, b.h / 2, b.z);
      tmp.scale.set(b.w, b.h, b.d);
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
      mesh.setColorAt(i, tmpColor.set(b.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [data]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, data.length]} castShadow receiveShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial vertexColors />
    </instancedMesh>
  );
}

/** Instanced flat road tiles. */
function Roads() {
  const ref = useRef<InstancedMesh>(null!);
  const data = useMemo(() => generateCity().roads, []);
  useLayoutEffect(() => {
    const mesh = ref.current;
    data.forEach((r, i) => {
      tmp.position.set(r.x, 0.05, r.z);
      tmp.scale.set(WORLD.cell, 1, WORLD.cell);
      tmp.rotation.set(-Math.PI / 2, 0, 0);
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [data]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, data.length]} receiveShadow>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial color="#3a3d42" />
    </instancedMesh>
  );
}

function DistrictLabels() {
  return (
    <>
      {DISTRICTS.map((d) => (
        <Text
          key={d.id}
          position={[d.pos[0], 40, d.pos[1]]}
          fontSize={9}
          color="#ffffff"
          outlineWidth={0.4}
          outlineColor="#000000"
          anchorX="center"
        >
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
      {/* Ground: thick explicit collider (top face at y=0) + flat visual plane. */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[s, 1, s]} position={[0, -1, 0]} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[s * 2, s * 2]} />
          <meshStandardMaterial color="#7da06b" />
        </mesh>
      </RigidBody>

      {/* Sea: visual only, fills the strip from north edge to the coastline. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, (-s + WORLD.seaLine) / 2]}>
        <planeGeometry args={[s * 2, WORLD.seaLine + s]} />
        <meshStandardMaterial color="#3f7fa6" transparent opacity={0.9} />
      </mesh>

      <Roads />
      <Buildings />
      <Asset id="monas" position={[0, 0, 0]} />
      <DistrictLabels />
    </group>
  );
}
