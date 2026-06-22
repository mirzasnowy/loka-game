/**
 * Kompleks Gedung DPR/MPR/RI — a walled, gated landmark south of the city
 * (real-world Senayan, SSW of Monas). Occupies a reserved 192×96 zone; proc.ts
 * skips it, World renders <Dpr/> + colliders, TrafficSystem keeps cars out.
 */

export const DPR = { x0: -96, x1: 96, z0: 144, z1: 240, cx: 0, cz: 192, gateZ: 144 };

export function inDpr(x: number, z: number): boolean {
  return x > DPR.x0 - 5 && x < DPR.x1 + 5 && z > DPR.z0 - 5 && z < DPR.z1 + 5;
}

export const DPR_NAV = { name: "Gedung DPR/MPR RI", short: "🏛️ Gedung DPR/MPR", x: 0, z: 132 };

/** Solid colliders [cx, cz, w, d, h] (world centre + size). */
export const DPR_COLLIDERS: [number, number, number, number, number][] = [
  [0, 192, 40, 26, 13],     // green-dome base (Gedung Nusantara)
  [62, 222, 22, 16, 46],    // Nusantara I tower
  [-64, 196, 16, 44, 16],   // west office block
  [64, 178, 16, 26, 16],    // east office block
  [-64, 230, 30, 14, 14],   // back-west block
  [0, 238, 40, 12, 15],     // back centre block (Paripurna annex)
  [-10, 144, 2.6, 2.6, 5],  // gate post L
  [10, 144, 2.6, 2.6, 5],   // gate post R
  [-53, 144, 84, 1.4, 3],   // front wall (left of gate)
  [53, 144, 84, 1.4, 3],    // front wall (right of gate)
  [0, 240, 192, 1.4, 3],    // back wall
  [-96, 192, 1.4, 96, 3],   // west wall
  [96, 192, 1.4, 96, 3],    // east wall
];
