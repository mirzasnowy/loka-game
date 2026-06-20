"use client";

import { registerAsset, type PlaceholderProps } from "@/core/assetRegistry";

/**
 * Every placeholder primitive + its future GLB slot lives here. Ship real art
 * by dropping a file in /public/assets and adding `glb: "/assets/x.glb"` to the
 * matching registerAsset call — no other file changes anywhere in the codebase.
 */

function Monas(props: PlaceholderProps) {
  return (
    <group {...props}>
      <mesh position={[0, 2, 0]} castShadow>
        <boxGeometry args={[18, 4, 18]} />
        <meshStandardMaterial color="#e8e6df" />
      </mesh>
      <mesh position={[0, 35, 0]} castShadow>
        <cylinderGeometry args={[1.6, 3.2, 66, 8]} />
        <meshStandardMaterial color="#f2efe6" />
      </mesh>
      <mesh position={[0, 70, 0]} castShadow>
        <coneGeometry args={[2.4, 6, 8]} />
        <meshStandardMaterial color="#d9a521" emissive="#7a5800" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function makeHumanoid(shirt: string, skin = "#e0b48a", pants = "#33384a") {
  return function Humanoid(props: PlaceholderProps) {
    return (
      <group {...props}>
        <mesh castShadow position={[0, 0.55, 0]}>
          <boxGeometry args={[0.5, 0.7, 0.28]} />
          <meshStandardMaterial color={shirt} />
        </mesh>
        <mesh castShadow position={[0, 0.15, 0]}>
          <boxGeometry args={[0.46, 0.5, 0.26]} />
          <meshStandardMaterial color={pants} />
        </mesh>
        <mesh castShadow position={[0, 1.05, 0]}>
          <sphereGeometry args={[0.2, 12, 12]} />
          <meshStandardMaterial color={skin} />
        </mesh>
      </group>
    );
  };
}

function Scooter(props: PlaceholderProps) {
  return (
    <group {...props}>
      <mesh castShadow position={[0, 0.5, 0]}>
        <boxGeometry args={[0.5, 0.35, 1.6]} />
        <meshStandardMaterial color="#c43b3b" />
      </mesh>
      <mesh castShadow position={[0, 0.75, 0.55]}>
        <boxGeometry args={[0.45, 0.2, 0.4]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh castShadow position={[0, 0.9, 0.75]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      {[-0.7, 0.7].map((z) => (
        <mesh key={z} castShadow position={[0, 0.28, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.28, 0.28, 0.18, 16]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
      ))}
    </group>
  );
}

function makeCar(color: string, len = 4, w = 1.8, h = 1.4, cab = 1) {
  return function Car(props: PlaceholderProps) {
    return (
      <group {...props}>
        <mesh castShadow position={[0, h / 2, 0]}>
          <boxGeometry args={[w, h * 0.55, len]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh castShadow position={[0, h * 0.78, -len * 0.08]}>
          <boxGeometry args={[w * 0.9, h * 0.45 * cab, len * 0.5]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {[
          [-w / 2, len / 2 - 0.6],
          [w / 2, len / 2 - 0.6],
          [-w / 2, -len / 2 + 0.6],
          [w / 2, -len / 2 + 0.6],
        ].map(([x, z], i) => (
          <mesh key={i} castShadow position={[x, 0.35, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.35, 0.35, 0.25, 14]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        ))}
      </group>
    );
  };
}

function Bus(props: PlaceholderProps) {
  return (
    <group {...props}>
      <mesh castShadow position={[0, 1.4, 0]}>
        <boxGeometry args={[2.4, 2.6, 10]} />
        <meshStandardMaterial color="#1f6fb2" />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <boxGeometry args={[2.42, 0.5, 9.5]} />
        <meshStandardMaterial color="#bcd6e6" />
      </mesh>
      {[-3.5, 0, 3.5].map((z) =>
        [-1.2, 1.2].map((x) => (
          <mesh key={`${x}-${z}`} castShadow position={[x, 0.45, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.45, 0.45, 0.3, 14]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        ))
      )}
    </group>
  );
}

function VendorCart(props: PlaceholderProps) {
  return (
    <group {...props}>
      <mesh castShadow position={[0, 0.7, 0]}>
        <boxGeometry args={[1.8, 0.9, 0.9]} />
        <meshStandardMaterial color="#9c6b3f" />
      </mesh>
      <mesh position={[0, 1.55, 0]}>
        <boxGeometry args={[2.0, 0.12, 1.1]} />
        <meshStandardMaterial color="#cf4b2f" />
      </mesh>
      {[-0.85, 0.85].map((x) => (
        <mesh key={x} position={[x, 1.1, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.8, 6]} />
          <meshStandardMaterial color="#5a3a22" />
        </mesh>
      ))}
      {[-0.7, 0.7].map((x) => (
        <mesh key={`w${x}`} castShadow position={[x, 0.22, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.22, 0.1, 12]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      ))}
    </group>
  );
}

let done = false;
export function registerPlaceholders() {
  if (done) return;
  done = true;
  registerAsset("monas", { placeholder: Monas /* glb: "/assets/monas.glb" */ });

  // player + npc archetypes
  registerAsset("player", { placeholder: makeHumanoid("#3b6ea5") /* glb: "/assets/player_male.glb" */ });
  registerAsset("npc_pedestrian", { placeholder: makeHumanoid("#5a8f5a") });
  registerAsset("npc_office", { placeholder: makeHumanoid("#dddddd", "#e0b48a", "#2b2b3a") });
  registerAsset("npc_student", { placeholder: makeHumanoid("#d04f4f", "#e0b48a", "#27408b") });
  registerAsset("npc_ojol", { placeholder: makeHumanoid("#2b8a3e", "#e0b48a", "#222") });
  registerAsset("npc_police", { placeholder: makeHumanoid("#34507a", "#e0b48a", "#1c2733") });
  registerAsset("npc_elderly", { placeholder: makeHumanoid("#8a8a8a", "#d8b48a", "#4a4a4a") });
  registerAsset("enemy_preman", { placeholder: makeHumanoid("#3a3a3a", "#c79a6a", "#1a1a1a") });

  // vehicles
  registerAsset("veh_scooter", { placeholder: Scooter });
  registerAsset("veh_car", { placeholder: makeCar("#d8d8d8", 4, 1.8, 1.5, 1) });
  registerAsset("veh_pickup", { placeholder: makeCar("#3b6ea5", 4.4, 1.9, 1.4, 0.6) });
  registerAsset("veh_bus", { placeholder: Bus });

  // props
  registerAsset("vendor_cart", { placeholder: VendorCart });
}
