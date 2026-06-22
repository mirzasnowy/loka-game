import { WORLD, DISTRICTS, type DistrictDef } from "./worldConfig";
import {
  BLOCK, ROAD_LINES, SIDEWALK_OFF, SIDEWALK_OUTER, isBuildable, inPark, nearestLine, distToLine,
} from "./grid";
import { inDistrict } from "./districtData";
import { inDpr } from "./dprData";

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
  kind: "office" | "home";
  style: "glass" | "block" | "ruko";
}

export interface StorePos {
  x: number;
  z: number;
  rot: number;
  id: string; // asset id: store_indomaret | store_alfamart | store_warteg
}

export interface TreePos {
  x: number;
  z: number;
  scale: number;
  variant: number;
}

const GLASS_COLORS = ["#7fb8e0", "#8fc6e8", "#6aa8d4", "#a0d0ee", "#79c0c8"];
const STORE_IDS = ["store_indomaret", "store_alfamart", "store_warteg"];

function nearestDistrict(x: number, z: number): { d: DistrictDef; dist: number } {
  let best = DISTRICTS[0];
  let bestDist = Infinity;
  for (const d of DISTRICTS) {
    const dist = Math.hypot(x - d.pos[0], z - d.pos[1]);
    if (dist < bestDist) { bestDist = dist; best = d; }
  }
  return { d: best, dist: bestDist };
}

/** A footprint (center + half-extents) clears road + sidewalk on both axes. */
function clearsStreet(cx: number, cz: number, halfW: number, halfD: number): boolean {
  return distToLine(cx) - halfW >= SIDEWALK_OUTER + 0.5 &&
         distToLine(cz) - halfD >= SIDEWALK_OUTER + 0.5 &&
         distToLine(cx) + halfW <= BLOCK / 2 - 0.5 &&
         distToLine(cz) + halfD <= BLOCK / 2 - 0.5;
}

/** Face the nearer road with the storefront (+z local). */
function faceRoad(cx: number, cz: number): number {
  if (distToLine(cx) < distToLine(cz)) {
    return nearestLine(cx) > cx ? Math.PI / 2 : -Math.PI / 2;
  }
  return nearestLine(cz) > cz ? 0 : Math.PI;
}

let cache: { buildings: Building[]; trees: TreePos[]; stores: StorePos[] } | null = null;

export function generateCity(): { buildings: Building[]; trees: TreePos[]; stores: StorePos[] } {
  if (cache) return cache;

  const rng = mulberry32(WORLD.seed);
  const buildings: Building[] = [];
  const stores: StorePos[] = [];
  const trees: TreePos[] = [];
  const occupied: { x: number; z: number; r: number }[] = []; // footprint centers for overlap test

  const overlaps = (cx: number, cz: number, r: number) =>
    occupied.some((o) => Math.hypot(o.x - cx, o.z - cz) < o.r + r);

  // ── Buildings + a few stores, each fully inside its block (never on the street) ──
  const PLOT = 16;
  for (let x = -WORLD.size; x <= WORLD.size; x += PLOT) {
    for (let z = -WORLD.size; z <= WORLD.size; z += PLOT) {
      const cx = x + (rng() - 0.5) * 3;
      const cz = z + (rng() - 0.5) * 3;
      if (!isBuildable(cx, cz)) continue;
      if (inDistrict(cx, cz)) continue; // reserved for the commercial district
      if (inDpr(cx, cz)) continue;      // reserved for the DPR/MPR complex

      const { d, dist } = nearestDistrict(cx, cz);
      const inCity = dist < d.radius * BLOCK * 0.5;
      if (!inCity && rng() > 0.4) continue;

      // Occasionally a roadside minimarket / warteg instead of a tower.
      if (stores.length < 16 && rng() < 0.05 && clearsStreet(cx, cz, 5.2, 4.4) && !overlaps(cx, cz, 7)) {
        stores.push({ x: cx, z: cz, rot: faceRoad(cx, cz), id: STORE_IDS[stores.length % STORE_IDS.length] });
        occupied.push({ x: cx, z: cz, r: 7 });
        continue;
      }

      const falloff = Math.max(0.25, 1 - dist / (d.radius * BLOCK));
      const baseH = 7 + rng() * 12;
      const h = baseH * d.density * (0.55 + falloff) + rng() * 5;
      const w = 7 + rng() * 4;
      const dpt = 7 + rng() * 4;

      // Reject footprints that would touch the sidewalk/road or a neighbour.
      if (!clearsStreet(cx, cz, w / 2, dpt / 2)) continue;
      if (overlaps(cx, cz, Math.max(w, dpt) / 2)) continue;
      occupied.push({ x: cx, z: cz, r: Math.max(w, dpt) / 2 });

      let style: Building["style"];
      if (h < 13) style = "ruko";
      else if (h > 28 && rng() > 0.35) style = "glass";
      else style = "block";

      const color = style === "glass"
        ? GLASS_COLORS[(rng() * GLASS_COLORS.length) | 0]
        : d.colors[(rng() * d.colors.length) | 0];
      const kind: Building["kind"] = style === "glass" ? "office" : h > 22 ? "office" : rng() > 0.5 ? "office" : "home";

      buildings.push({ x: cx, z: cz, w, d: dpt, h, color, kind, style });
    }
  }

  // ── Trees: lined along sidewalks (never overlapping a building footprint) ──
  const tRng = mulberry32(WORLD.seed + 7);
  const TREE_STEP = 14;
  for (const line of ROAD_LINES) {
    for (let x = -WORLD.size + 10; x <= WORLD.size - 10; x += TREE_STEP) {
      for (const side of [1, -1] as const) {
        const tx = x + (tRng() - 0.5) * 2;
        const tz = line + side * SIDEWALK_OFF;
        if (tz < WORLD.seaLine + 6) continue;
        if (inPark(tx, tz)) continue;
        if (Math.abs(x - nearestLine(x)) < 7) continue; // clear of intersections
        if (tRng() > 0.5) continue;
        if (inDistrict(tx, tz)) continue;            // district has its own landscaping
        if (inDpr(tx, tz)) continue;                 // DPR complex has its own landscaping
        if (overlaps(tx, tz, 1.6)) continue; // don't grow into a building
        trees.push({ x: tx, z: tz, scale: 0.85 + tRng() * 0.45, variant: (tRng() * 5) | 0 });
      }
    }
  }

  // ── Monas park trees (rings OUTSIDE the 48m monument base) ──
  for (let k = 0; k < 28; k++) {
    const a = (k / 28) * Math.PI * 2;
    const r = 40 + (tRng() - 0.5) * 2;
    trees.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, scale: 1.1 + tRng() * 0.5, variant: (tRng() * 5) | 0 });
  }
  for (let k = 0; k < 22; k++) {
    const a = (k / 22) * Math.PI * 2 + 0.25;
    const r = 37 + (tRng() - 0.5) * 1.5;
    trees.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, scale: 0.95 + tRng() * 0.4, variant: (tRng() * 5) | 0 });
  }

  cache = { buildings, trees, stores };
  return cache;
}
