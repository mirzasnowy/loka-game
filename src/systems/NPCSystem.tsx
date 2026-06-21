"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedMesh, Object3D, Color, Vector3, MathUtils } from "three";
import { useGame } from "@/core/store";
import { WORLD } from "@/world/worldConfig";

const MAX = 60;
const SPAWN_RING = 70;
const DESPAWN = 120;

type State = "walk" | "idle";
interface Agent {
  pos: Vector3;
  dest: Vector3;
  speed: number;
  state: State;
  timer: number;
  rot: number;
  archetype: number;
}

// shirt / skin / pants per archetype
const ARCHETYPES = [
  { shirt: "#ffffff", skin: "#c8956b", pants: "#1a3080" }, // student
  { shirt: "#e8e8e8", skin: "#e0b890", pants: "#1a1a2a" }, // office
  { shirt: "#2b8a3e", skin: "#c8956b", pants: "#181818" }, // ojol
  { shirt: "#6080b0", skin: "#e0b890", pants: "#1c2530" }, // police
  { shirt: "#a0907a", skin: "#d8a870", pants: "#3a3028" }, // elderly
  { shirt: "#e87038", skin: "#c8956b", pants: "#3a2010" }, // vendor
];

const dummy = new Object3D();
const dir = new Vector3();
const cSkin = new Color();
const cShirt = new Color();
const cPants = new Color();

function randomDestNear(p: Vector3, out: Vector3) {
  const a = Math.random() * Math.PI * 2;
  const r = 10 + Math.random() * 40;
  out.set(p.x + Math.cos(a) * r, 0, p.z + Math.sin(a) * r);
  out.z = Math.max(WORLD.seaLine + 5, out.z);
  return out;
}

export default function NPCSystem() {
  const headRef  = useRef<InstancedMesh>(null!);
  const bodyRef  = useRef<InstancedMesh>(null!);
  const legsRef  = useRef<InstancedMesh>(null!);

  const agents = useMemo<Agent[]>(() => {
    const [px, , pz] = useGame.getState().runtime.pos;
    const player = new Vector3(px, 0, pz);
    return Array.from({ length: MAX }, (_, i) => {
      const a = (i / MAX) * Math.PI * 2;
      const r = Math.random() * SPAWN_RING;
      const pos = new Vector3(player.x + Math.cos(a) * r, 0, player.z + Math.sin(a) * r);
      return {
        pos,
        dest: randomDestNear(pos, new Vector3()),
        speed: 1.2 + Math.random() * 1.2,
        state: "walk" as State,
        timer: Math.random() * 4,
        rot: 0,
        archetype: (Math.random() * ARCHETYPES.length) | 0,
      };
    });
  }, []);

  useFrame((_, delta) => {
    const st = useGame.getState();
    if (st.paused) return;
    const [px, , pz] = st.runtime.pos;

    const density = st.timeOfDay === "night" ? 0.4 : st.timeOfDay === "afternoon" ? 1 : 0.8;
    const activeCount = Math.floor(MAX * density);

    const HIDE = -2000;

    for (let i = 0; i < MAX; i++) {
      const ag = agents[i];

      if (i >= activeCount) {
        dummy.position.set(0, HIDE, 0);
        dummy.scale.setScalar(0.0001);
        dummy.updateMatrix();
        headRef.current.setMatrixAt(i, dummy.matrix);
        bodyRef.current.setMatrixAt(i, dummy.matrix);
        legsRef.current.setMatrixAt(i, dummy.matrix);
        continue;
      }

      // Recycle far agents
      if (Math.hypot(ag.pos.x - px, ag.pos.z - pz) > DESPAWN) {
        const ang = Math.random() * Math.PI * 2;
        ag.pos.set(px + Math.cos(ang) * SPAWN_RING, 0, pz + Math.sin(ang) * SPAWN_RING);
        ag.pos.z = Math.max(WORLD.seaLine + 5, ag.pos.z);
        randomDestNear(ag.pos, ag.dest);
        ag.state = "walk";
      }

      // State machine
      ag.timer -= delta;
      if (ag.state === "walk") {
        dir.subVectors(ag.dest, ag.pos);
        const d = dir.length();
        if (d < 1 || ag.timer <= 0) {
          ag.state = Math.random() < 0.4 ? "idle" : "walk";
          ag.timer = 2 + Math.random() * 4;
          if (ag.state === "walk") randomDestNear(ag.pos, ag.dest);
        } else {
          dir.multiplyScalar((ag.speed * delta) / d);
          ag.pos.add(dir);
          ag.rot = MathUtils.lerp(ag.rot, Math.atan2(dir.x, dir.z), 0.2);
        }
      } else if (ag.timer <= 0) {
        ag.state = "walk";
        ag.timer = 3 + Math.random() * 5;
        randomDestNear(ag.pos, ag.dest);
      }

      const { shirt, skin, pants } = ARCHETYPES[ag.archetype];
      const x = ag.pos.x, z = ag.pos.z, ry = ag.rot;

      // Head
      dummy.position.set(x, 1.58, z);
      dummy.rotation.set(0, ry, 0);
      dummy.scale.set(0.38, 0.38, 0.36);
      dummy.updateMatrix();
      headRef.current.setMatrixAt(i, dummy.matrix);
      headRef.current.setColorAt(i, cSkin.set(skin));

      // Body (torso)
      dummy.position.set(x, 1.10, z);
      dummy.scale.set(0.44, 0.60, 0.28);
      dummy.updateMatrix();
      bodyRef.current.setMatrixAt(i, dummy.matrix);
      bodyRef.current.setColorAt(i, cShirt.set(shirt));

      // Legs
      dummy.position.set(x, 0.44, z);
      dummy.scale.set(0.38, 0.52, 0.22);
      dummy.updateMatrix();
      legsRef.current.setMatrixAt(i, dummy.matrix);
      legsRef.current.setColorAt(i, cPants.set(pants));
    }

    headRef.current.instanceMatrix.needsUpdate = true;
    bodyRef.current.instanceMatrix.needsUpdate = true;
    legsRef.current.instanceMatrix.needsUpdate = true;
    if (headRef.current.instanceColor)  headRef.current.instanceColor.needsUpdate = true;
    if (bodyRef.current.instanceColor)  bodyRef.current.instanceColor.needsUpdate = true;
    if (legsRef.current.instanceColor)  legsRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <>
      {/* Heads */}
      <instancedMesh ref={headRef} args={[undefined, undefined, MAX]} castShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial vertexColors />
      </instancedMesh>
      {/* Torsos */}
      <instancedMesh ref={bodyRef} args={[undefined, undefined, MAX]} castShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial vertexColors />
      </instancedMesh>
      {/* Legs */}
      <instancedMesh ref={legsRef} args={[undefined, undefined, MAX]} castShadow frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshLambertMaterial vertexColors />
      </instancedMesh>
    </>
  );
}
