import { WORLD, DISTRICTS, type DistrictDef } from "./worldConfig";

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
}

export interface TreePos {
  x: number;
  z: number;
  scale: number;
  variant: number; // 0-4
}

function nearestDistrict(x: number, z: number): { d: DistrictDef; dist: number } {
  let best = DISTRICTS[0];
  let bestDist = Infinity;
  for (const d of DISTRICTS) {
    const dx = x - d.pos[0];
    const dz = z - d.pos[1];
    const dist = Math.hypot(dx, dz);
    if (dist < bestDist) { bestDist = dist; best = d; }
  }
  return { d: best, dist: bestDist };
}

export function generateCity(): {
  buildings: Building[];
  roads: { x: number; z: number }[];
  trees: TreePos[];
} {
  const rng = mulberry32(WORLD.seed);
  const { size, cell, roadEvery, seaLine } = WORLD;
  const buildings: Building[] = [];
  const roads: { x: number; z: number }[] = [];
  const trees: TreePos[] = [];

  // Track road cells for tree placement
  const roadCells = new Set<string>();

  const min = -size;
  const max = size;
  let i = 0;

  for (let x = min; x <= max; x += cell, i++) {
    let j = 0;
    for (let z = min; z <= max; z += cell, j++) {
      if (z < seaLine) continue;
      const isRoadI = i % roadEvery === 0;
      const isRoadJ = j % roadEvery === 0;
      const isRoad = isRoadI || isRoadJ;

      if (isRoad) {
        roads.push({ x: x + cell / 2, z: z + cell / 2 });
        roadCells.add(`${i}|${j}`);
        continue;
      }

      const { d, dist } = nearestDistrict(x, z);
      const inCity = dist < d.radius * cell;
      if (!inCity && rng() > 0.35) continue;
      if (d.id === "monas" && dist < cell * 3) continue;

      const falloff = Math.max(0.2, 1 - dist / (d.radius * cell));
      const baseH = 8 + rng() * 14;
      const h = baseH * d.density * (0.6 + falloff) + rng() * 6;
      const w = cell * (0.55 + rng() * 0.3);
      const dpt = cell * (0.55 + rng() * 0.3);

      // Pick color from district palette
      const colorIdx = Math.floor(rng() * d.colors.length);

      buildings.push({ x: x + cell / 2, z: z + cell / 2, w, d: dpt, h, color: d.colors[colorIdx] });
    }
  }

  // Trees: alongside roads at sidewalk positions
  // Re-scan to find road adjacency
  i = 0;
  for (let x = min; x <= max; x += cell, i++) {
    let j = 0;
    for (let z = min; z <= max; z += cell, j++) {
      if (z < seaLine + 20) continue;
      // Place tree at edge of a road cell
      const isRoadI = i % roadEvery === 0;
      const isRoadJ = j % roadEvery === 0;
      if (!(isRoadI || isRoadJ)) continue;
      // Only at intersections and every other road-cell to space them out
      if (isRoadI && isRoadJ) continue; // skip exact intersections
      if (rng() > 0.28) continue; // sparse
      // Avoid Monas center
      const cx = x + cell / 2;
      const cz = z + cell / 2;
      if (Math.hypot(cx, cz) < 38) continue;
      // Place tree slightly offset from road center
      const offset = cell * 0.38 * (rng() > 0.5 ? 1 : -1);
      const tx = isRoadJ ? cx : cx + offset;
      const tz = isRoadI ? cz : cz + offset;
      trees.push({ x: tx, z: tz, scale: 0.75 + rng() * 0.55, variant: (rng() * 5) | 0 });
    }
  }

  // Monas park trees (ring)
  const treeRng = mulberry32(WORLD.seed + 7);
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2;
    const r = 24 + (treeRng() - 0.5) * 4;
    trees.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, scale: 1.0 + treeRng() * 0.5, variant: (treeRng() * 5) | 0 });
  }
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2 + 0.2;
    trees.push({ x: Math.cos(a) * 15, z: Math.sin(a) * 15, scale: 0.9 + treeRng() * 0.4, variant: (treeRng() * 5) | 0 });
  }

  return { buildings, roads, trees };
}
