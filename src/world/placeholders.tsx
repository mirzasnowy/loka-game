"use client";

import { registerAsset, type PlaceholderProps } from "@/core/assetRegistry";

// ─── Monas Monument ───────────────────────────────────────────────────────────
function Monas(props: PlaceholderProps) {
  return (
    <group {...props}>
      {/* Outer base platform */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[26, 1.5, 26]} />
        <meshLambertMaterial color="#d8d0c0" />
      </mesh>
      {/* Inner raised base */}
      <mesh position={[0, 1.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[20, 0.5, 20]} />
        <meshLambertMaterial color="#e0dace" />
      </mesh>
      {/* Base block / museum room */}
      <mesh position={[0, 4.5, 0]} castShadow>
        <boxGeometry args={[17, 5, 17]} />
        <meshLambertMaterial color="#ece8dc" />
      </mesh>
      {/* Step / plinth top */}
      <mesh position={[0, 7.2, 0]} castShadow>
        <boxGeometry args={[14, 0.5, 14]} />
        <meshLambertMaterial color="#f0ece0" />
      </mesh>
      {/* Obelisk shaft — tapered, 8-sided */}
      <mesh position={[0, 73, 0]} castShadow>
        <cylinderGeometry args={[1.2, 3.6, 132, 8]} />
        <meshLambertMaterial color="#f4f1e8" />
      </mesh>
      {/* Neck transition */}
      <mesh position={[0, 138, 0]} castShadow>
        <cylinderGeometry args={[2.0, 1.4, 4, 8]} />
        <meshLambertMaterial color="#ece8d8" />
      </mesh>
      {/* Gold cupola */}
      <mesh position={[0, 142, 0]} castShadow>
        <cylinderGeometry args={[2.2, 2.2, 2.5, 12]} />
        <meshLambertMaterial color="#d4a018" emissive="#a07008" emissiveIntensity={0.3} />
      </mesh>
      {/* Flame base */}
      <mesh position={[0, 144.8, 0]} castShadow>
        <sphereGeometry args={[2.2, 10, 8]} />
        <meshLambertMaterial color="#d4a018" emissive="#c08000" emissiveIntensity={0.4} />
      </mesh>
      {/* Gold flame */}
      <mesh position={[0, 150, 0]} castShadow>
        <coneGeometry args={[1.8, 12, 8]} />
        <meshLambertMaterial color="#e8b020" emissive="#c08000" emissiveIntensity={0.6} />
      </mesh>
      {/* Tip glow */}
      <mesh position={[0, 156.5, 0]}>
        <sphereGeometry args={[0.7, 6, 5]} />
        <meshLambertMaterial color="#ffe060" emissive="#ffb000" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

// ─── Humanoid NPCs ────────────────────────────────────────────────────────────
function makeHumanoid(shirt: string, skin = "#c8956b", pants = "#2b3a4a") {
  return function Humanoid(props: PlaceholderProps) {
    return (
      <group {...props}>
        {/* Head */}
        <mesh position={[0, 1.58, 0]} castShadow>
          <boxGeometry args={[0.38, 0.38, 0.36]} />
          <meshLambertMaterial color={skin} />
        </mesh>
        {/* Hair/hat (subtle top cap) */}
        <mesh position={[0, 1.8, 0]}>
          <boxGeometry args={[0.40, 0.10, 0.38]} />
          <meshLambertMaterial color="#2a1a0a" />
        </mesh>
        {/* Torso */}
        <mesh position={[0, 1.10, 0]} castShadow>
          <boxGeometry args={[0.44, 0.60, 0.28]} />
          <meshLambertMaterial color={shirt} />
        </mesh>
        {/* Left upper arm */}
        <mesh position={[-0.30, 1.16, 0]} rotation={[0.15, 0, 0.18]} castShadow>
          <boxGeometry args={[0.14, 0.44, 0.16]} />
          <meshLambertMaterial color={shirt} />
        </mesh>
        {/* Right upper arm */}
        <mesh position={[0.30, 1.16, 0]} rotation={[-0.15, 0, -0.18]} castShadow>
          <boxGeometry args={[0.14, 0.44, 0.16]} />
          <meshLambertMaterial color={shirt} />
        </mesh>
        {/* Left forearm */}
        <mesh position={[-0.32, 0.78, 0.03]} castShadow>
          <boxGeometry args={[0.12, 0.36, 0.14]} />
          <meshLambertMaterial color={skin} />
        </mesh>
        {/* Right forearm */}
        <mesh position={[0.32, 0.78, 0.03]} castShadow>
          <boxGeometry args={[0.12, 0.36, 0.14]} />
          <meshLambertMaterial color={skin} />
        </mesh>
        {/* Belt */}
        <mesh position={[0, 0.77, 0]}>
          <boxGeometry args={[0.45, 0.08, 0.29]} />
          <meshLambertMaterial color="#1a1008" />
        </mesh>
        {/* Left leg */}
        <mesh position={[-0.13, 0.44, 0]} castShadow>
          <boxGeometry args={[0.17, 0.52, 0.22]} />
          <meshLambertMaterial color={pants} />
        </mesh>
        {/* Right leg */}
        <mesh position={[0.13, 0.44, 0]} castShadow>
          <boxGeometry args={[0.17, 0.52, 0.22]} />
          <meshLambertMaterial color={pants} />
        </mesh>
        {/* Left foot */}
        <mesh position={[-0.13, 0.14, 0.06]}>
          <boxGeometry args={[0.16, 0.12, 0.32]} />
          <meshLambertMaterial color="#1a1008" />
        </mesh>
        {/* Right foot */}
        <mesh position={[0.13, 0.14, 0.06]}>
          <boxGeometry args={[0.16, 0.12, 0.32]} />
          <meshLambertMaterial color="#1a1008" />
        </mesh>
      </group>
    );
  };
}

// ─── Motorcycles ─────────────────────────────────────────────────────────────
function makeScooter(color: string) {
  return function Scooter(props: PlaceholderProps) {
    return (
      <group {...props}>
        {/* Main body */}
        <mesh position={[0, 0.58, 0]} castShadow>
          <boxGeometry args={[0.52, 0.38, 1.7]} />
          <meshLambertMaterial color={color} />
        </mesh>
        {/* Seat */}
        <mesh position={[0, 0.82, 0.1]} castShadow>
          <boxGeometry args={[0.44, 0.14, 0.72]} />
          <meshLambertMaterial color="#1a1010" />
        </mesh>
        {/* Front fairing */}
        <mesh position={[0, 0.72, 0.75]} castShadow>
          <boxGeometry args={[0.48, 0.44, 0.36]} />
          <meshLambertMaterial color={color} />
        </mesh>
        {/* Windscreen */}
        <mesh position={[0, 0.98, 0.82]}>
          <boxGeometry args={[0.38, 0.22, 0.08]} />
          <meshLambertMaterial color="#a8daf0" transparent opacity={0.7} />
        </mesh>
        {/* Handlebar */}
        <mesh position={[0, 1.02, 0.76]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.66, 6]} />
          <meshLambertMaterial color="#303030" />
        </mesh>
        {/* Tail section */}
        <mesh position={[0, 0.64, -0.72]} castShadow>
          <boxGeometry args={[0.46, 0.28, 0.36]} />
          <meshLambertMaterial color={color} />
        </mesh>
        {/* Rear light */}
        <mesh position={[0, 0.64, -0.92]}>
          <boxGeometry args={[0.22, 0.10, 0.06]} />
          <meshLambertMaterial color="#ff2020" emissive="#cc0000" emissiveIntensity={0.6} />
        </mesh>
        {/* Headlight */}
        <mesh position={[0, 0.75, 0.92]}>
          <boxGeometry args={[0.22, 0.14, 0.06]} />
          <meshLambertMaterial color="#fffbe0" emissive="#ffe060" emissiveIntensity={0.4} />
        </mesh>
        {/* Front wheel */}
        <mesh position={[0, 0.30, 0.78]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.30, 0.30, 0.18, 14]} />
          <meshLambertMaterial color="#181818" />
        </mesh>
        {/* Front wheel hub */}
        <mesh position={[0, 0.30, 0.78]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 0.20, 8]} />
          <meshLambertMaterial color="#888" />
        </mesh>
        {/* Rear wheel */}
        <mesh position={[0, 0.30, -0.72]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.30, 0.30, 0.18, 14]} />
          <meshLambertMaterial color="#181818" />
        </mesh>
        {/* Rear wheel hub */}
        <mesh position={[0, 0.30, -0.72]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.12, 0.12, 0.20, 8]} />
          <meshLambertMaterial color="#888" />
        </mesh>
        {/* Engine/frame */}
        <mesh position={[0, 0.40, 0.05]}>
          <boxGeometry args={[0.22, 0.22, 0.9]} />
          <meshLambertMaterial color="#404040" />
        </mesh>
      </group>
    );
  };
}

// ─── Cars ─────────────────────────────────────────────────────────────────────
function makeCar(color: string, len = 4.5, w = 1.8, bodyH = 0.72, cabH = 0.72, cabOff = -0.1) {
  return function Car(props: PlaceholderProps) {
    const wheelR = 0.36;
    const wheelY = wheelR;
    const bodyY = wheelR + bodyH / 2;
    const cabY = bodyY + bodyH / 2 + cabH / 2;

    // Wheel x/z positions
    const axleZ = len / 2 - 0.7;
    const axleX = w / 2;

    return (
      <group {...props}>
        {/* Main body */}
        <mesh position={[0, bodyY, 0]} castShadow receiveShadow>
          <boxGeometry args={[w, bodyH, len]} />
          <meshLambertMaterial color={color} />
        </mesh>

        {/* Cabin / roof */}
        <mesh position={[0, cabY, cabOff * len]} castShadow>
          <boxGeometry args={[w * 0.88, cabH, len * 0.52]} />
          <meshLambertMaterial color={color} />
        </mesh>

        {/* Windshield front */}
        <mesh position={[0, cabY + 0.05, cabOff * len + len * 0.28]}>
          <boxGeometry args={[w * 0.82, cabH * 0.7, 0.06]} />
          <meshLambertMaterial color="#a8d8f8" transparent opacity={0.75} />
        </mesh>
        {/* Windshield rear */}
        <mesh position={[0, cabY + 0.05, cabOff * len - len * 0.28]}>
          <boxGeometry args={[w * 0.82, cabH * 0.65, 0.06]} />
          <meshLambertMaterial color="#a8d8f8" transparent opacity={0.75} />
        </mesh>

        {/* Headlights */}
        <mesh position={[-w * 0.3, bodyY + 0.08, len / 2 + 0.02]}>
          <boxGeometry args={[0.28, 0.16, 0.06]} />
          <meshLambertMaterial color="#fffbe0" emissive="#ffe060" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[w * 0.3, bodyY + 0.08, len / 2 + 0.02]}>
          <boxGeometry args={[0.28, 0.16, 0.06]} />
          <meshLambertMaterial color="#fffbe0" emissive="#ffe060" emissiveIntensity={0.4} />
        </mesh>
        {/* Tail lights */}
        <mesh position={[-w * 0.3, bodyY + 0.08, -len / 2 - 0.02]}>
          <boxGeometry args={[0.28, 0.14, 0.06]} />
          <meshLambertMaterial color="#ff1818" emissive="#cc0000" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[w * 0.3, bodyY + 0.08, -len / 2 - 0.02]}>
          <boxGeometry args={[0.28, 0.14, 0.06]} />
          <meshLambertMaterial color="#ff1818" emissive="#cc0000" emissiveIntensity={0.5} />
        </mesh>

        {/* 4 wheels */}
        {([[-axleX, axleZ], [axleX, axleZ], [-axleX, -axleZ], [axleX, -axleZ]] as [number,number][]).map(([wx, wz], i) => (
          <group key={i} position={[wx, wheelY, wz]}>
            {/* Tire */}
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[wheelR, wheelR, 0.22, 14]} />
              <meshLambertMaterial color="#181818" />
            </mesh>
            {/* Hubcap */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[wheelR * 0.55, wheelR * 0.55, 0.24, 8]} />
              <meshLambertMaterial color="#909090" />
            </mesh>
          </group>
        ))}

        {/* Grill */}
        <mesh position={[0, bodyY - 0.05, len / 2 + 0.02]}>
          <boxGeometry args={[w * 0.5, bodyH * 0.35, 0.06]} />
          <meshLambertMaterial color="#222" />
        </mesh>
      </group>
    );
  };
}

// ─── TransJakarta Bus ─────────────────────────────────────────────────────────
function Bus(props: PlaceholderProps) {
  const wheelR = 0.5;
  const bodyH = 2.5;
  const len = 10;
  const w = 2.4;
  return (
    <group {...props}>
      {/* Main body */}
      <mesh position={[0, wheelR + bodyH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, bodyH, len]} />
        <meshLambertMaterial color="#e02020" />
      </mesh>
      {/* White stripe */}
      <mesh position={[0, wheelR + bodyH * 0.55, 0]}>
        <boxGeometry args={[w + 0.02, bodyH * 0.14, len + 0.02]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
      {/* Windows */}
      {[-3.2, -1.6, 0, 1.6, 3.2].map((z) =>
        [-1.21, 1.21].map((x) => (
          <mesh key={`${x}-${z}`} position={[x, wheelR + bodyH * 0.65, z]}>
            <boxGeometry args={[0.06, bodyH * 0.36, 0.9]} />
            <meshLambertMaterial color="#80c8e8" transparent opacity={0.8} />
          </mesh>
        ))
      )}
      {/* Destination board */}
      <mesh position={[0, wheelR + bodyH * 0.82, len / 2 + 0.04]}>
        <boxGeometry args={[w * 0.75, 0.38, 0.06]} />
        <meshLambertMaterial color="#ffffff" />
      </mesh>
      {/* Wheels (3 axles for bus) */}
      {([-4.0, 0, 4.0] as number[]).map((z) =>
        ([-w / 2, w / 2] as number[]).map((x) => (
          <group key={`${x}-${z}`} position={[x, wheelR, z]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[wheelR, wheelR, 0.28, 14]} />
              <meshLambertMaterial color="#181818" />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[wheelR * 0.5, wheelR * 0.5, 0.30, 8]} />
              <meshLambertMaterial color="#888" />
            </mesh>
          </group>
        ))
      )}
    </group>
  );
}

// ─── Vendor Cart ──────────────────────────────────────────────────────────────
function VendorCart(props: PlaceholderProps) {
  return (
    <group {...props}>
      {/* Cart body */}
      <mesh position={[0, 0.72, 0]} castShadow>
        <boxGeometry args={[1.8, 0.9, 0.9]} />
        <meshLambertMaterial color="#9c6b3f" />
      </mesh>
      {/* Counter top */}
      <mesh position={[0, 1.18, 0]}>
        <boxGeometry args={[1.9, 0.08, 1.0]} />
        <meshLambertMaterial color="#c87840" />
      </mesh>
      {/* Parasol post */}
      <mesh position={[0, 2.0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1.7, 6]} />
        <meshLambertMaterial color="#6a4020" />
      </mesh>
      {/* Parasol canopy */}
      <mesh position={[0, 2.9, 0]}>
        <coneGeometry args={[1.6, 0.5, 8]} />
        <meshLambertMaterial color="#e03820" />
      </mesh>
      <mesh position={[0, 2.65, 0]}>
        <cylinderGeometry args={[1.6, 1.6, 0.08, 8]} />
        <meshLambertMaterial color="#e03820" />
      </mesh>
      {/* Wheels */}
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x, 0.24, 0.48]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.24, 0.10, 12]} />
          <meshLambertMaterial color="#222" />
        </mesh>
      ))}
    </group>
  );
}

// ─── Registration ─────────────────────────────────────────────────────────────
let done = false;
export function registerPlaceholders() {
  if (done) return;
  done = true;

  registerAsset("monas", { placeholder: Monas });

  // Player + NPC archetypes
  registerAsset("player",        { placeholder: makeHumanoid("#3b6ea5", "#c8956b", "#2a3a50") });
  registerAsset("npc_pedestrian",{ placeholder: makeHumanoid("#5a8f5a", "#c8956b", "#2a3a4a") });
  registerAsset("npc_office",    { placeholder: makeHumanoid("#e8e8e8", "#e0b890", "#1a1a2a") });
  registerAsset("npc_student",   { placeholder: makeHumanoid("#ffffff", "#c8956b", "#1a3080") });
  registerAsset("npc_ojol",      { placeholder: makeHumanoid("#2b8a3e", "#c8956b", "#181818") });
  registerAsset("npc_police",    { placeholder: makeHumanoid("#6080b0", "#e0b890", "#1c2530") });
  registerAsset("npc_elderly",   { placeholder: makeHumanoid("#a0907a", "#d8a870", "#3a3028") });
  registerAsset("enemy_preman",  { placeholder: makeHumanoid("#1a1a1a", "#b07848", "#0a0a0a") });

  // Vehicles
  registerAsset("veh_scooter",   { placeholder: makeScooter("#e02828") });
  registerAsset("veh_scooter_w", { placeholder: makeScooter("#f0f0f0") });
  registerAsset("veh_scooter_b", { placeholder: makeScooter("#1a2060") });
  registerAsset("veh_car",       { placeholder: makeCar("#d8d8d8", 4.5, 1.78, 0.72, 0.70, -0.08) });
  registerAsset("veh_car_red",   { placeholder: makeCar("#c82020", 4.4, 1.78, 0.70, 0.68, -0.08) });
  registerAsset("veh_innova",    { placeholder: makeCar("#2a3a50", 4.8, 1.82, 0.78, 0.76, -0.06) });
  registerAsset("veh_pickup",    { placeholder: makeCar("#4070a8", 4.6, 1.88, 0.68, 0.62, -0.28) });
  registerAsset("veh_bus",       { placeholder: Bus });

  // Props
  registerAsset("vendor_cart", { placeholder: VendorCart });
}
