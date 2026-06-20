/**
 * Data-driven world. Everything the generator needs lives here as plain data —
 * no geometry, no React. Tweak the city by editing this file; add a district by
 * adding an entry. Later this can be loaded from JSON/CDN with no code change.
 */

export interface DistrictDef {
  id: string;
  label: string;
  /** Center on the ground plane (x, z). */
  pos: [number, number];
  /** Block radius this district covers. */
  radius: number;
  /** Typical building height multiplier (skyscrapers vs kampung). */
  density: number;
  /** Wall color for placeholder buildings. */
  color: string;
}

export const WORLD = {
  /** Half-size of the ground in world units. World spans -size..+size. */
  size: 320,
  /** Grid cell size. Buildings/roads snap to this. */
  cell: 12,
  /** Every Nth grid line is a road. */
  roadEvery: 4,
  /** North of this z is sea (matches the coastline in the reference). */
  seaLine: -240,
  seed: 1945,
} as const;

export const DISTRICTS: DistrictDef[] = [
  { id: "monas", label: "Monas", pos: [0, 0], radius: 6, density: 0.6, color: "#cfd6dd" },
  { id: "sudirman", label: "Sudirman", pos: [60, 90], radius: 9, density: 2.4, color: "#9fb3c8" },
  { id: "bundaran-hi", label: "Bundaran HI", pos: [120, 60], radius: 7, density: 2.0, color: "#b0c4d4" },
  { id: "gambir", label: "Gambir", pos: [-30, -90], radius: 7, density: 1.1, color: "#c2b8a8" },
  { id: "tanah-abang", label: "Tanah Abang", pos: [-130, 20], radius: 8, density: 0.9, color: "#cbbfa6" },
  { id: "kota-tua", label: "Kota Tua", pos: [-90, -180], radius: 7, density: 0.8, color: "#c9b39a" },
];
