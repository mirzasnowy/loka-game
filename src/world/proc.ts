import { WORLD, DISTRICTS, type DistrictDef } from "./worldConfig";
import {
  BLOCK, ROAD_LINES, SIDEWALK_OFF, isBuildable, inPark, nearestLine,
} from "./grid";

/** Deterministic PRNG (mulberry32) so the city is identical every load. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Building {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  /** "office" → blue glass windows; "home" → warm windows. */
  kind: "office" | "home";
}

export interface TreePos {
  x: number;
  z: number;
  scale: number;
  variant: number;
}

function nearestDistrict(x: number, z: number): { d: DistrictDef; dist: number } {
  let best = DISTRICTS[0];
  let bestDist = Infinity;
  for (const d of DISTRICTS) {
    const dist = Math.hypot(x - d.pos[0], z - d.pos[1]);
    if (dist < bestDist) { bestDist = dist; best = d; }
  }
  return { d: best, dist: bestDist };
}

let cache: { buildings: Building[]; trees: TreePos[] } | null = null;

export function generateCity(): { buildings: Building[]; trees: TreePos[] } {
  if (cache) return cache;

  const rng = mulberry32(WORLD.seed);
  const buildings: Building[] = [];
  const trees: TreePos[] = [];

  // ── Buildings: one plot grid; keep only buildable interiors ──
  const PLOT = 15;
  for (let x = -WORLD.size; x <= WORLD.size; x += PLOT) {
    for (let z = -WORLD.size; z <= WORLD.size; z += PLOT) {
      // jittered plot center
      const cx = x + (rng() - 0.5) * 4;
      const cz = z + (rng() - 0.5) * 4;
      if (!isBuildable(cx, cz)) continue;

      const { d, dist } = nearestDistrict(cx, cz);
      const inCity = dist < d.radius * BLOCK * 0.5;
      if (!inCity && rng() > 0.4) continue; // outskirts thin out

      const falloff = Math.max(0.25, 1 - dist / (d.radius * BLOCK));
      const baseH = 7 + rng() * 12;
      const h = baseH * d.density * (0.55 + falloff) + rng() * 5;
      const w = 8 + rng() * 4;
      const dpt = 8 + rng() * 4;
      const colorIdx = Math.floor(rng() * d.colors.length);
      const kind: Building["kind"] = h > 26 ? "office" : rng() > 0.5 ? "office" : "home";

      buildings.push({ x: cx, z: cz, w, d: dpt, h, color: d.colors[colorIdx], kind });
    }
  }

  // ── Trees: line every road with trees on both sidewalk sides ──
  const tRng = mulberry32(WORLD.seed + 7);
  const TREE_STEP = 14;
  for (const line of ROAD_LINES) {
    // Trees beside E-W roads (z = line): vary x
    for (let x = -WORLD.size + 10; x <= WORLD.size - 10; x += TREE_STEP) {
      if (Math.abs(nearestLine(x)) < 0.001 && Math.abs(x) <= 6) continue; // skip dead-center
      for (const side of [1, -1] as const) {
        const tx = x + (tRng() - 0.5) * 3;
        const tz = line + side * SIDEWALK_OFF;
        if (tz < WORLD.seaLine + 6) continue;
        if (inPark(tx, tz)) continue;
        // skip near intersections (leave corners clear for lamps/crosswalks)
        if (Math.abs(x - nearestLine(x)) < 7) continue;
        if (tRng() > 0.55) continue;
        trees.push({ x: tx, z: tz, scale: 0.8 + tRng() * 0.5, variant: (tRng() * 5) | 0 });
      }
    }
  }

  // ── Monas park trees (lush rings, matches reference aerial) ──
  for (let k = 0; k < 28; k++) {
    const a = (k / 28) * Math.PI * 2;
    const r = 28 + (tRng() - 0.5) * 4;
    trees.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, scale: 1.1 + tRng() * 0.5, variant: (tRng() * 5) | 0 });
  }
  for (let k = 0; k < 18; k++) {
    const a = (k / 18) * Math.PI * 2 + 0.25;
    const r = 15 + (tRng() - 0.5) * 2;
    trees.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, scale: 0.95 + tRng() * 0.4, variant: (tRng() * 5) | 0 });
  }

  cache = { buildings, trees };
  return cache;
}
