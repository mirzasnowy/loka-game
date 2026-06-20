"use client";

import { useEffect, useRef } from "react";
import { RigidBody, CuboidCollider, type RapierRigidBody } from "@react-three/rapier";
import { Asset } from "@/core/assetRegistry";
import { getVehicle, type VehicleSpec } from "@/data/vehicles";
import { DRIVABLE_PLACEMENTS } from "@/data/drivables";
import { drivables } from "./registries";
import { useGame } from "@/core/store";

/** Half-extents of the collider per vehicle kind. */
function half(spec: VehicleSpec): [number, number, number] {
  if (spec.kind === "scooter") return [0.4, 0.5, 0.9];
  if (spec.kind === "bus") return [1.2, 1.4, 5];
  return [0.95, 0.7, 2];
}

function VehicleEntity({ uid, spec, pos }: { uid: string; spec: VehicleSpec; pos: [number, number, number] }) {
  const body = useRef<RapierRigidBody>(null!);
  const driving = useGame((s) => s.runtime.inVehicleId === uid);

  useEffect(() => {
    if (!body.current) return;
    drivables.set(uid, { uid, spec, body: body.current });
    return () => void drivables.delete(uid);
  }, [uid, spec]);

  const h = half(spec);
  return (
    <RigidBody
      ref={body}
      type="dynamic"
      colliders={false}
      position={pos}
      enabledRotations={[false, true, false]}
      linearDamping={driving ? 0.4 : 3}
      angularDamping={4}
      mass={spec.kind === "bus" ? 8 : spec.kind === "scooter" ? 1.5 : 4}
      canSleep={false}
    >
      <CuboidCollider args={h} />
      <Asset id={spec.assetId} />
      {driving && (
        <group position={[0, spec.seatHeight, spec.kind === "scooter" ? 0 : -0.2]}>
          <Asset id="player" />
        </group>
      )}
    </RigidBody>
  );
}

export default function PlayerVehicles() {
  return (
    <>
      {DRIVABLE_PLACEMENTS.map((p) => {
        const spec = getVehicle(p.specId);
        if (!spec) return null;
        return <VehicleEntity key={p.uid} uid={p.uid} spec={spec} pos={p.pos} />;
      })}
    </>
  );
}
