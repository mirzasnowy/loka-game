"use client";

import type { RapierRigidBody } from "@react-three/rapier";
import type { VehicleSpec } from "@/data/vehicles";

/**
 * Runtime registries — the live ECS-style lookup of spawned entities. Renderer
 * systems register their physics bodies here; the control/combat systems read
 * them. Keeps systems decoupled (no direct component refs passed around).
 */

export interface DrivableEntry {
  uid: string;
  spec: VehicleSpec;
  body: RapierRigidBody;
}
export const drivables = new Map<string, DrivableEntry>();

export interface EnemyEntry {
  uid: string;
  hp: number;
  maxHp: number;
  pos: [number, number, number];
  dead: boolean;
  hitAt?: number;  // performance.now() of last hit — drives flinch flash
  diedAt?: number; // performance.now() of death — drives fall animation
}
export const enemies = new Map<string, EnemyEntry>();
