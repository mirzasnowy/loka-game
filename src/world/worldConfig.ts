export interface DistrictDef {
  id: string;
  label: string;
  pos: [number, number];
  radius: number;
  density: number;
  color: string;
  /** Palette of building colors for this district — picked at random per building. */
  colors: string[];
}

export const WORLD = {
  size: 320,
  cell: 12,
  roadEvery: 4,
  seaLine: -240,
  seed: 1945,
} as const;

export const DISTRICTS: DistrictDef[] = [
  {
    id: "monas", label: "Monas", pos: [0, 0], radius: 6, density: 0.6,
    color: "#f0ede0",
    colors: ["#f5f2e8", "#e8e4d4", "#fffcf0", "#f0ede0", "#ddd8c8"],
  },
  {
    id: "sudirman", label: "Sudirman", pos: [60, 90], radius: 9, density: 2.4,
    color: "#7ab3d4",
    colors: ["#7ab3d4", "#8ec4e0", "#aad4f0", "#5090b8", "#60a0c8", "#f0f4f8", "#e0ecf8"],
  },
  {
    id: "bundaran-hi", label: "Bundaran HI", pos: [120, 60], radius: 7, density: 2.0,
    color: "#f5d060",
    colors: ["#f5d060", "#e8c040", "#f8e080", "#f0ca50", "#fff0a0", "#ffe060"],
  },
  {
    id: "gambir", label: "Gambir", pos: [-30, -90], radius: 7, density: 1.1,
    color: "#e8c49a",
    colors: ["#e8c49a", "#f0d0a8", "#d4aa80", "#e0b888", "#f5e0c0", "#c89c6a"],
  },
  {
    id: "tanah-abang", label: "Tanah Abang", pos: [-130, 20], radius: 8, density: 0.9,
    color: "#e87838",
    colors: ["#e87838", "#f08840", "#d06830", "#f09858", "#c85820", "#f5b070", "#e06030"],
  },
  {
    id: "kota-tua", label: "Kota Tua", pos: [-90, -180], radius: 7, density: 0.8,
    color: "#d4c090",
    colors: ["#d4c090", "#c8b080", "#e0d0a0", "#b8a070", "#d8c898", "#ecdcb0"],
  },
];
