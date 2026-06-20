"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedMesh, Object3D, Color, Vector3, MathUtils } from "three";
import { useGame } from "@/core/store";
import { WORLD } from "@/world/worldConfig";

/**
 * Crowd of pedestrians. Pooled + recycled around the player (spawn ring in,
 * despawn ring out) so the world feels alive without ever simulating the whole
 * city. Rendered as one instanced mesh = one draw call. Archetypes from the
 * concept art (office worker, student, ojol, elderly...) are colour-coded; swap
 * to per-archetype GLBs later by splitting into multiple instanced meshes.
 */

const MAX = 60;
const SPAWN_RING = 70; // spawn within this radius of player
const DESPAWN = 120; // recycle beyond this

type State = "walk" | "idle";
interface Agent {
  pos: Vector3;
  dest: Vector3;
  speed: number;
  state: State;
  timer: number;
  color: Color;
  rot: number;
}

const ARCHETYPES = ["#5a8f5a", "#dddddd", "#d04f4f", "#2b8a3e", "#8a8a8a", "#34507a"];

const dummy = new Object3D();
const dir = new Vector3();

function randomDestNear(p: Vector3, out: Vector3) {
  const a = Math.random() * Math.PI * 2;
  const r = 10 + Math.random() * 40;
  out.set(p.x + Math.cos(a) * r, 0, p.z + Math.sin(a) * r);
  out.z = Math.max(WORLD.seaLine + 5, out.z);
  return out;
}

export default function NPCSystem() {
  const ref = useRef<InstancedMesh>(null!);

  const agents = useMemo<Agent[]>(() => {
    const [px, , pz] = useGame.getState().runtime.pos;
    const player = new Vector3(px, 0, pz);
    return Array.from({ length: MAX }, () => {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * SPAWN_RING;
      const pos = new Vector3(player.x + Math.cos(a) * r, 0, player.z + Math.sin(a) * r);
      const agent: Agent = {
        pos,
        dest: randomDestNear(pos, new Vector3()),
        speed: 1.2 + Math.random() * 1.2,
        state: "walk",
        timer: Math.random() * 4,
        color: new Color(ARCHETYPES[(Math.random() * ARCHETYPES.length) | 0]),
        rot: 0,
      };
      return agent;
    });
  }, []);

  useFrame((_, delta) => {
    const st = useGame.getState();
    if (st.paused) return;
    const mesh = ref.current;
    const [px, , pz] = st.runtime.pos;

    // Crowd density by time of day — quieter at night.
    const density =
      st.timeOfDay === "night" ? 0.4 : st.timeOfDay === "afternoon" ? 1 : 0.8;
    const activeCount = Math.floor(MAX * density);

    for (let i = 0; i < MAX; i++) {
      const a = agents[i];

      if (i >= activeCount) {
        dummy.position.set(0, -1000, 0);
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }

      const distToPlayer = Math.hypot(a.pos.x - px, a.pos.z - pz);
      if (distToPlayer > DESPAWN) {
        // recycle near player on the far-from-camera side
        const ang = Math.random() * Math.PI * 2;
        a.pos.set(px + Math.cos(ang) * SPAWN_RING, 0, pz + Math.sin(ang) * SPAWN_RING);
        a.pos.z = Math.max(WORLD.seaLine + 5, a.pos.z);
        randomDestNear(a.pos, a.dest);
        a.state = "walk";
      }

      a.timer -= delta;
      if (a.state === "walk") {
        dir.subVectors(a.dest, a.pos);
        const d = dir.length();
        if (d < 1 || a.timer <= 0) {
          a.state = Math.random() < 0.4 ? "idle" : "walk";
          a.timer = 2 + Math.random() * 4;
          if (a.state === "walk") randomDestNear(a.pos, a.dest);
        } else {
          dir.multiplyScalar((a.speed * delta) / d);
          a.pos.add(dir);
          a.rot = MathUtils.lerp(a.rot, Math.atan2(dir.x, dir.z), 0.2);
        }
      } else if (a.timer <= 0) {
        a.state = "walk";
        a.timer = 3 + Math.random() * 5;
        randomDestNear(a.pos, a.dest);
      }

      dummy.position.set(a.pos.x, 0.75, a.pos.z);
      dummy.rotation.set(0, a.rot, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, a.color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, MAX]} castShadow frustumCulled={false}>
      <capsuleGeometry args={[0.28, 0.9, 4, 8]} />
      <meshStandardMaterial vertexColors />
    </instancedMesh>
  );
}
