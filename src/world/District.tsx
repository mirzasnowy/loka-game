"use client";

import { Text } from "@react-three/drei";
import { DISTRICT, type Parcel } from "./districtData";

/**
 * The 10-parcel branded commercial district. Each parcel is rendered in LOCAL
 * space (front/road side = -z, building mass extends +z). Detailed low-poly
 * Indonesian commercial architecture with signage, glass, parking, landscaping
 * and proper vehicle circulation — all confined inside the parcel.
 */

const ASPHALT = "#34373c";
const STALL = "#e9e9e2";
const CONCRETE = "#b9b6ad";
const GLASS = "#bfe0f2";
const DARKGLASS = "#27506a";

/* ─────────────────────────── shared helpers ─────────────────────────── */

function Pad({ w, d, x = 0, z = 0, color = CONCRETE, y = 0.03 }: { w: number; d: number; x?: number; z?: number; color?: string; y?: number }) {
  return (
    <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[w, d]} /><meshLambertMaterial color={color} />
    </mesh>
  );
}

function Stalls({ n, x, z, span, depth = 4.6 }: { n: number; x: number; z: number; span: number; depth?: number }) {
  const step = span / n;
  return (
    <group>
      {Array.from({ length: n + 1 }, (_, i) => (
        <mesh key={i} position={[x - span / 2 + i * step, 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.13, depth]} /><meshBasicMaterial color={STALL} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function MiniCar({ x, z, rot = 0, color = "#cccccc" }: { x: number; z: number; rot?: number; color?: string }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.42, 0]} castShadow><boxGeometry args={[1.7, 0.5, 3.9]} /><meshLambertMaterial color={color} /></mesh>
      <mesh position={[0, 0.8, -0.25]} castShadow><boxGeometry args={[1.55, 0.5, 2.0]} /><meshLambertMaterial color={color} /></mesh>
      <mesh position={[0, 0.82, -0.25]}><boxGeometry args={[1.58, 0.34, 1.78]} /><meshLambertMaterial color={GLASS} transparent opacity={0.8} /></mesh>
      {([[-0.82, 1.3], [0.82, 1.3], [-0.82, -1.3], [0.82, -1.3]] as [number, number][]).map(([wx, wz], i) => (
        <mesh key={i} position={[wx, 0.28, wz]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.3, 0.3, 0.18, 8]} /><meshLambertMaterial color="#222" /></mesh>
      ))}
    </group>
  );
}

function MiniMoto({ x, z, rot = 0, color = "#d83030" }: { x: number; z: number; rot?: number; color?: string }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow><boxGeometry args={[0.4, 0.32, 1.4]} /><meshLambertMaterial color={color} /></mesh>
      <mesh position={[0, 0.72, 0.55]}><boxGeometry args={[0.42, 0.34, 0.2]} /><meshLambertMaterial color={color} /></mesh>
      {[0.55, -0.55].map((wz) => (
        <mesh key={wz} position={[0, 0.26, wz]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.26, 0.26, 0.12, 10]} /><meshLambertMaterial color="#1a1a1a" /></mesh>
      ))}
    </group>
  );
}

function Tree({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.3 * s, 0]} castShadow><cylinderGeometry args={[0.18 * s, 0.24 * s, 2.6 * s, 6]} /><meshLambertMaterial color="#7a4f22" /></mesh>
      <mesh position={[0, 3.0 * s, 0]} castShadow><sphereGeometry args={[1.5 * s, 8, 6]} /><meshLambertMaterial color="#2f8a44" /></mesh>
      <mesh position={[0, 4.0 * s, 0]}><sphereGeometry args={[1.05 * s, 7, 5]} /><meshLambertMaterial color="#3aa05a" /></mesh>
    </group>
  );
}

function Lamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2.1, 0]} castShadow><cylinderGeometry args={[0.08, 0.1, 4.2, 6]} /><meshLambertMaterial color="#8a8f98" /></mesh>
      <mesh position={[0, 4.2, 0]}><sphereGeometry args={[0.22, 8, 6]} /><meshBasicMaterial color="#fff0b0" toneMapped={false} /></mesh>
    </group>
  );
}

function Bollard({ x, z }: { x: number; z: number }) {
  return <mesh position={[x, 0.45, z]}><cylinderGeometry args={[0.1, 0.12, 0.9, 7]} /><meshLambertMaterial color="#d0cdc4" /></mesh>;
}

function Sign({ name, color, textColor = "#ffffff", x = 0, y, z, w, h, font }: { name: string; color: string; textColor?: string; x?: number; y: number; z: number; w: number; h: number; font?: number }) {
  return (
    <group position={[x, y, z]} rotation={[0, Math.PI, 0]}>
      <mesh castShadow><boxGeometry args={[w, h, 0.3]} /><meshLambertMaterial color={color} emissive={color} emissiveIntensity={0.25} /></mesh>
      <Text position={[0, 0, 0.17]} fontSize={font ?? Math.min(h * 0.6, (w / Math.max(name.length, 6)) * 1.4)} color={textColor} anchorX="center" anchorY="middle" maxWidth={w * 0.92} outlineWidth={0.015} outlineColor="#00000088">{name}</Text>
    </group>
  );
}

/** Flat entrance/drop-off canopy on posts. */
function Canopy({ w, d, h = 3.2, x = 0, z, color = "#d8d8da" }: { w: number; d: number; h?: number; x?: number; z: number; color?: string }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h, 0]} castShadow><boxGeometry args={[w, 0.25, d]} /><meshLambertMaterial color={color} /></mesh>
      {([[-w / 2 + 0.4, -d / 2 + 0.4], [w / 2 - 0.4, -d / 2 + 0.4], [-w / 2 + 0.4, d / 2 - 0.4], [w / 2 - 0.4, d / 2 - 0.4]] as [number, number][]).map(([px, pz], i) => (
        <mesh key={i} position={[px, h / 2, pz]}><boxGeometry args={[0.2, h, 0.2]} /><meshLambertMaterial color="#9a9a9e" /></mesh>
      ))}
    </group>
  );
}

/** Glass curtain wall with horizontal floor mullions across a building front. */
function GlassFront({ w, h, floors = 1, x = 0, y, z, color = GLASS }: { w: number; h: number; floors?: number; x?: number; y: number; z: number; color?: string }) {
  return (
    <group position={[x, y, z]}>
      <mesh><boxGeometry args={[w, h, 0.1]} /><meshLambertMaterial color={color} transparent opacity={0.62} /></mesh>
      {Array.from({ length: floors + 1 }, (_, i) => (
        <mesh key={i} position={[0, -h / 2 + (i * h) / floors, 0.06]}><boxGeometry args={[w, 0.12, 0.06]} /><meshLambertMaterial color="#dfe6ea" /></mesh>
      ))}
    </group>
  );
}

function RoofAC({ x, z, y }: { x: number; z: number; y: number }) {
  return <mesh position={[x, y, z]} castShadow><boxGeometry args={[1.4, 0.8, 1.4]} /><meshLambertMaterial color="#b8bcc2" /></mesh>;
}

/* car park apron in front of a shop (z negative = toward road) */
function FrontLot({ cars = [], motos = 3 }: { cars?: string[]; motos?: number }) {
  return (
    <group>
      <Pad w={26} d={12} z={-7} color={ASPHALT} />
      <Stalls n={6} x={0} z={-9.5} span={24} />
      {cars.map((col, i) => <MiniCar key={i} x={-9 + i * 3.6} z={-9.5} color={col} />)}
      {Array.from({ length: motos }, (_, i) => <MiniMoto key={`m${i}`} x={9.5 + 0} z={-12 + i * 1.0} rot={Math.PI / 2} color={["#d83030", "#2a64c0", "#222"][i % 3]} />)}
      {/* driveway curb cut toward the road */}
      <Pad w={5} d={3} x={0} z={-13.5} color={ASPHALT} />
    </group>
  );
}

/* ───────────────────────────── buildings ───────────────────────────── */

function Gacoan() {
  return (
    <group>
      <FrontLot cars={["#d0d0d4", "#1a1a1a", "#b5302e"]} />
      {/* two-storey block */}
      <mesh position={[0, 4, 6]} castShadow receiveShadow><boxGeometry args={[17, 8, 12]} /><meshLambertMaterial color="#f4ece4" /></mesh>
      <mesh position={[0, 8.2, 6]} castShadow><boxGeometry args={[17.4, 0.5, 12.4]} /><meshLambertMaterial color="#b32028" /></mesh>
      <GlassFront w={15} h={6.4} floors={2} y={3.6} z={0.05} />
      {/* big red sign band */}
      <mesh position={[0, 6.6, 0.2]}><boxGeometry args={[17, 1.8, 0.3]} /><meshLambertMaterial color="#d6202a" emissive="#d6202a" emissiveIntensity={0.3} /></mesh>
      <Sign name="Mie Gacoan" color="#d6202a" y={6.6} z={0.42} w={11} h={1.5} />
      {/* entrance + canopy + outdoor waiting */}
      <Canopy w={6} d={3} x={0} z={-1.6} color="#c0392b" />
      <mesh position={[0, 1.4, 0.1]}><boxGeometry args={[3, 2.8, 0.2]} /><meshLambertMaterial color={DARKGLASS} transparent opacity={0.8} /></mesh>
      {[-5, -3.4].map((x) => <mesh key={x} position={[x, 0.45, -2.6]}><boxGeometry args={[1.3, 0.5, 0.5]} /><meshLambertMaterial color="#c0392b" /></mesh>)}
      <RoofAC x={5} z={9} y={8.9} /><RoofAC x={-5} z={9} y={8.9} />
    </group>
  );
}

function ConvStore({ wall, band, accent, name }: { wall: string; band: string; accent: string; name: string }) {
  return (
    <group>
      <FrontLot cars={["#e8e8ea", "#2f6f4f"]} />
      <mesh position={[0, 2.5, 5]} castShadow receiveShadow><boxGeometry args={[15, 5, 10]} /><meshLambertMaterial color={wall} /></mesh>
      <mesh position={[0, 5.1, 5]} castShadow><boxGeometry args={[15.4, 0.6, 10.4]} /><meshLambertMaterial color="#d6dadf" /></mesh>
      {/* brand band */}
      <mesh position={[0, 4.4, 0.1]}><boxGeometry args={[15, 1.1, 0.25]} /><meshLambertMaterial color={band} emissive={band} emissiveIntensity={0.25} /></mesh>
      <mesh position={[0, 3.78, 0.12]}><boxGeometry args={[15, 0.28, 0.25]} /><meshLambertMaterial color={accent} /></mesh>
      <Sign name={name} color={band} y={4.4} z={0.3} w={9} h={0.85} />
      <GlassFront w={12.5} h={2.8} x={0} y={2} z={0.05} color={GLASS} />
      {/* automatic door */}
      <mesh position={[0, 1.4, 0.12]}><boxGeometry args={[2, 2.6, 0.1]} /><meshLambertMaterial color={accent} /></mesh>
      {/* ATM corner */}
      <mesh position={[-6, 1.0, -0.4]} castShadow><boxGeometry args={[1.2, 2, 0.8]} /><meshLambertMaterial color="#2a2a32" /></mesh>
      <RoofAC x={4} z={8} y={5.6} />
    </group>
  );
}

function KopiKenangan() {
  return (
    <group>
      {/* drive-through lane on the right + small lot */}
      <Pad w={26} d={12} z={-7} color={ASPHALT} />
      <Pad w={4} d={12} x={10} z={-7} color="#2a2c30" />
      {Array.from({ length: 4 }, (_, i) => <mesh key={i} position={[10, 0.05, -12 + i * 3]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.3, 1.2]} /><meshBasicMaterial color="#e8c040" toneMapped={false} /></mesh>)}
      <Stalls n={4} x={-3} z={-9.5} span={14} />
      <MiniCar x={-8} z={-9.5} color="#c7cbd2" /><MiniCar x={-4.4} z={-9.5} color="#23262c" />
      {/* café box */}
      <mesh position={[2, 2.75, 5]} castShadow receiveShadow><boxGeometry args={[12, 5.5, 10]} /><meshLambertMaterial color="#3a2522" /></mesh>
      <GlassFront w={11} h={3.8} x={2} y={2.4} z={0.05} color={DARKGLASS} />
      <mesh position={[2, 5.6, 5]} castShadow><boxGeometry args={[12.4, 0.5, 10.4]} /><meshLambertMaterial color="#241715" /></mesh>
      <Sign name="Kopi Kenangan" color="#241715" textColor="#e7c87a" y={4.7} z={0.3} w={9.5} h={1.0} />
      <Canopy w={5} d={2.6} x={2} z={-1.4} color="#241715" />
      {/* outdoor seating (umbrellas) */}
      {[-9, -6].map((x) => (
        <group key={x} position={[x, 0, -3]}>
          <mesh position={[0, 0.75, 0]}><cylinderGeometry args={[0.05, 0.05, 1.5, 6]} /><meshLambertMaterial color="#555" /></mesh>
          <mesh position={[0, 1.6, 0]}><coneGeometry args={[1.3, 0.5, 8]} /><meshLambertMaterial color="#2f8a44" /></mesh>
        </group>
      ))}
      {/* bicycle rack */}
      <mesh position={[8, 0.4, -3]}><boxGeometry args={[2, 0.6, 0.1]} /><meshLambertMaterial color="#888" /></mesh>
    </group>
  );
}

function GymBuilding({ name, wall, accent, glassColor }: { name: string; wall: string; accent: string; glassColor: string }) {
  return (
    <group>
      <FrontLot cars={["#1a1a1a", "#c7cbd2", "#b5302e"]} motos={2} />
      <mesh position={[0, 6, 6]} castShadow receiveShadow><boxGeometry args={[16, 12, 13]} /><meshLambertMaterial color={wall} /></mesh>
      <GlassFront w={14.5} h={11} floors={3} x={0} y={6} z={0.06} color={glassColor} />
      <mesh position={[0, 12.3, 6]} castShadow><boxGeometry args={[16.4, 0.6, 13.4]} /><meshLambertMaterial color={accent} /></mesh>
      {/* reception entrance + canopy */}
      <Canopy w={6} d={3} x={0} z={-1.6} color={accent} />
      <mesh position={[0, 1.8, 0.1]}><boxGeometry args={[4, 3.6, 0.2]} /><meshLambertMaterial color={DARKGLASS} transparent opacity={0.85} /></mesh>
      <Sign name={name} color={accent} y={9.5} z={0.3} w={12} h={1.6} />
      <RoofAC x={5} z={9} y={13} /><RoofAC x={-5} z={9} y={13} /><RoofAC x={0} z={9} y={13} />
      {/* side emergency exit */}
      <mesh position={[8.05, 1.4, 8]}><boxGeometry args={[0.1, 2.6, 1.4]} /><meshLambertMaterial color="#2f7d46" /></mesh>
    </group>
  );
}

function Hermina() {
  return (
    <group>
      {/* patient drop-off + visitor parking + ambulance bay (left) */}
      <Pad w={26} d={12} z={-7} color={ASPHALT} />
      <Stalls n={5} x={2} z={-9.5} span={18} />
      <MiniCar x={-3} z={-9.5} color="#e8e8ea" /><MiniCar x={0.6} z={-9.5} color="#27478a" />
      {/* hospital block */}
      <mesh position={[0, 6.5, 6.5]} castShadow receiveShadow><boxGeometry args={[18, 13, 13]} /><meshLambertMaterial color="#f3f5f7" /></mesh>
      <GlassFront w={16.5} h={11.5} floors={4} x={0} y={6.5} z={0.06} color="#bfe0ea" />
      <mesh position={[0, 13.2, 6.5]} castShadow><boxGeometry args={[18.4, 0.6, 13.4]} /><meshLambertMaterial color="#1aa0a0" /></mesh>
      {/* teal band + red cross + name */}
      <mesh position={[0, 11, 0.12]}><boxGeometry args={[18, 1.6, 0.25]} /><meshLambertMaterial color="#0f9d9d" emissive="#0f9d9d" emissiveIntensity={0.25} /></mesh>
      <Sign name="RS Hermina" color="#0f9d9d" y={11} z={0.3} w={11} h={1.4} />
      <group position={[-7.5, 11, -0.3]} rotation={[0, Math.PI, 0]}>
        <mesh><boxGeometry args={[1.4, 0.4, 0.3]} /><meshBasicMaterial color="#e8202a" toneMapped={false} /></mesh>
        <mesh><boxGeometry args={[0.4, 1.4, 0.3]} /><meshBasicMaterial color="#e8202a" toneMapped={false} /></mesh>
      </group>
      {/* drop-off canopy + ambulance */}
      <Canopy w={8} d={4} x={0} z={-2} color="#dfe6ea" />
      <MiniCar x={-9.5} z={-3} rot={Math.PI / 2} color="#f0f0f2" />
      <mesh position={[-9.5, 1.6, -3]}><boxGeometry args={[0.1, 0.5, 1.6]} /><meshBasicMaterial color="#e8202a" toneMapped={false} /></mesh>
      <RoofAC x={6} z={10} y={13.9} /><RoofAC x={-6} z={10} y={13.9} />
    </group>
  );
}

function SPBU() {
  return (
    <group>
      {/* big canopy over the pumps (front-left), small store back-right */}
      <Pad w={26} d={24} z={-2} color={ASPHALT} />
      {/* canopy */}
      <group position={[-5, 0, -4]}>
        <mesh position={[0, 5.6, 0]} castShadow><boxGeometry args={[14, 0.6, 11]} /><meshLambertMaterial color="#f2f2f4" /></mesh>
        <mesh position={[0, 5.0, 0]}><boxGeometry args={[14.2, 0.5, 11.2]} /><meshLambertMaterial color="#d6202a" /></mesh>
        <mesh position={[0, 4.6, 0]}><boxGeometry args={[14.2, 0.3, 11.2]} /><meshLambertMaterial color="#1f8a4c" /></mesh>
        {([[-6, -4.5], [6, -4.5], [-6, 4.5], [6, 4.5]] as [number, number][]).map(([px, pz], i) => (
          <mesh key={i} position={[px, 2.8, pz]}><boxGeometry args={[0.5, 5.6, 0.5]} /><meshLambertMaterial color="#e8e8ea" /></mesh>
        ))}
        {/* fuel pumps */}
        {[-3.5, 3.5].map((px) => (
          <group key={px} position={[px, 0, 0]}>
            <mesh position={[0, 1.0, 0]} castShadow><boxGeometry args={[0.8, 2, 1.2]} /><meshLambertMaterial color="#e9eef2" /></mesh>
            <mesh position={[0, 1.5, 0.65]}><boxGeometry args={[0.6, 0.6, 0.1]} /><meshBasicMaterial color="#222" toneMapped={false} /></mesh>
          </group>
        ))}
      </group>
      {/* sign totem */}
      <group position={[10, 0, -11]}>
        <mesh position={[0, 3, 0]}><boxGeometry args={[0.5, 6, 0.5]} /><meshLambertMaterial color="#888" /></mesh>
        <mesh position={[0, 6.2, 0]}><boxGeometry args={[2.6, 1.6, 0.4]} /><meshLambertMaterial color="#ffffff" /></mesh>
        <Sign name="Pertamina" color="#ffffff" textColor="#1f8a4c" y={6.2} z={0.22} w={2.4} h={1.4} font={0.4} />
      </group>
      {/* convenience store */}
      <mesh position={[9, 2, 9]} castShadow receiveShadow><boxGeometry args={[7, 4, 6]} /><meshLambertMaterial color="#eef0f2" /></mesh>
      <GlassFront w={6} h={2.4} x={9} y={1.8} z={6.05} color={GLASS} />
      <Sign name="Bright" color="#e02424" y={3.6} z={5.85} w={4} h={0.8} font={0.4} />
    </group>
  );
}

function Richeese() {
  return (
    <group>
      {/* drive-through lane (right) + lot + outdoor seating */}
      <Pad w={26} d={12} z={-7} color={ASPHALT} />
      <Pad w={4} d={13} x={10} z={-6} color="#2a2c30" />
      {Array.from({ length: 5 }, (_, i) => <mesh key={i} position={[10, 0.05, -12 + i * 3]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.3, 1.2]} /><meshBasicMaterial color="#f5c518" toneMapped={false} /></mesh>)}
      <Stalls n={4} x={-3} z={-9.5} span={14} />
      <MiniCar x={-8} z={-9.5} color="#b5302e" /><MiniCar x={-4.4} z={-9.5} color="#e8e8ea" />
      <mesh position={[2, 3, 5.5]} castShadow receiveShadow><boxGeometry args={[12, 6, 11]} /><meshLambertMaterial color="#fbf3e0" /></mesh>
      <mesh position={[2, 6.3, 5.5]} castShadow><boxGeometry args={[12.4, 0.6, 11.4]} /><meshLambertMaterial color="#d6202a" /></mesh>
      <GlassFront w={11} h={3.6} x={2} y={2.4} z={0.06} />
      <mesh position={[2, 5, 0.1]}><boxGeometry args={[12, 1.4, 0.25]} /><meshLambertMaterial color="#f5c518" emissive="#f5c518" emissiveIntensity={0.3} /></mesh>
      <Sign name="Richeese Factory" color="#d6202a" textColor="#ffe14a" y={5} z={0.3} w={10} h={1.1} />
      <Canopy w={5} d={2.6} x={2} z={-1.4} color="#d6202a" />
      {/* outdoor tables */}
      {[-9, -6.5].map((x) => (
        <group key={x} position={[x, 0, -3]}>
          <mesh position={[0, 0.74, 0]}><cylinderGeometry args={[0.6, 0.6, 0.08, 12]} /><meshLambertMaterial color="#e8d8b8" /></mesh>
          <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.08, 0.08, 0.74, 6]} /><meshLambertMaterial color="#999" /></mesh>
        </group>
      ))}
    </group>
  );
}

function Mall() {
  return (
    <group>
      {/* big covered drop-off + landscaped plaza in front */}
      <Pad w={30} d={13} z={-7.5} color={CONCRETE} />
      <Pad w={30} d={5} z={-13} color={ASPHALT} />
      {/* main mass */}
      <mesh position={[0, 7.5, 5]} castShadow receiveShadow><boxGeometry args={[24, 15, 18]} /><meshLambertMaterial color="#efe7d6" /></mesh>
      {/* glass atrium centre + side wings */}
      <GlassFront w={10} h={13} floors={5} x={0} y={7} z={-3.96} color={DARKGLASS} />
      <GlassFront w={6} h={11} floors={4} x={-9} y={6} z={-3.96} />
      <GlassFront w={6} h={11} floors={4} x={9} y={6} z={-3.96} />
      <mesh position={[0, 15.2, 5]} castShadow><boxGeometry args={[24.4, 0.7, 18.4]} /><meshLambertMaterial color="#c9a45a" /></mesh>
      {/* big drop-off canopy + entrances */}
      <Canopy w={14} d={5} x={0} z={-5} h={4.2} color="#d8cba0" />
      {[-5, 0, 5].map((x) => <mesh key={x} position={[x, 2, -3.9]}><boxGeometry args={[3, 4, 0.2]} /><meshLambertMaterial color={DARKGLASS} transparent opacity={0.85} /></mesh>)}
      {/* rooftop sign */}
      <Sign name="Summarecon Mall" color="#c9a45a" textColor="#3a2a12" y={13} z={-4.2} w={16} h={2.0} />
      {/* drop-off cars */}
      <MiniCar x={-4} z={-6} color="#1a1a1a" /><MiniCar x={2} z={-6} color="#e8e8ea" />
      {/* plaza planters + bollards */}
      {[-11, -7, 7, 11].map((x) => <Bollard key={x} x={x} z={-10} />)}
      {[-12, 12].map((x) => <Tree key={x} x={x} z={-11} s={1.1} />)}
      <RoofAC x={8} z={11} y={16} /><RoofAC x={-8} z={11} y={16} /><RoofAC x={0} z={11} y={16} />
    </group>
  );
}

/* ─────────────────────────── parcel wrapper ─────────────────────────── */

function Building({ id }: { id: string }) {
  switch (id) {
    case "gacoan": return <Gacoan />;
    case "indomaret": return <ConvStore name="Indomaret" wall="#f4f6f8" band="#1763b6" accent="#e23b2e" />;
    case "alfamart": return <ConvStore name="Alfamart" wall="#f6f6f8" band="#d11f2a" accent="#f5c518" />;
    case "kopken": return <KopiKenangan />;
    case "fitfirst": return <GymBuilding name="Fitness First" wall="#20242e" accent="#e23b2e" glassColor="#3a5a72" />;
    case "hermina": return <Hermina />;
    case "spbu": return <SPBU />;
    case "richeese": return <Richeese />;
    case "celebrity": return <GymBuilding name="Celebrity Fitness" wall="#2a2030" accent="#e0218a" glassColor="#4a4a72" />;
    case "mall": return <Mall />;
    default: return null;
  }
}

/** Tall illuminated roadside pylon sign so the place is visible from far away. */
function Pylon({ name, color, textColor }: { name: string; color: string; textColor: string }) {
  return (
    <group position={[-13, 0, -13.5]}>
      <mesh position={[0, 5.6, 0]} castShadow><cylinderGeometry args={[0.22, 0.3, 11.2, 8]} /><meshLambertMaterial color="#9aa0a8" /></mesh>
      <group position={[0, 11.4, 0]} rotation={[0, Math.PI, 0]}>
        <mesh castShadow><boxGeometry args={[5, 2.3, 0.45]} /><meshLambertMaterial color={color} emissive={color} emissiveIntensity={0.55} /></mesh>
        <mesh position={[0, 0, 0.24]}><boxGeometry args={[4.7, 2.0, 0.06]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
        <Text position={[0, 0, 0.3]} fontSize={0.6} color={textColor} anchorX="center" anchorY="middle" maxWidth={4.5} outlineWidth={0.02} outlineColor="#00000088">{name}</Text>
      </group>
    </group>
  );
}

function ParcelGroup({ p }: { p: Parcel }) {
  return (
    <group position={[p.cx, 0, p.cz]}>
      {/* concrete parcel pad + perimeter landscaping + lamps */}
      <Pad w={30} d={30} color="#7da06b" y={0.02} />
      <Building id={p.id} />
      <Pylon name={p.name} color={p.color} textColor={p.textColor} />
      {/* corner trees + lamps (don't double up for spbu/mall which manage their own) */}
      {p.id !== "spbu" && p.id !== "mall" && (
        <>
          <Tree x={13} z={-12} />
          <Lamp x={-13} z={-2} /><Lamp x={13} z={-2} />
        </>
      )}
    </group>
  );
}

export default function District() {
  return (
    <>
      {DISTRICT.map((p) => <ParcelGroup key={p.id} p={p} />)}
    </>
  );
}
