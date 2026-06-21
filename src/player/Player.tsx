"use client";

import { useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { RigidBody, CapsuleCollider, type RapierRigidBody } from "@react-three/rapier";
import { Vector3, Quaternion, Euler, MathUtils, Group } from "three";
import { useGame } from "@/core/store";
import { input } from "@/core/input";
import { drivables } from "@/systems/registries";
import PlayerModel from "./PlayerModel";
import { avatar } from "./avatarState";

/**
 * Single control + camera authority. On foot it drives the capsule rigidbody;
 * while `inVehicleId` is set it drives the active vehicle's rigidbody instead,
 * parks the capsule, and follows the vehicle. One place owns input → motion →
 * camera, so nothing fights over the camera or the controls.
 */

const WALK = 4;
const RUN = 8;
const JUMP = 6;
const DODGE_IMPULSE = 9;
const DODGE_IFRAME_MS = 450;

const moveDir = new Vector3();
const camTarget = new Vector3();
const camWanted = new Vector3();
const q = new Quaternion();
const e = new Euler();
const fwd = new Vector3();

export default function Player() {
  const body = useRef<RapierRigidBody>(null!);
  const visual = useRef<Group>(null!);
  const yaw = useRef(0); // camera orbit (horizontal)
  const pitch = useRef(0.25); // camera tilt (vertical)
  const faceYaw = useRef(0); // where the character model points
  const wasDriving = useRef(false);
  const { camera } = useThree();
  const [start] = useState<[number, number, number]>(() => useGame.getState().runtime.pos);

  useFrame((_, delta) => {
    input.bind();
    const st = useGame.getState();
    if (st.paused) return;
    const b = body.current;
    if (!b) return;

    yaw.current -= input.takeLook();
    pitch.current = Math.max(-0.35, Math.min(1.1, pitch.current - input.takeLookY()));
    const driving = st.runtime.inVehicleId;

    // --- enter/exit transitions ---
    if (driving && !wasDriving.current) {
      b.setEnabled(false);
      if (visual.current) visual.current.visible = false;
    }
    if (!driving && wasDriving.current) {
      b.setEnabled(true);
      // drop the player just beside where the vehicle is now
      const [vx, vy, vz] = st.runtime.pos;
      b.setTranslation({ x: vx + 2, y: vy + 1, z: vz }, true);
      b.setLinvel({ x: 0, y: 0, z: 0 }, true);
      if (visual.current) visual.current.visible = true;
    }
    wasDriving.current = !!driving;

    if (driving) {
      this_driveVehicle(driving, delta, yaw, camera);
      return;
    }

    // --- on foot ---
    const mx = input.move.x;
    const my = input.move.y;
    moveDir.set(mx, 0, -my);
    const moving = moveDir.lengthSq() > 0.001;
    if (moving) moveDir.normalize().applyAxisAngle(new Vector3(0, 1, 0), yaw.current);

    const lowStamina = st.player.stamina <= 1;
    const running = input.run && moving && !lowStamina;
    const speed = running ? RUN : WALK;

    const v = b.linvel();
    b.setLinvel({ x: moveDir.x * speed, y: v.y, z: moveDir.z * speed }, true);
    const grounded = Math.abs(v.y) < 0.12;

    // Jump (grounded ~ vertical velocity near zero). ponytail: velocity check,
    // upgrade to a downward ray if coyote-time/double-jump bugs appear.
    if (input.consume("jump") && grounded) {
      b.setLinvel({ x: v.x, y: JUMP, z: v.z }, true);
      avatar.jumpAt = performance.now();
    }

    // Dodge: burst in current move/facing dir + i-frames.
    if (input.consume("dodge")) {
      const dd = moving ? moveDir : fwd.set(Math.sin(faceYaw.current), 0, Math.cos(faceYaw.current));
      b.setLinvel({ x: dd.x * DODGE_IMPULSE, y: v.y, z: dd.z * DODGE_IMPULSE }, true);
      input.iframeUntil = performance.now() + DODGE_IFRAME_MS;
    }

    // Weapon swap + inventory toggle.
    if (input.consume("swap")) {
      const g = useGame.getState();
      g.setEquipped(g.equipped === "pistol" ? "fists" : "pistol");
    }
    if (input.consume("inv")) useGame.getState().toggleInventory();

    // Stamina drain/regen.
    useGame.getState().setStamina(st.player.stamina + (running ? -14 : 8) * delta);

    // Feed the animation rig.
    avatar.speed = moving ? speed : 0;
    avatar.running = running;
    avatar.grounded = grounded;
    avatar.blocking = input.block;
    avatar.weapon = useGame.getState().equipped;

    // Face movement direction.
    if (moving) {
      faceYaw.current = MathUtils.lerp(faceYaw.current, Math.atan2(moveDir.x, moveDir.z), 0.25);
      if (visual.current) visual.current.rotation.y = faceYaw.current;
    }

    const p = b.translation();
    useGame.getState().setPlayerPos([p.x, p.y, p.z]);
    useGame.getState().setPlayerFacing(faceYaw.current);

    // Third-person orbit camera: yaw (around) + pitch (up/down).
    const dist = 8.5;
    const horiz = Math.cos(pitch.current) * dist;
    const vert = 2.2 + Math.sin(pitch.current) * dist;
    camWanted.set(
      p.x + Math.sin(yaw.current) * horiz,
      Math.max(p.y + 1.2, p.y + vert),
      p.z + Math.cos(yaw.current) * horiz
    );
    camera.position.lerp(camWanted, 0.14);
    camera.lookAt(camTarget.set(p.x, p.y + 1.5, p.z));
  });

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={start}
      enabledRotations={[false, false, false]}
      mass={1}
      canSleep={false}
    >
      <CapsuleCollider args={[0.5, 0.35]} />
      <group ref={visual}>
        <PlayerModel />
      </group>
    </RigidBody>
  );
}

// Driving control extracted to keep the frame handler readable.
function this_driveVehicle(
  uid: string,
  delta: number,
  yaw: React.MutableRefObject<number>,
  camera: import("three").Camera
) {
  const entry = drivables.get(uid);
  if (!entry) return;
  const { body, spec } = entry;

  // Current yaw of the vehicle.
  const rot = body.rotation();
  q.set(rot.x, rot.y, rot.z, rot.w);
  e.setFromQuaternion(q, "YXZ");
  const vehYaw = e.y;
  fwd.set(Math.sin(vehYaw), 0, Math.cos(vehYaw));

  const throttle = input.move.y; // -1..1
  const steer = input.move.x;

  const lin = body.linvel();
  const curSpeed = lin.x * fwd.x + lin.z * fwd.z; // signed speed along forward
  const target = throttle * spec.maxSpeed;
  const newSpeed = MathUtils.lerp(curSpeed, target, 1 - Math.exp(-spec.accel * 0.2 * delta * 10));

  body.setLinvel({ x: fwd.x * newSpeed, y: lin.y, z: fwd.z * newSpeed }, true);

  // Steer only when rolling; reverse steering when reversing.
  const speedFactor = Math.min(1, Math.abs(newSpeed) / 4);
  const dirSign = newSpeed >= 0 ? 1 : -1;
  body.setAngvel({ x: 0, y: -steer * spec.turnRate * speedFactor * dirSign, z: 0 }, true);

  const t = body.translation();
  useGame.getState().setPlayerPos([t.x, t.y, t.z]);
  useGame.getState().setPlayerFacing(vehYaw);

  // Camera: behind + above, height scaled for big vehicles.
  const back = spec.kind === "bus" ? 16 : 11;
  const up = spec.kind === "bus" ? 9 : 6;
  camWanted.set(t.x - fwd.x * back, t.y + up, t.z - fwd.z * back);
  camera.position.lerp(camWanted, 0.1);
  camera.lookAt(camTarget.set(t.x, t.y + 1.5, t.z));
  void yaw;
}
