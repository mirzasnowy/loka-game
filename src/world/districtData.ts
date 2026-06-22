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
  short: string;       // short label for the nav menu
  cx: number;
  cz: number;
  color: string;       // brand colour (pylon / signage)
  textColor: string;
  /** main building collider box in PARCEL-LOCAL space: [dx, dz, w, d, h] */
  box: [number, number, number, number, number];
}

export const PARCEL_HALF = 22;

export const DISTRICT: Parcel[] = [
  // Row A (front road at z = 48) — building front face at local z = 0, mass extends +z
  { id: "gacoan",   name: "Mie Gacoan",        short: "🍜 Mie Gacoan",   cx: -72, cz: 72, color: "#d6202a", textColor: "#ffffff", box: [0, 6,   17, 12, 8] },
  { id: "indomaret",name: "Indomaret",         short: "🏪 Indomaret",    cx: -24, cz: 72, color: "#1763b6", textColor: "#ffffff", box: [0, 5,   15, 10, 5] },
  { id: "alfamart", name: "Alfamart",          short: "🏪 Alfamart",     cx: 24,  cz: 72, color: "#d11f2a", textColor: "#ffffff", box: [0, 5,   15, 10, 5] },
  { id: "kopken",   name: "Kopi Kenangan",     short: "☕ Kopi Kenangan",cx: 72,  cz: 72, color: "#3a2522", textColor: "#e7c87a", box: [2, 5,   12, 10, 5.5] },
  { id: "fitfirst", name: "Fitness First",     short: "🏋️ Fitness First",cx: 120, cz: 72, color: "#e23b2e", textColor: "#ffffff", box: [0, 6.5, 16, 13, 12] },
  // Row B (front road at z = 96)
  { id: "hermina",  name: "RS Hermina",        short: "🏥 RS Hermina",   cx: -72, cz: 120, color: "#0f9d9d", textColor: "#ffffff", box: [0, 6.5, 18, 13, 13] },
  { id: "spbu",     name: "SPBU Pertamina",    short: "⛽ SPBU Pertamina",cx: -24, cz: 120, color: "#1f8a4c", textColor: "#ffffff", box: [9, 9,   7, 6, 4] },
  { id: "richeese", name: "Richeese Factory",  short: "🍗 Richeese",     cx: 24,  cz: 120, color: "#f5c518", textColor: "#b3140e", box: [2, 5.5, 12, 11, 6] },
  { id: "celebrity",name: "Celebrity Fitness", short: "🏋️ Celebrity Fit",cx: 72,  cz: 120, color: "#e0218a", textColor: "#ffffff", box: [0, 6.5, 15, 13, 13] },
  { id: "mall",     name: "Summarecon Mall",   short: "🛍️ Summarecon Mall",cx: 120, cz: 120, color: "#c9a45a", textColor: "#3a2a12", box: [0, 5,   24, 18, 15] },
];

export function inDistrict(x: number, z: number): boolean {
  for (const p of DISTRICT) {
    if (Math.abs(x - p.cx) < PARCEL_HALF && Math.abs(z - p.cz) < PARCEL_HALF) return true;
  }
  return false;
}
