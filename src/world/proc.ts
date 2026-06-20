import { WORLD, DISTRICTS, type DistrictDef } from "./worldConfig";

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
}

function nearestDistrict(x: number, z: number): { d: DistrictDef; dist: number } {
  let best = DISTRICTS[0];
  let bestDist = Infinity;
  for (const d of DISTRICTS) {
    const dx = x - d.pos[0];
    const dz = z - d.pos[1];
    const dist = Math.hypot(dx, dz);
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  return { d: best, dist: bestDist };
}

/** Generate the city: instanced buildings on non-road cells, district-tinted. */
export function generateCity(): { buildings: Building[]; roads: { x: number; z: number }[] } {
  const rng = mulberry32(WORLD.seed);
  const { size, cell, roadEvery, seaLine } = WORLD;
  const buildings: Building[] = [];
  const roads: { x: number; z: number }[] = [];

  const min = -size;
  const max = size;
  let i = 0;
  for (let x = min; x <= max; x += cell, i++) {
    let j = 0;
    for (let z = min; z <= max; z += cell, j++) {
      if (z < seaLine) continue; // sea, no land here
      const isRoad = i % roadEvery === 0 || j % roadEvery === 0;
      if (isRoad) {
        roads.push({ x: x + cell / 2, z: z + cell / 2 });
        continue;
      }

      const { d, dist } = nearestDistrict(x, z);
      const inCity = dist < d.radius * cell;
      // Outskirts thin out into sparse kampung.
      if (!inCity && rng() > 0.35) continue;
      if (d.id === "monas" && dist < cell * 3) continue; // keep plaza clear for the monument

      const falloff = Math.max(0.2, 1 - dist / (d.radius * cell));
      const baseH = 8 + rng() * 14;
      const h = baseH * d.density * (0.6 + falloff) + rng() * 6;
      const w = cell * (0.55 + rng() * 0.3);
      const dpt = cell * (0.55 + rng() * 0.3);

      buildings.push({
        x: x + cell / 2,
        z: z + cell / 2,
        w,
        d: dpt,
        h,
        color: d.color,
      });
    }
  }
  return { buildings, roads };
}
