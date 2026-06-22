"use client";

import { Text } from "@react-three/drei";
import { DPR } from "./dprData";

/* Kompleks Gedung DPR/MPR/RI — built in world space (centre ≈ (0,192)). */

const WHITE = "#eef0f0";
const CONC = "#b9b7ad";
const PLAZA = "#cfcabf";
const LAWN = "#5fa54a";
const GREEN = "#3f8a52"; // the iconic roof
const GLASS = "#9fd0e8";

function Slab({ w, d, x, z, color, y = 0.16 }: { w: number; d: number; x: number; z: number; color: string; y?: number }) {
  return <mesh position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[w, d]} /><meshLambertMaterial color={color} /></mesh>;
}

function Block({ w, h, d, x, z, color = WHITE, glassFront }: { w: number; h: number; d: number; x: number; z: number; color?: string; glassFront?: boolean }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow><boxGeometry args={[w, h, d]} /><meshLambertMaterial color={color} /></mesh>
      {/* horizontal window bands */}
      {Array.from({ length: Math.max(1, Math.floor(h / 4)) }, (_, i) => (
        <mesh key={i} position={[0, 2.4 + i * 4, -d / 2 - 0.05]}><boxGeometry args={[w * 0.92, 1.6, 0.1]} /><meshLambertMaterial color={GLASS} transparent opacity={0.7} /></mesh>
      ))}
      {glassFront && <mesh position={[0, h / 2, -d / 2 - 0.06]}><boxGeometry args={[w * 0.9, h * 0.86, 0.1]} /><meshLambertMaterial color="#2f6a86" transparent opacity={0.55} /></mesh>}
    </group>
  );
}

function Tree({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.3 * s, 0]} castShadow><cylinderGeometry args={[0.16 * s, 0.22 * s, 2.6 * s, 6]} /><meshLambertMaterial color="#7a4f22" /></mesh>
      <mesh position={[0, 3.0 * s, 0]} castShadow><sphereGeometry args={[1.4 * s, 8, 6]} /><meshLambertMaterial color="#2f8a44" /></mesh>
    </group>
  );
}

function Lamp({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 2.1, 0]}><cylinderGeometry args={[0.08, 0.1, 4.2, 6]} /><meshLambertMaterial color="#8a8f98" /></mesh>
      <mesh position={[0, 4.2, 0]}><sphereGeometry args={[0.22, 8, 6]} /><meshBasicMaterial color="#fff0b0" toneMapped={false} /></mesh>
    </group>
  );
}

/* Pindad-style guard: simple standing figure in dark uniform. */
function Guard({ x, z, ry = 0 }: { x: number; z: number; ry?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow><boxGeometry args={[0.5, 1.1, 0.32]} /><meshLambertMaterial color="#26303f" /></mesh>
      <mesh position={[0, 0.18, 0]}><boxGeometry args={[0.5, 0.5, 0.32]} /><meshLambertMaterial color="#1b2230" /></mesh>
      <mesh position={[0, 1.32, 0]} castShadow><sphereGeometry args={[0.21, 8, 6]} /><meshLambertMaterial color="#d8a878" /></mesh>
      <mesh position={[0, 1.46, 0]}><cylinderGeometry args={[0.23, 0.23, 0.12, 8]} /><meshLambertMaterial color="#11161f" /></mesh>
    </group>
  );
}

/* Striped boom barrier. */
function Barrier({ x, z, ry = 0 }: { x: number; z: number; ry?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      <mesh position={[0, 0.5, 0]}><boxGeometry args={[0.3, 1, 0.3]} /><meshLambertMaterial color="#d8d8d8" /></mesh>
      <mesh position={[2, 0.95, 0]}><boxGeometry args={[4, 0.16, 0.16]} /><meshBasicMaterial color="#e02424" toneMapped={false} /></mesh>
      {[0.5, 1.5, 2.5, 3.5].map((o) => <mesh key={o} position={[o, 0.95, 0.01]}><boxGeometry args={[0.5, 0.17, 0.17]} /><meshBasicMaterial color="#ffffff" toneMapped={false} /></mesh>)}
    </group>
  );
}

/** Perimeter fence: dwarf wall + railing posts along a side (with optional gap). */
function FenceRun({ x, z, len, axis }: { x: number; z: number; len: number; axis: "x" | "z" }) {
  const horiz = axis === "x";
  return (
    <group position={[x, 0, z]} rotation={[0, horiz ? 0 : Math.PI / 2, 0]}>
      <mesh position={[0, 0.6, 0]} castShadow><boxGeometry args={[len, 1.2, 0.4]} /><meshLambertMaterial color="#cdccc4" /></mesh>
      <mesh position={[0, 1.7, 0]}><boxGeometry args={[len, 0.12, 0.12]} /><meshLambertMaterial color="#8a8f98" /></mesh>
      {Array.from({ length: Math.floor(len / 4) }, (_, i) => (
        <mesh key={i} position={[-len / 2 + 2 + i * 4, 1.3, 0]}><boxGeometry args={[0.1, 1.4, 0.1]} /><meshLambertMaterial color="#8a8f98" /></mesh>
      ))}
    </group>
  );
}

/** The iconic green clamshell roof (Gedung Nusantara) on a white base. */
function GedungNusantara() {
  return (
    <group position={[0, 0, 192]}>
      {/* white base hall */}
      <mesh position={[0, 6.5, 0]} castShadow receiveShadow><boxGeometry args={[40, 13, 26]} /><meshLambertMaterial color={WHITE} /></mesh>
      <mesh position={[0, 6, -13.05]}><boxGeometry args={[34, 9, 0.2]} /><meshLambertMaterial color="#2f6a86" transparent opacity={0.6} /></mesh>
      {/* two green shells leaning outward, split down the middle */}
      <mesh position={[-9.5, 15, 0]} rotation={[0.16, 0, 0.42]} scale={[13, 8.5, 16]} castShadow><sphereGeometry args={[1, 24, 16]} /><meshLambertMaterial color={GREEN} /></mesh>
      <mesh position={[9.5, 15, 0]} rotation={[0.16, 0, -0.42]} scale={[13, 8.5, 16]} castShadow><sphereGeometry args={[1, 24, 16]} /><meshLambertMaterial color={GREEN} /></mesh>
      {/* central spine + front swept points */}
      <mesh position={[0, 13.5, 0]}><boxGeometry args={[0.8, 5, 24]} /><meshLambertMaterial color="#2c6a3c" /></mesh>
      <mesh position={[-9.5, 12.6, -13]} rotation={[0.5, 0, 0.42]}><coneGeometry args={[3, 8, 4]} /><meshLambertMaterial color={GREEN} /></mesh>
      <mesh position={[9.5, 12.6, -13]} rotation={[0.5, 0, -0.42]}><coneGeometry args={[3, 8, 4]} /><meshLambertMaterial color={GREEN} /></mesh>
      {/* flag pole */}
      <mesh position={[0, 22, 0]}><cylinderGeometry args={[0.1, 0.1, 14, 6]} /><meshLambertMaterial color="#cccccc" /></mesh>
      <mesh position={[1.1, 27.5, 0]}><boxGeometry args={[2, 1.3, 0.05]} /><meshBasicMaterial color="#e02424" toneMapped={false} /></mesh>
      <mesh position={[1.1, 28.8, 0]}><boxGeometry args={[2, 1.3, 0.05]} /><meshBasicMaterial color="#ffffff" toneMapped={false} /></mesh>
    </group>
  );
}

export default function Dpr() {
  return (
    <group>
      {/* ground: concrete pad covering the reserved zone + lawns + central plaza */}
      <Slab w={192} d={96} x={0} z={192} color={CONC} y={0.14} />
      <Slab w={70} d={40} x={-58} z={196} color={LAWN} y={0.16} />
      <Slab w={70} d={40} x={58} z={196} color={LAWN} y={0.16} />
      <Slab w={20} d={92} x={0} z={192} color={PLAZA} y={0.17} />

      {/* central axial walkway from gate to dome (white steps look) */}
      {Array.from({ length: 5 }, (_, i) => <Slab key={i} w={16 - i} d={2} x={0} z={150 + i * 4} color={i % 2 ? "#dedacf" : "#e9e6dd"} y={0.18} />)}

      <GedungNusantara />

      {/* Nusantara I tower + symmetric office blocks */}
      <Block w={22} h={46} d={16} x={62} z={222} color="#dfe4ea" glassFront />
      <Block w={16} h={16} d={44} x={-64} z={196} />
      <Block w={16} h={16} d={26} x={64} z={178} />
      <Block w={30} h={14} d={14} x={-64} z={230} />
      <Block w={40} h={15} d={12} x={0} z={238} color="#e6e8ea" glassFront />

      {/* parking aprons near the front */}
      <Slab w={40} d={18} x={-58} z={158} color="#34373c" y={0.18} />
      <Slab w={40} d={18} x={58} z={158} color="#34373c" y={0.18} />

      {/* perimeter fence (front split for the gate) */}
      <FenceRun x={-53} z={144} len={84} axis="x" />
      <FenceRun x={53} z={144} len={84} axis="x" />
      <FenceRun x={0} z={240} len={192} axis="x" />
      <FenceRun x={-96} z={192} len={96} axis="z" />
      <FenceRun x={96} z={192} len={96} axis="z" />

      {/* ── guarded entrance gate ── */}
      <group position={[0, 0, 144]}>
        <mesh position={[-10, 2.5, 0]} castShadow><boxGeometry args={[2.6, 5, 2.6]} /><meshLambertMaterial color="#d8d4c8" /></mesh>
        <mesh position={[10, 2.5, 0]} castShadow><boxGeometry args={[2.6, 5, 2.6]} /><meshLambertMaterial color="#d8d4c8" /></mesh>
        <mesh position={[0, 6.2, 0]} castShadow><boxGeometry args={[24, 1.6, 1.4]} /><meshLambertMaterial color="#c9a45a" /></mesh>
        <group rotation={[0, Math.PI, 0]}>
          <Text position={[0, 6.2, -0.8]} fontSize={0.9} color="#2a2418" anchorX="center" anchorY="middle" maxWidth={22} outlineWidth={0.02} outlineColor="#ffffff88">DPR / MPR RI</Text>
        </group>
        {/* guard booth + barriers + guards */}
        <mesh position={[-13.5, 1.3, 2.5]} castShadow><boxGeometry args={[2.4, 2.6, 2.4]} /><meshLambertMaterial color="#e7e4da" /></mesh>
        <mesh position={[-13.5, 1.7, 1.35]}><boxGeometry args={[1.8, 1.2, 0.1]} /><meshLambertMaterial color={GLASS} transparent opacity={0.6} /></mesh>
        <Barrier x={-8} z={0.5} />
        <Barrier x={4} z={0.5} />
        <Guard x={-11} z={2.2} ry={Math.PI} />
        <Guard x={11} z={2.2} ry={Math.PI} />
        <Guard x={-4} z={1.4} ry={Math.PI * 0.85} />
      </group>

      {/* avenue of trees + lamps along the axis */}
      {[-12, 12].map((x) => [156, 170, 184, 198, 212].map((z) => <Tree key={`${x}-${z}`} x={x} z={z} s={0.9} />))}
      {[-14, 14].map((x) => [152, 176, 200, 224].map((z) => <Lamp key={`l${x}-${z}`} x={x} z={z} />))}

      {/* floating identity label */}
      <Text position={[0, 34, 192]} fontSize={6} color="#ffffff" outlineWidth={0.4} outlineColor="#1a3a22" anchorX="center">GEDUNG DPR / MPR RI</Text>
    </group>
  );
}
