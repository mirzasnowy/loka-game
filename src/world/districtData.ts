/**
 * The 10-parcel Indonesian commercial district. Each parcel sits on its own city
 * block (centre = block centre), front facing the road at z = cz - 24. All build
 * content stays within ±PARCEL_HALF of the centre so nothing touches the street.
 * Shared by District.tsx (render), World (colliders) and proc.ts (so the random
 * city skips these blocks).
 */

export interface Parcel {
  id: string;
  name: string;
  cx: number;
  cz: number;
  /** main building collider box in PARCEL-LOCAL space: [dx, dz, w, d, h] */
  box: [number, number, number, number, number];
}

export const PARCEL_HALF = 22;

export const DISTRICT: Parcel[] = [
  // Row A (front road at z = 48) — building front face at local z = 0, mass extends +z
  { id: "gacoan",   name: "Mie Gacoan",        cx: -72, cz: 72, box: [0, 6,   17, 12, 8] },
  { id: "indomaret",name: "Indomaret",         cx: -24, cz: 72, box: [0, 5,   15, 10, 5] },
  { id: "alfamart", name: "Alfamart",          cx: 24,  cz: 72, box: [0, 5,   15, 10, 5] },
  { id: "kopken",   name: "Kopi Kenangan",     cx: 72,  cz: 72, box: [2, 5,   12, 10, 5.5] },
  { id: "fitfirst", name: "Fitness First",     cx: 120, cz: 72, box: [0, 6.5, 16, 13, 12] },
  // Row B (front road at z = 96)
  { id: "hermina",  name: "RS Hermina",        cx: -72, cz: 120, box: [0, 6.5, 18, 13, 13] },
  { id: "spbu",     name: "SPBU Pertamina",    cx: -24, cz: 120, box: [9, 9,   7, 6, 4] },
  { id: "richeese", name: "Richeese Factory",  cx: 24,  cz: 120, box: [2, 5.5, 12, 11, 6] },
  { id: "celebrity",name: "Celebrity Fitness", cx: 72,  cz: 120, box: [0, 6.5, 15, 13, 13] },
  { id: "mall",     name: "Summarecon Mall",   cx: 120, cz: 120, box: [0, 5,   24, 18, 15] },
];

export function inDistrict(x: number, z: number): boolean {
  for (const p of DISTRICT) {
    if (Math.abs(x - p.cx) < PARCEL_HALF && Math.abs(z - p.cz) < PARCEL_HALF) return true;
  }
  return false;
}
