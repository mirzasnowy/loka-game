"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, Mesh, MathUtils } from "three";
import { useGame } from "@/core/store";
import { avatar, KNOCKDOWN_MS } from "./avatarState";
import { view } from "@/core/view";

/**
 * First-person viewmodel: the player's own hands (and pistol) drawn in front of
 * the camera. Bobs while walking/running, swings on punch, recoils on fire. Only
 * shown in FPS mode (the third-person body is hidden then). Materials disable
 * depth so the arms never clip into the world.
 */

const SKIN = "#caa176";
const SLEEVE = "#27406e";
const lerp = MathUtils.lerp;

export default function FPViewModel() {
  const grp = useRef<Group>(null!);
  const rArm = useRef<Group>(null!);
  const lArm = useRef<Group>(null!);
  const gunG = useRef<Group>(null!);
  const fistR = useRef<Group>(null!);
  const muzzle = useRef<Mesh>(null!);
  const phase = useRef(0);
  const { camera } = useThree();

  useFrame((_, delta) => {
    const st = useGame.getState();
    const downed = avatar.knockdownAt > 0 && performance.now() - avatar.knockdownAt < KNOCKDOWN_MS;
    const show = view.mode === "fps" && !st.runtime.inVehicleId && !avatar.sitting && !downed;
    grp.current.visible = show;
    if (!show) { if (muzzle.current) muzzle.current.visible = false; return; }

    // lock the rig to the camera
    grp.current.position.copy(camera.position);
    grp.current.quaternion.copy(camera.quaternion);

    const now = performance.now();
    const moving = avatar.speed > 0.3;
    const running = avatar.running && moving;
    if (moving) phase.current += delta * (running ? 13 : 8);
    const bob = moving ? Math.sin(phase.current) * (running ? 0.03 : 0.018) : Math.sin(now * 0.002) * 0.004;
    const sway = moving ? Math.cos(phase.current * 0.5) * 0.012 : 0;
    const armed = avatar.weapon === "pistol";

    // base local poses (camera looks down -Z; -Z = forward)
    let rx = 0.22 + sway, ry = -0.30 + bob, rz = -0.55, rrot = -0.25;
    let lx = -0.26 + sway, ly = -0.34 + bob, lz = -0.58, lrot = -0.18;

    // Pistol: ONE hand (right) brings the gun to the centre, barrel level &
    // pointing at the crosshair (ready-to-fire). Left hand is hidden.
    if (armed) {
      rx = 0.10; ry = -0.16 + bob * 0.5; rz = -0.52; rrot = -0.02;
    }
    if (lArm.current) lArm.current.visible = !armed;

    // PUNCH — alternate hand by combo move; lunge it forward
    const pt = (now - avatar.punchAt) / 230;
    if (!armed && pt >= 0 && pt < 1) {
      const k = Math.sin(pt * Math.PI);
      const rightHand = avatar.comboCount === 1 || avatar.comboCount >= 4;
      if (rightHand) { rz -= 0.42 * k; ry += 0.12 * k; rrot -= 0.5 * k; }
      else { lz -= 0.42 * k; ly += 0.12 * k; lrot -= 0.5 * k; }
    }

    // FIRE — snappy recoil (kick back + muzzle rise) + muzzle flash
    if (armed) {
      const ft = (now - avatar.fireAt) / 130;
      if (ft >= 0 && ft < 1) {
        const k = Math.pow(1 - ft, 2); // fast snap, quick recovery
        rz += 0.16 * k; ry += 0.06 * k; rrot += 0.45 * k;
      }
      if (muzzle.current) muzzle.current.visible = ft >= 0 && ft < 0.35;
    } else if (muzzle.current) muzzle.current.visible = false;

    const sm = 1 - Math.exp(-22 * delta);
    rArm.current.position.set(lerp(rArm.current.position.x, rx, sm), lerp(rArm.current.position.y, ry, sm), lerp(rArm.current.position.z, rz, sm));
    rArm.current.rotation.x = lerp(rArm.current.rotation.x, rrot, sm);
    lArm.current.position.set(lerp(lArm.current.position.x, lx, sm), lerp(lArm.current.position.y, ly, sm), lerp(lArm.current.position.z, lz, sm));
    lArm.current.rotation.x = lerp(lArm.current.rotation.x, lrot, sm);
    if (gunG.current) gunG.current.visible = armed;
    if (fistR.current) fistR.current.visible = !armed;
  });

  return (
    <group ref={grp} renderOrder={1000}>
      {/* Right arm (+ pistol) */}
      <group ref={rArm}>
        <mesh position={[0, -0.18, 0.16]} rotation={[0.6, 0, 0]}>
          <boxGeometry args={[0.1, 0.34, 0.1]} />
          <meshLambertMaterial color={SLEEVE} depthTest={false} />
        </mesh>
        <group ref={fistR}>
          <mesh position={[0, 0.0, -0.02]}>
            <boxGeometry args={[0.12, 0.12, 0.13]} />
            <meshLambertMaterial color={SKIN} depthTest={false} />
          </mesh>
        </group>
        <group ref={gunG} position={[0, 0.0, -0.06]} visible={false}>
          <mesh position={[0, 0, -0.12]}><boxGeometry args={[0.07, 0.12, 0.28]} /><meshLambertMaterial color="#33373d" depthTest={false} /></mesh>
          <mesh position={[0, 0.02, -0.28]}><boxGeometry args={[0.05, 0.06, 0.14]} /><meshLambertMaterial color="#22252a" depthTest={false} /></mesh>
          <mesh position={[0, -0.1, 0.0]} rotation={[0.35, 0, 0]}><boxGeometry args={[0.07, 0.16, 0.09]} /><meshLambertMaterial color="#1a1c20" depthTest={false} /></mesh>
          {/* hand gripping */}
          <mesh position={[0, -0.04, 0.0]}><boxGeometry args={[0.11, 0.11, 0.12]} /><meshLambertMaterial color={SKIN} depthTest={false} /></mesh>
          <mesh ref={muzzle} position={[0, 0.02, -0.4]} visible={false}>
            <sphereGeometry args={[0.07, 6, 5]} /><meshBasicMaterial color="#fff1a0" depthTest={false} />
          </mesh>
        </group>
      </group>

      {/* Left arm */}
      <group ref={lArm}>
        <mesh position={[0, -0.18, 0.16]} rotation={[0.6, 0, 0]}>
          <boxGeometry args={[0.1, 0.34, 0.1]} />
          <meshLambertMaterial color={SLEEVE} depthTest={false} />
        </mesh>
        <mesh position={[0, 0.0, -0.02]}>
          <boxGeometry args={[0.12, 0.12, 0.13]} />
          <meshLambertMaterial color={SKIN} depthTest={false} />
        </mesh>
      </group>
    </group>
  );
}
