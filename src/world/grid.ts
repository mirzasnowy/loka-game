/**
 * Canonical city layout. EVERY system (buildings, roads, traffic, pedestrians,
 * vendors, parked vehicles, player spawn) reads geometry from here so the world
 * is physically consistent: cars on road lanes, people on sidewalks, crosswalks
 * at intersections, buildings only on buildable block interiors. Change the city
 * shape by editing these constants — nothing else needs to know the details.
 */

import { WORLD } from "./worldConfig";

export const BLOCK = 48;            // spacing between road centerlines
export const ROAD_HALF = 5;         // half road width → road surface is 10 wide
export const LANE = 2.4;            // lane center offset from road centerline
export const SIDEWALK_W = 4;        // sidewalk strip width (outside the road)
export const SIDEWALK_OFF = ROAD_HALF + SIDEWALK_W / 2; // 7 — sidewalk lane center
export const SIDEWALK_OUTER = ROAD_HALF + SIDEWALK_W;   // 9 — outer edge of sidewalk
export const PARK_RADIUS = 42;      // Monas park clear zone (no through-roads/cars)
export const MAP = WORLD.size;      // half-extent of the world

/** All road centerline coordinates on one axis (shared by X and Z roads). */
export const ROAD_LINES: number[] = (() => {
  const lines: number[] = [];
  const maxLine = Math.floor((MAP - BLOCK) / BLOCK) * BLOCK;
  for (let c = -maxLine; c <= maxLine; c += BLOCK) lines.push(c);
  return lines;
})();

/** Nearest road centerline coordinate to v (on one axis). */
export function nearestLine(v: number): number {
  return Math.round(v / BLOCK) * BLOCK;
}

/** Distance from the nearest road centerline on one axis. */
export function distToLine(v: number): number {
  return Math.abs(v - nearestLine(v));
}

export function inPark(x: number, z: number): boolean {
  return Math.hypot(x, z) < PARK_RADIUS;
}

/** Is this point on a drivable road surface? (park interior excluded) */
export function isRoad(x: number, z: number): boolean {
  if (inPark(x, z)) return false;
  return distToLine(x) <= ROAD_HALF || distToLine(z) <= ROAD_HALF;
}

/** Is this point on a sidewalk strip (the band just outside a road)? */
export function isSidewalk(x: number, z: number): boolean {
  const dx = distToLine(x);
  const dz = distToLine(z);
  const besideNS = dx > ROAD_HALF && dx <= SIDEWALK_OUTER; // sidewalk beside a N-S road
  const besideEW = dz > ROAD_HALF && dz <= SIDEWALK_OUTER; // sidewalk beside an E-W road
  return besideNS || besideEW;
}

/** Buildable block interior — clear of road, sidewalk and park. */
export function isBuildable(x: number, z: number): boolean {
  if (inPark(x, z)) return false;
  if (z < WORLD.seaLine + 6) return false; // sea margin
  return distToLine(x) > SIDEWALK_OUTER && distToLine(z) > SIDEWALK_OUTER;
}

/** Is (x,z) close to an intersection (within crossing range of both axes)? */
export function isIntersection(x: number, z: number): boolean {
  return distToLine(x) <= ROAD_HALF && distToLine(z) <= ROAD_HALF;
}

/** World position of a sidewalk waypoint beside a road. */
export function sidewalkPoint(
  axis: "x" | "z",
  line: number,
  side: 1 | -1,
  along: number
): [number, number] {
  // axis "x": walks east-west beside an E-W road at z=line
  if (axis === "x") return [along, line + side * SIDEWALK_OFF];
  // axis "z": walks north-south beside a N-S road at x=line
  return [line + side * SIDEWALK_OFF, along];
}

/** World position + facing of a vehicle in its lane. */
export function lanePoint(
  axis: "x" | "z",
  line: number,
  dir: 1 | -1,
  along: number
): { x: number; z: number; rotY: number } {
  if (axis === "z") {
    // travels along Z on a N-S road at x=line
    return { x: line + LANE * dir, z: along, rotY: dir > 0 ? 0 : Math.PI };
  }
  // travels along X on an E-W road at z=line
  return { x: along, z: line + LANE * dir, rotY: dir > 0 ? Math.PI / 2 : -Math.PI / 2 };
}

/** Snap an arbitrary point onto the nearest sidewalk lane (for spawning NPCs). */
export function snapToSidewalk(x: number, z: number): { axis: "x" | "z"; line: number; side: 1 | -1; along: number } {
  const lineX = nearestLine(x); // nearest N-S road (constant x)
  const lineZ = nearestLine(z); // nearest E-W road (constant z)
  const dx = Math.abs(x - lineX);
  const dz = Math.abs(z - lineZ);
  if (dx <= dz) {
    // beside the N-S road → walk along Z
    return { axis: "z", line: lineX, side: x >= lineX ? 1 : -1, along: z };
  }
  // beside the E-W road → walk along X
  return { axis: "x", line: lineZ, side: z >= lineZ ? 1 : -1, along: x };
}
