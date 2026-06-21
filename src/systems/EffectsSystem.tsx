"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedMesh, Object3D } from "three";
import { useGame } from "@/core/store";
import { sparks, moneyDrops } from "./effects";

/**
 * Renders impact sparks (vehicle crashes) and dropped money (from kills), and
 * lets the player walk over coins to collect them. Pooled instanced meshes.
 */

const SPARK_MAX = 48;
const SPARK_MS = 320;
const COIN_MAX = 60;
const COIN_TTL = 45000;
const PICKUP_R = 2.0;

const dummy = new Object3D();

export default function EffectsSystem() {
  const sparkRef = useRef<InstancedMesh>(null!);
  const coinRef = useRef<InstancedMesh>(null!);

  useFrame(() => {
    const now = performance.now();
    const st = useGame.getState();
    const [px, , pz] = st.runtime.pos;

    // ── sparks ──
    const sm = sparkRef.current;
    for (let i = 0; i < SPARK_MAX; i++) {
      const s = sparks[sparks.length - SPARK_MAX + i]; // show most recent
      if (s && now - s.at < SPARK_MS) {
        const k = (now - s.at) / SPARK_MS;
        dummy.position.set(s.x, s.y + k * 0.6, s.z);
        dummy.scale.setScalar(0.5 - k * 0.45);
        dummy.updateMatrix();
        sm.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.position.set(0, -9999, 0); dummy.scale.setScalar(0.0001); dummy.updateMatrix();
        sm.setMatrixAt(i, dummy.matrix);
      }
    }
    sm.instanceMatrix.needsUpdate = true;

    // ── coins (money drops) + pickup ──
    const cm = coinRef.current;
    for (let i = moneyDrops.length - 1; i >= 0; i--) {
      const d = moneyDrops[i];
      if (now - d.born > COIN_TTL) { moneyDrops.splice(i, 1); continue; }
      if (Math.hypot(px - d.x, pz - d.z) < PICKUP_R && !st.runtime.inVehicleId) {
        useGame.getState().addMoney(d.amt);
        useGame.getState().notify(`+Rp ${d.amt.toLocaleString("id-ID")} 💰`);
        moneyDrops.splice(i, 1);
      }
    }
    for (let i = 0; i < COIN_MAX; i++) {
      const d = moneyDrops[i];
      if (d) {
        const bob = Math.sin(now * 0.004 + i) * 0.1 + 0.5;
        dummy.position.set(d.x, bob, d.z);
        dummy.rotation.set(Math.PI / 2, now * 0.004 + i, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        cm.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.position.set(0, -9999, 0); dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(0.0001); dummy.updateMatrix();
        cm.setMatrixAt(i, dummy.matrix);
      }
    }
    cm.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={sparkRef} args={[undefined, undefined, SPARK_MAX]} frustumCulled={false}>
        <sphereGeometry args={[1, 6, 5]} />
        <meshBasicMaterial color="#ffd24a" />
      </instancedMesh>
      <instancedMesh ref={coinRef} args={[undefined, undefined, COIN_MAX]} frustumCulled={false} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.07, 14]} />
        <meshStandardMaterial color="#ffcf3a" emissive="#a06800" emissiveIntensity={0.4} metalness={0.6} roughness={0.3} />
      </instancedMesh>
    </>
  );
}
