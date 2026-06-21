"use client";

import { registerAsset, type PlaceholderProps } from "@/core/assetRegistry";

// ─── Monas Monument (precise proportions, ~132m to the flame) ────────────────
// Real Monas: square stepped pelataran, a tall square marble obelisk that tapers
// only slightly, the flared "cawan" (cup), and the gold-leaf flame at the top.
// Square cross-sections use a 4-sided cylinder rotated 45°.
const MARBLE = "#f2efe6";
const MARBLE_D = "#e2ded0";
const GOLD = "#e3b020";

function Monas(props: PlaceholderProps) {
  return (
    <group {...props}>
      {/* ── Pelataran: wide stepped square base ── */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[48, 1.2, 48]} /><meshLambertMaterial color={MARBLE_D} />
      </mesh>
      <mesh position={[0, 1.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[38, 1.2, 38]} /><meshLambertMaterial color="#eceadf" />
      </mesh>
      <mesh position={[0, 2.7, 0]} castShadow receiveShadow>
        <boxGeometry args={[30, 1.0, 30]} /><meshLambertMaterial color={MARBLE} />
      </mesh>

      {/* ── Cawan / base hall (square block housing the museum) ── */}
      <mesh position={[0, 6.5, 0]} castShadow>
        <boxGeometry args={[22, 7, 22]} /><meshLambertMaterial color={MARBLE} />
      </mesh>
      {/* recessed vertical grooves (4 faces) */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((a, i) => (
        <mesh key={i} position={[Math.sin(a) * 11.1, 6.5, Math.cos(a) * 11.1]} rotation={[0, a, 0]}>
          <boxGeometry args={[16, 6, 0.3]} /><meshLambertMaterial color={MARBLE_D} />
        </mesh>
      ))}
      {/* cornice */}
      <mesh position={[0, 10.4, 0]} castShadow>
        <boxGeometry args={[24, 0.8, 24]} /><meshLambertMaterial color="#f6f3ea" />
      </mesh>

      {/* ── Plinth that the shaft rises from ── */}
      <mesh position={[0, 11.4, 0]} castShadow>
        <boxGeometry args={[12, 1.4, 12]} /><meshLambertMaterial color={MARBLE} />
      </mesh>

      {/* ── Obelisk shaft: tall square, very slight taper (square via 4-gon) ── */}
      <mesh position={[0, 67, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <cylinderGeometry args={[3.3, 4.4, 110, 4]} />
        <meshLambertMaterial color={MARBLE} />
      </mesh>
      {/* corner edge highlights for crisp silhouette */}
      <mesh position={[0, 67, 0]} rotation={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[3.0, 4.0, 110.2, 4]} />
        <meshLambertMaterial color={MARBLE_D} />
      </mesh>

      {/* ── Cawan: flared cup holding the flame ── */}
      <mesh position={[0, 123, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <cylinderGeometry args={[5.0, 3.0, 6, 4]} />
        <meshLambertMaterial color="#f6f3ea" />
      </mesh>
      <mesh position={[0, 126.5, 0]} castShadow>
        <cylinderGeometry args={[3.6, 5.0, 2.2, 12]} />
        <meshLambertMaterial color={MARBLE_D} />
      </mesh>

      {/* ── Gold flame (lidah api) ── */}
      <mesh position={[0, 128.6, 0]} castShadow>
        <cylinderGeometry args={[2.0, 3.0, 2.0, 12]} />
        <meshLambertMaterial color={GOLD} emissive="#a87010" emissiveIntensity={0.35} />
      </mesh>
      <mesh position={[0, 131.5, 0]} castShadow>
        <sphereGeometry args={[2.1, 12, 10]} />
        <meshLambertMaterial color={GOLD} emissive="#b07810" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[0, 135.5, 0]} castShadow>
        <coneGeometry args={[1.7, 7, 10]} />
        <meshLambertMaterial color="#f0c030" emissive="#c08800" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 139.8, 0]}>
        <sphereGeometry args={[0.6, 8, 6]} />
        <meshLambertMaterial color="#ffe87a" emissive="#ffbf20" emissiveIntensity={1.3} />
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
        {/* Face details (Eyes and Mouth) */}
        <mesh position={[-0.08, 1.62, 0.185]}>
          <boxGeometry args={[0.06, 0.06, 0.02]} />
          <meshLambertMaterial color="#111" />
        </mesh>
        <mesh position={[0.08, 1.62, 0.185]}>
          <boxGeometry args={[0.06, 0.06, 0.02]} />
          <meshLambertMaterial color="#111" />
        </mesh>
        <mesh position={[0, 1.50, 0.185]}>
          <boxGeometry args={[0.12, 0.04, 0.02]} />
          <meshLambertMaterial color="#421" />
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

// ─── Street-food carts (kaki lima) — distinct per dagangan ───────────────────
function makeCart(canopy: string, sign: string, bowl: string) {
  return function Cart(props: PlaceholderProps) {
    // Front of the cart (counter/glass/sign) faces +Z toward the customer.
    return (
      <group {...props}>
        {/* ── Wooden body ── */}
        <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.9, 0.66, 0.9]} />
          <meshLambertMaterial color="#9c6b3f" />
        </mesh>
        {/* lighter panel inlays */}
        {[-0.55, 0, 0.55].map((x) => (
          <mesh key={x} position={[x, 0.74, 0.46]}>
            <boxGeometry args={[0.42, 0.46, 0.03]} />
            <meshLambertMaterial color="#b07c48" />
          </mesh>
        ))}
        {/* counter top */}
        <mesh position={[0, 1.1, 0]} castShadow>
          <boxGeometry args={[2.0, 0.08, 1.0]} />
          <meshLambertMaterial color="#c89058" />
        </mesh>

        {/* ── Glass display case (etalase) with frame ── */}
        <mesh position={[0, 1.42, 0.02]}>
          <boxGeometry args={[1.7, 0.5, 0.72]} />
          <meshLambertMaterial color="#cfeefb" transparent opacity={0.45} />
        </mesh>
        {/* aluminium frame edges */}
        {[-0.85, 0.85].map((x) => (
          <mesh key={x} position={[x, 1.42, 0.02]}><boxGeometry args={[0.05, 0.52, 0.74]} /><meshLambertMaterial color="#d8d8de" /></mesh>
        ))}
        <mesh position={[0, 1.68, 0.02]}><boxGeometry args={[1.74, 0.05, 0.76]} /><meshLambertMaterial color="#d8d8de" /></mesh>
        {/* food trays inside the case */}
        {[-0.5, 0, 0.5].map((x, i) => (
          <mesh key={x} position={[x, 1.26, 0.02]}><boxGeometry args={[0.4, 0.14, 0.5]} /><meshLambertMaterial color={[bowl, "#d8c0a0", "#c0502a"][i]} /></mesh>
        ))}

        {/* ── Stockpot (panci kuah) on the left with steam ── */}
        <mesh position={[-0.66, 1.32, 0]} castShadow><cylinderGeometry args={[0.26, 0.24, 0.34, 14]} /><meshLambertMaterial color="#b8bcc4" /></mesh>
        <mesh position={[-0.66, 1.5, 0]}><cylinderGeometry args={[0.28, 0.28, 0.05, 14]} /><meshLambertMaterial color="#9aa0aa" /></mesh>
        <mesh position={[-0.66, 1.72, 0]}><sphereGeometry args={[0.15, 6, 5]} /><meshLambertMaterial color="#ffffff" transparent opacity={0.35} /></mesh>
        <mesh position={[-0.62, 1.92, 0]}><sphereGeometry args={[0.12, 6, 5]} /><meshLambertMaterial color="#ffffff" transparent opacity={0.25} /></mesh>
        {/* bowls stacked on the right */}
        {[1.28, 1.4].map((y, i) => (
          <mesh key={y} position={[0.66, y, 0]}><cylinderGeometry args={[0.16, 0.13, 0.08, 12]} /><meshLambertMaterial color={i ? "#f0f0f0" : "#e0e0e0"} /></mesh>
        ))}

        {/* ── Canopy (terpal) on 4 posts ── */}
        {[[-0.85, 0.4], [0.85, 0.4], [-0.85, -0.4], [0.85, -0.4]].map(([x, z], i) => (
          <mesh key={i} position={[x, 2.0, z]}><cylinderGeometry args={[0.035, 0.035, 1.6, 6]} /><meshLambertMaterial color="#6a4020" /></mesh>
        ))}
        <mesh position={[0, 2.84, 0]} castShadow><boxGeometry args={[2.3, 0.1, 1.35]} /><meshLambertMaterial color={canopy} /></mesh>
        {/* scalloped valance (front + sides) */}
        <mesh position={[0, 2.7, 0.68]}><boxGeometry args={[2.3, 0.2, 0.04]} /><meshLambertMaterial color={canopy} /></mesh>
        <mesh position={[0, 2.7, 0.7]}><boxGeometry args={[2.3, 0.08, 0.02]} /><meshLambertMaterial color="#ffffff" /></mesh>

        {/* ── Name signboard ── */}
        <mesh position={[0, 2.5, 0.72]}><boxGeometry args={[1.5, 0.34, 0.05]} /><meshLambertMaterial color={sign} /></mesh>
        <mesh position={[0, 2.5, 0.75]}><boxGeometry args={[1.2, 0.18, 0.03]} /><meshLambertMaterial color="#ffffff" /></mesh>

        {/* ── Spoked wheels ── */}
        {[-0.75, 0.75].map((x) => (
          <group key={x} position={[x, 0.28, 0]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.28, 0.28, 0.1, 14]} /><meshLambertMaterial color="#3a3a3a" /></mesh>
            <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.1, 0.1, 0.12, 8]} /><meshLambertMaterial color="#b0b0b0" /></mesh>
          </group>
        ))}
        {/* push handle */}
        <mesh position={[1.06, 1.0, 0]} rotation={[0, 0, 0.4]}><cylinderGeometry args={[0.03, 0.03, 0.8, 6]} /><meshLambertMaterial color="#5a3a20" /></mesh>
        <mesh position={[1.24, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.03, 0.03, 0.5, 6]} /><meshLambertMaterial color="#3a2614" /></mesh>
      </group>
    );
  };
}

// ─── Halte (bus stop shelter) ────────────────────────────────────────────────
function Halte(props: PlaceholderProps) {
  return (
    <group {...props}>
      {/* Platform */}
      <mesh position={[0, 0.1, 0]} receiveShadow><boxGeometry args={[5, 0.2, 2]} /><meshLambertMaterial color="#b8b4ac" /></mesh>
      {/* Back wall (glass) */}
      <mesh position={[0, 1.3, -0.9]}><boxGeometry args={[5, 2.2, 0.1]} /><meshLambertMaterial color="#bfe0f0" transparent opacity={0.55} /></mesh>
      {/* Posts */}
      {[-2.3, 2.3].map((x) => (
        <mesh key={x} position={[x, 1.4, 0.8]} castShadow><boxGeometry args={[0.16, 2.8, 0.16]} /><meshLambertMaterial color="#3a6ea5" /></mesh>
      ))}
      {[-2.3, 2.3].map((x) => (
        <mesh key={`b${x}`} position={[x, 1.4, -0.85]}><boxGeometry args={[0.16, 2.8, 0.16]} /><meshLambertMaterial color="#3a6ea5" /></mesh>
      ))}
      {/* Roof */}
      <mesh position={[0, 2.85, 0]} castShadow><boxGeometry args={[5.4, 0.2, 2.4]} /><meshLambertMaterial color="#2f5f96" /></mesh>
      {/* Bench */}
      <mesh position={[0, 0.55, -0.5]}><boxGeometry args={[4, 0.12, 0.5]} /><meshLambertMaterial color="#9a6838" /></mesh>
      {[-1.6, 0, 1.6].map((x) => (
        <mesh key={x} position={[x, 0.32, -0.5]}><boxGeometry args={[0.1, 0.45, 0.5]} /><meshLambertMaterial color="#7a5028" /></mesh>
      ))}
      {/* Sign pylon "HALTE" */}
      <mesh position={[3.1, 1.6, 0.7]}><cylinderGeometry args={[0.07, 0.07, 3.2, 6]} /><meshLambertMaterial color="#888" /></mesh>
      <mesh position={[3.1, 3.0, 0.7]}><boxGeometry args={[1.0, 0.5, 0.08]} /><meshLambertMaterial color="#1f6fb2" /></mesh>
      <mesh position={[3.1, 3.0, 0.75]}><boxGeometry args={[0.8, 0.22, 0.03]} /><meshLambertMaterial color="#ffffff" /></mesh>
    </group>
  );
}

// ─── Stasiun KRL (commuter station) ──────────────────────────────────────────
function Station(props: PlaceholderProps) {
  return (
    <group {...props}>
      {/* Main hall */}
      <mesh position={[0, 4, 0]} castShadow receiveShadow><boxGeometry args={[24, 8, 12]} /><meshLambertMaterial color="#e8e0d0" /></mesh>
      {/* Glass front facade */}
      <mesh position={[0, 4, 6.05]}><planeGeometry args={[22, 6.5]} /><meshLambertMaterial color="#9cc8e6" transparent opacity={0.6} /></mesh>
      {/* Entrance canopy */}
      <mesh position={[0, 3.2, 7.2]} castShadow><boxGeometry args={[14, 0.4, 3]} /><meshLambertMaterial color="#c0392b" /></mesh>
      {[-6, 0, 6].map((x) => (
        <mesh key={x} position={[x, 1.6, 8.4]} castShadow><boxGeometry args={[0.3, 3.2, 0.3]} /><meshLambertMaterial color="#9a4034" /></mesh>
      ))}
      {/* Roof */}
      <mesh position={[0, 8.3, 0]} castShadow><boxGeometry args={[25, 0.6, 13]} /><meshLambertMaterial color="#b04030" /></mesh>
      {/* Signboard */}
      <mesh position={[0, 6.8, 6.2]}><boxGeometry args={[8, 1.2, 0.2]} /><meshLambertMaterial color="#1a3a6a" /></mesh>
      <mesh position={[0, 6.8, 6.32]}><boxGeometry args={[6.5, 0.5, 0.05]} /><meshLambertMaterial color="#ffffff" /></mesh>
      {/* Platform roof (rail side) */}
      <mesh position={[0, 5, -10]} castShadow><boxGeometry args={[30, 0.3, 6]} /><meshLambertMaterial color="#8aa0b0" /></mesh>
      {[-12, -4, 4, 12].map((x) => (
        <mesh key={x} position={[x, 2.6, -10]}><boxGeometry args={[0.3, 5, 0.3]} /><meshLambertMaterial color="#778896" /></mesh>
      ))}
      {/* Rails */}
      {[-11.5, -8.5].map((z) => (
        <mesh key={z} position={[0, 0.15, z]}><boxGeometry args={[34, 0.12, 0.18]} /><meshLambertMaterial color="#8a8a90" /></mesh>
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
        <mesh position={[0, 1.60, 0]} castShadow>
          <boxGeometry args={[0.38, 0.38, 0.36]} />
          <meshLambertMaterial color={skin} />
        </mesh>
        {/* Face details (Eyes and Mouth) */}
        <mesh position={[-0.08, 1.64, 0.185]}>
          <boxGeometry args={[0.06, 0.06, 0.02]} />
          <meshLambertMaterial color="#111" />
        </mesh>
        <mesh position={[0.08, 1.64, 0.185]}>
          <boxGeometry args={[0.06, 0.06, 0.02]} />
          <meshLambertMaterial color="#111" />
        </mesh>
        <mesh position={[0, 1.52, 0.185]}>
          <boxGeometry args={[0.12, 0.04, 0.02]} />
          <meshLambertMaterial color="#421" />
        </mesh>
        {/* Hair */}
        <mesh position={[0, 1.82, 0]}>
          <boxGeometry args={[0.41, 0.13, 0.39]} />
          <meshLambertMaterial color="#241608" />
        </mesh>
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

// ─── Minimarket (Indomaret / Alfamart) ──────────────────────────────────────
function makeMinimart(band: string, accent: string) {
  return function Minimart(props: PlaceholderProps) {
    return (
      <group {...props}>
        {/* Building body */}
        <mesh position={[0, 2.4, 0]} castShadow receiveShadow><boxGeometry args={[10, 4.8, 8]} /><meshLambertMaterial color="#f4f6f8" /></mesh>
        {/* Brand sign band across the top of the storefront */}
        <mesh position={[0, 4.45, 4.06]}><boxGeometry args={[10.1, 1.0, 0.3]} /><meshLambertMaterial color={band} /></mesh>
        {/* Accent stripe */}
        <mesh position={[0, 3.78, 4.07]}><boxGeometry args={[10.1, 0.28, 0.3]} /><meshLambertMaterial color={accent} /></mesh>
        {/* Sign text plate (white) */}
        <mesh position={[0, 4.45, 4.23]}><boxGeometry args={[5.2, 0.52, 0.05]} /><meshLambertMaterial color="#ffffff" /></mesh>
        {/* Glass storefront */}
        <mesh position={[0, 1.85, 4.03]}><boxGeometry args={[8.6, 3.0, 0.1]} /><meshLambertMaterial color="#bfe6f4" transparent opacity={0.6} /></mesh>
        {/* Glass mullions */}
        {[-2.8, 0, 2.8].map((x) => (
          <mesh key={x} position={[x, 1.85, 4.09]}><boxGeometry args={[0.12, 3.0, 0.08]} /><meshLambertMaterial color="#e8eef2" /></mesh>
        ))}
        {/* Automatic door frame */}
        <mesh position={[0, 1.5, 4.12]}><boxGeometry args={[1.9, 2.4, 0.08]} /><meshLambertMaterial color={accent} /></mesh>
        {/* Roof slab */}
        <mesh position={[0, 4.95, 0]} castShadow><boxGeometry args={[10.4, 0.45, 8.4]} /><meshLambertMaterial color="#d6dadf" /></mesh>
        {/* Rooftop AC units */}
        {[-2.4, 2.4].map((x) => (
          <mesh key={x} position={[x, 5.4, -2]} castShadow><boxGeometry args={[1.5, 0.85, 1.5]} /><meshLambertMaterial color="#cfd4da" /></mesh>
        ))}
        {/* Bollards out front */}
        {[-3.5, -1.2, 1.2, 3.5].map((x) => (
          <mesh key={x} position={[x, 0.4, 5.2]}><cylinderGeometry args={[0.12, 0.14, 0.8, 7]} /><meshLambertMaterial color={accent} /></mesh>
        ))}
      </group>
    );
  };
}

// ─── Warteg (warung makan) ───────────────────────────────────────────────────
function Warteg(props: PlaceholderProps) {
  return (
    <group {...props}>
      {/* Stall body */}
      <mesh position={[0, 1.6, -0.6]} castShadow receiveShadow><boxGeometry args={[6, 3.2, 3]} /><meshLambertMaterial color="#e8dcc0" /></mesh>
      {/* Open counter front */}
      <mesh position={[0, 1.0, 1.0]} castShadow><boxGeometry args={[6, 1.0, 0.6]} /><meshLambertMaterial color="#3a7a4a" /></mesh>
      <mesh position={[0, 1.55, 1.0]}><boxGeometry args={[5.6, 0.1, 0.7]} /><meshLambertMaterial color="#c8b890" /></mesh>
      {/* Glass food display (etalase) */}
      <mesh position={[0, 1.95, 1.0]}><boxGeometry args={[5.4, 0.7, 0.6]} /><meshLambertMaterial color="#bfe6f4" transparent opacity={0.5} /></mesh>
      {/* Food trays inside */}
      {[-1.8, -0.6, 0.6, 1.8].map((x, i) => (
        <mesh key={x} position={[x, 1.78, 1.0]}><boxGeometry args={[0.9, 0.18, 0.4]} /><meshLambertMaterial color={["#d8a040", "#c0502a", "#e8c850", "#9a6a3a"][i]} /></mesh>
      ))}
      {/* Awning / banner sign */}
      <mesh position={[0, 3.3, 1.3]} rotation={[0.25, 0, 0]} castShadow><boxGeometry args={[6.4, 0.1, 1.6]} /><meshLambertMaterial color="#d11f2a" /></mesh>
      <mesh position={[0, 3.5, 0.6]}><boxGeometry args={[6.2, 0.7, 0.1]} /><meshLambertMaterial color="#f5c518" /></mesh>
      <mesh position={[0, 3.5, 0.66]}><boxGeometry args={[4.4, 0.4, 0.04]} /><meshLambertMaterial color="#7a1010" /></mesh>
      {/* Roof */}
      <mesh position={[0, 3.3, -0.6]} castShadow><boxGeometry args={[6.4, 0.3, 3.4]} /><meshLambertMaterial color="#9a6838" /></mesh>
      {/* Plastic stools out front */}
      {[-2, 0, 2].map((x) => (
        <group key={x} position={[x, 0, 2.2]}>
          <mesh position={[0, 0.45, 0]}><cylinderGeometry args={[0.22, 0.18, 0.1, 10]} /><meshLambertMaterial color="#cc3333" /></mesh>
          <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.05, 0.05, 0.45, 6]} /><meshLambertMaterial color="#b02828" /></mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Standing vendor (penjual at a cart) ─────────────────────────────────────
function makeSeller(shirt: string) {
  return function Seller(props: PlaceholderProps) {
    const skin = "#c8956b";
    return (
      <group {...props}>
        <mesh position={[0, 1.56, 0]} castShadow><boxGeometry args={[0.36, 0.36, 0.34]} /><meshLambertMaterial color={skin} /></mesh>
        {/* peci / cap */}
        <mesh position={[0, 1.78, 0]}><boxGeometry args={[0.38, 0.14, 0.36]} /><meshLambertMaterial color="#2a2a3a" /></mesh>
        {/* apron torso */}
        <mesh position={[0, 1.08, 0]} castShadow><boxGeometry args={[0.46, 0.62, 0.28]} /><meshLambertMaterial color={shirt} /></mesh>
        <mesh position={[0, 1.0, 0.15]}><boxGeometry args={[0.4, 0.5, 0.02]} /><meshLambertMaterial color="#f0f0f0" /></mesh>
        {/* arms */}
        <mesh position={[-0.3, 1.14, 0.05]} rotation={[0.5, 0, 0.1]}><boxGeometry args={[0.12, 0.46, 0.14]} /><meshLambertMaterial color={shirt} /></mesh>
        <mesh position={[0.3, 1.14, 0.05]} rotation={[0.5, 0, -0.1]}><boxGeometry args={[0.12, 0.46, 0.14]} /><meshLambertMaterial color={shirt} /></mesh>
        {/* legs */}
        <mesh position={[-0.12, 0.42, 0]}><boxGeometry args={[0.17, 0.5, 0.22]} /><meshLambertMaterial color="#33415a" /></mesh>
        <mesh position={[0.12, 0.42, 0]}><boxGeometry args={[0.17, 0.5, 0.22]} /><meshLambertMaterial color="#33415a" /></mesh>
        <mesh position={[-0.12, 0.12, 0.05]}><boxGeometry args={[0.16, 0.12, 0.3]} /><meshLambertMaterial color="#2a2018" /></mesh>
        <mesh position={[0.12, 0.12, 0.05]}><boxGeometry args={[0.16, 0.12, 0.3]} /><meshLambertMaterial color="#2a2018" /></mesh>
      </group>
    );
  };
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

  // Street-food carts — distinct canopy + sign + bowl color per dagangan
  registerAsset("cart_bakso",  { placeholder: makeCart("#e03820", "#b02818", "#d8c0a0") });
  registerAsset("cart_somay",  { placeholder: makeCart("#2f9e44", "#1f7a32", "#e8d040") });
  registerAsset("cart_cilok",  { placeholder: makeCart("#f0a020", "#c87810", "#a06030") });
  registerAsset("cart_esteh",  { placeholder: makeCart("#1f8fd0", "#1670a8", "#caa050") });
  registerAsset("cart_nasgor", { placeholder: makeCart("#d83838", "#a02020", "#e8c060") });
  // back-compat alias
  registerAsset("vendor_cart", { placeholder: makeCart("#e03820", "#b02818", "#d8c0a0") });

  // Street structures
  registerAsset("halte",   { placeholder: Halte });
  registerAsset("station", { placeholder: Station });

  // Minimarkets + warteg
  registerAsset("store_indomaret", { placeholder: makeMinimart("#1763b6", "#e23b2e") }); // blue + red
  registerAsset("store_alfamart",  { placeholder: makeMinimart("#d11f2a", "#f5c518") }); // red + yellow
  registerAsset("store_warteg",    { placeholder: Warteg });

  // Vendor sellers (penjual) — colour-coded per dagangan
  registerAsset("seller_bakso",  { placeholder: makeSeller("#c0392b") });
  registerAsset("seller_somay",  { placeholder: makeSeller("#27ae60") });
  registerAsset("seller_cilok",  { placeholder: makeSeller("#e08a20") });
  registerAsset("seller_esteh",  { placeholder: makeSeller("#2980b9") });
  registerAsset("seller_nasgor", { placeholder: makeSeller("#b03030") });
  registerAsset("seller_mieayam",{ placeholder: makeSeller("#d4a017") });
}
