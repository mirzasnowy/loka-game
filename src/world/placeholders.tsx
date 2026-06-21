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
function makeHumanoid(shirt: string, skin = "#c8956b", pants = "#2b3a4a", hair = "#3a2616") {
  return function Humanoid(props: PlaceholderProps) {
    return (
      <group {...props}>
        {/* Head */}
        <mesh position={[0, 1.58, 0]} castShadow>
          <boxGeometry args={[0.38, 0.38, 0.36]} />
          <meshLambertMaterial color={skin} />
        </mesh>
        {/* Hair (dark brown cap) */}
        <mesh position={[0, 1.80, 0]}>
          <boxGeometry args={[0.41, 0.12, 0.39]} />
          <meshLambertMaterial color={hair} />
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
          <meshLambertMaterial color="#3a2a18" />
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
          <meshLambertMaterial color="#33241a" />
        </mesh>
        {/* Right foot */}
        <mesh position={[0.13, 0.14, 0.06]}>
          <boxGeometry args={[0.16, 0.12, 0.32]} />
          <meshLambertMaterial color="#33241a" />
        </mesh>
      </group>
    );
  };
}

// ─── Motorcycles (Honda Beat / Vario silhouette) ─────────────────────────────
function makeScooter(color: string) {
  return function Scooter(props: PlaceholderProps) {
    const WR = 0.32; // wheel radius
    return (
      <group {...props}>
        {/* === FRAME/CHASSIS === */}
        {/* Under-step floor board (flat base) */}
        <mesh position={[0, WR + 0.10, 0.04]} castShadow>
          <boxGeometry args={[0.44, 0.12, 1.30]} />
          <meshLambertMaterial color={color} />
        </mesh>

        {/* === BODY PANELS === */}
        {/* Front apron / leg shield (tall, wide at top) */}
        <mesh position={[0, WR + 0.52, 0.68]} castShadow>
          <boxGeometry args={[0.46, 0.60, 0.28]} />
          <meshLambertMaterial color={color} />
        </mesh>
        {/* Central body bulge */}
        <mesh position={[0, WR + 0.46, 0.10]} castShadow>
          <boxGeometry args={[0.50, 0.48, 0.70]} />
          <meshLambertMaterial color={color} />
        </mesh>
        {/* Rear tail section */}
        <mesh position={[0, WR + 0.38, -0.58]} castShadow>
          <boxGeometry args={[0.46, 0.36, 0.48]} />
          <meshLambertMaterial color={color} />
        </mesh>
        {/* Rear tail fin (angled top) */}
        <mesh position={[0, WR + 0.56, -0.72]} castShadow>
          <boxGeometry args={[0.42, 0.16, 0.22]} />
          <meshLambertMaterial color={color} />
        </mesh>

        {/* === SEAT === */}
        <mesh position={[0, WR + 0.72, -0.14]} castShadow>
          <boxGeometry args={[0.40, 0.13, 0.78]} />
          <meshLambertMaterial color="#1a0e0e" />
        </mesh>

        {/* === FRONT FAIRING (Honda Beat characteristic wide front) === */}
        <mesh position={[0, WR + 0.68, 0.84]} castShadow>
          <boxGeometry args={[0.52, 0.38, 0.22]} />
          <meshLambertMaterial color={color} />
        </mesh>

        {/* === WINDSCREEN === */}
        <mesh position={[0, WR + 0.92, 0.88]}>
          <boxGeometry args={[0.40, 0.24, 0.07]} />
          <meshLambertMaterial color="#c0e8ff" transparent opacity={0.72} />
        </mesh>

        {/* === HEADLIGHT (rectangular, characteristic Beat shape) === */}
        <mesh position={[0, WR + 0.56, 0.93]}>
          <boxGeometry args={[0.36, 0.18, 0.07]} />
          <meshLambertMaterial color="#fffce0" emissive="#ffe040" emissiveIntensity={0.5} />
        </mesh>
        {/* Headlight housing */}
        <mesh position={[0, WR + 0.56, 0.91]}>
          <boxGeometry args={[0.40, 0.22, 0.06]} />
          <meshLambertMaterial color="#3a3a3a" />
        </mesh>

        {/* === HANDLEBAR === */}
        <mesh position={[0, WR + 0.96, 0.78]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.72, 6]} />
          <meshLambertMaterial color="#252525" />
        </mesh>
        {/* Handlebar grips */}
        {[-0.35, 0.35].map((x) => (
          <mesh key={x} position={[x, WR + 0.96, 0.76]} rotation={[0.3, 0, 0]}>
            <cylinderGeometry args={[0.055, 0.045, 0.18, 6]} />
            <meshLambertMaterial color="#333" />
          </mesh>
        ))}

        {/* === TAIL LIGHT === */}
        <mesh position={[0, WR + 0.48, -0.84]}>
          <boxGeometry args={[0.26, 0.12, 0.06]} />
          <meshLambertMaterial color="#ff1818" emissive="#cc0000" emissiveIntensity={0.7} />
        </mesh>

        {/* === FRONT FORK === */}
        <mesh position={[0, WR + 0.14, 0.75]} rotation={[-0.18, 0, 0]}>
          <boxGeometry args={[0.08, 0.52, 0.06]} />
          <meshLambertMaterial color="#555" />
        </mesh>

        {/* === EXHAUST PIPE === */}
        <mesh position={[-0.26, WR + 0.06, -0.22]} rotation={[0.1, 0, 0]}>
          <cylinderGeometry args={[0.045, 0.055, 0.88, 7]} />
          <meshLambertMaterial color="#707070" />
        </mesh>
        <mesh position={[-0.26, WR + 0.04, -0.64]}>
          <cylinderGeometry args={[0.07, 0.06, 0.24, 7]} />
          <meshLambertMaterial color="#606060" />
        </mesh>

        {/* === FRONT WHEEL === */}
        <mesh position={[0, WR, 0.80]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[WR, WR, 0.18, 16]} />
          <meshLambertMaterial color="#2b2b2b" />
        </mesh>
        {/* Front hub */}
        <mesh position={[0, WR, 0.80]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[WR * 0.38, WR * 0.38, 0.20, 8]} />
          <meshLambertMaterial color="#888" />
        </mesh>

        {/* === REAR WHEEL === */}
        <mesh position={[0, WR, -0.74]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[WR, WR, 0.18, 16]} />
          <meshLambertMaterial color="#2b2b2b" />
        </mesh>
        {/* Rear hub */}
        <mesh position={[0, WR, -0.74]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[WR * 0.38, WR * 0.38, 0.20, 8]} />
          <meshLambertMaterial color="#888" />
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
              <meshLambertMaterial color="#2b2b2b" />
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
          <meshLambertMaterial color="#333" />
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
              <meshLambertMaterial color="#2b2b2b" />
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
          <meshLambertMaterial color="#333" />
        </mesh>
      ))}
    </group>
  );
}

// ─── Player hero character (Jakarta jacket + backpack) ───────────────────────
function PlayerChar(props: PlaceholderProps) {
  const skin = "#caa176";
  const jacket = "#27406e";   // navy jacket
  const jacketTrim = "#e8e8ec";
  const pants = "#2a2f3a";
  return (
    <group {...props}>
      {/* Head */}
      <mesh position={[0, 1.60, 0]} castShadow><boxGeometry args={[0.38, 0.38, 0.36]} /><meshLambertMaterial color={skin} /></mesh>
      {/* Hair */}
      <mesh position={[0, 1.82, 0]}><boxGeometry args={[0.41, 0.13, 0.39]} /><meshLambertMaterial color="#241608" /></mesh>
      {/* Torso jacket */}
      <mesh position={[0, 1.12, 0]} castShadow><boxGeometry args={[0.48, 0.64, 0.30]} /><meshLambertMaterial color={jacket} /></mesh>
      {/* Jacket front zipper trim */}
      <mesh position={[0, 1.12, 0.156]}><boxGeometry args={[0.06, 0.62, 0.02]} /><meshLambertMaterial color={jacketTrim} /></mesh>
      {/* Chest "JAKARTA" badge */}
      <mesh position={[0.13, 1.30, 0.158]}><boxGeometry args={[0.16, 0.10, 0.02]} /><meshLambertMaterial color="#f0c020" /></mesh>
      {/* Upper arms (jacket) */}
      <mesh position={[-0.32, 1.18, 0]} rotation={[0.12, 0, 0.16]} castShadow><boxGeometry args={[0.15, 0.46, 0.17]} /><meshLambertMaterial color={jacket} /></mesh>
      <mesh position={[0.32, 1.18, 0]} rotation={[-0.12, 0, -0.16]} castShadow><boxGeometry args={[0.15, 0.46, 0.17]} /><meshLambertMaterial color={jacket} /></mesh>
      {/* Forearms (skin) */}
      <mesh position={[-0.34, 0.80, 0.03]} castShadow><boxGeometry args={[0.13, 0.38, 0.15]} /><meshLambertMaterial color={skin} /></mesh>
      <mesh position={[0.34, 0.80, 0.03]} castShadow><boxGeometry args={[0.13, 0.38, 0.15]} /><meshLambertMaterial color={skin} /></mesh>
      {/* Backpack */}
      <mesh position={[0, 1.14, -0.24]} castShadow><boxGeometry args={[0.40, 0.50, 0.20]} /><meshLambertMaterial color="#3a4a5a" /></mesh>
      <mesh position={[0, 1.22, -0.35]}><boxGeometry args={[0.30, 0.30, 0.04]} /><meshLambertMaterial color="#566678" /></mesh>
      {/* Belt */}
      <mesh position={[0, 0.78, 0]}><boxGeometry args={[0.49, 0.09, 0.31]} /><meshLambertMaterial color="#3a2a18" /></mesh>
      {/* Legs */}
      <mesh position={[-0.13, 0.44, 0]} castShadow><boxGeometry args={[0.18, 0.54, 0.23]} /><meshLambertMaterial color={pants} /></mesh>
      <mesh position={[0.13, 0.44, 0]} castShadow><boxGeometry args={[0.18, 0.54, 0.23]} /><meshLambertMaterial color={pants} /></mesh>
      {/* Shoes */}
      <mesh position={[-0.13, 0.13, 0.06]}><boxGeometry args={[0.17, 0.13, 0.34]} /><meshLambertMaterial color="#e8e8ec" /></mesh>
      <mesh position={[0.13, 0.13, 0.06]}><boxGeometry args={[0.17, 0.13, 0.34]} /><meshLambertMaterial color="#e8e8ec" /></mesh>
    </group>
  );
}

// ─── Registration ─────────────────────────────────────────────────────────────
let done = false;
export function registerPlaceholders() {
  if (done) return;
  done = true;

  registerAsset("monas", { placeholder: Monas });

  // Player — distinct hero look (Jakarta jacket + backpack)
  registerAsset("player",        { placeholder: PlayerChar });
  // NPC archetypes (all vivid; no black)
  registerAsset("npc_pedestrian",{ placeholder: makeHumanoid("#5a9f5a", "#c8956b", "#33415a") });
  registerAsset("npc_office",    { placeholder: makeHumanoid("#eaeaea", "#e0b890", "#384a64") });
  registerAsset("npc_student",   { placeholder: makeHumanoid("#ffffff", "#c8956b", "#22408a") });
  registerAsset("npc_ojol",      { placeholder: makeHumanoid("#2faa48", "#c8956b", "#2a2a38") });
  registerAsset("npc_police",    { placeholder: makeHumanoid("#6a90c8", "#e0b890", "#2c3a4e") });
  registerAsset("npc_elderly",   { placeholder: makeHumanoid("#b09a82", "#d8a870", "#5a4a3a", "#cfcfcf") });
  registerAsset("enemy_preman",  { placeholder: makeHumanoid("#5a2733", "#b07848", "#2c2c38", "#241008") });

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
