/**
 * Street vendors (kaki lima) + the food they sell. Buying restores health/
 * stamina and drives the economy + "buy food" quest objectives.
 */
export interface FoodItem {
  id: string;
  name: string;
  price: number; // Rupiah
  heal: number;
  stamina: number;
}

export interface VendorSpec {
  id: string;
  name: string;
  assetId: string;
  food: FoodItem;
}

export const VENDORS: VendorSpec[] = [
  { id: "bakso", name: "Bakso", assetId: "vendor_cart", food: { id: "bakso", name: "Bakso", price: 15_000, heal: 35, stamina: 30 } },
  { id: "cilok", name: "Cilok", assetId: "vendor_cart", food: { id: "cilok", name: "Cilok", price: 8_000, heal: 15, stamina: 15 } },
  { id: "siomay", name: "Siomay", assetId: "vendor_cart", food: { id: "siomay", name: "Siomay", price: 12_000, heal: 25, stamina: 20 } },
  { id: "es-teh", name: "Es Teh", assetId: "vendor_cart", food: { id: "es-teh", name: "Es Teh", price: 5_000, heal: 5, stamina: 35 } },
  { id: "nasi-goreng", name: "Nasi Goreng", assetId: "vendor_cart", food: { id: "nasi-goreng", name: "Nasi Goreng", price: 20_000, heal: 50, stamina: 40 } },
];

/** Fixed vendor placements in the world (data-driven world content). */
export interface VendorPlacement {
  vendorId: string;
  pos: [number, number, number];
}
// All positions snapped onto sidewalks (grid.isSidewalk === true) so carts
// never sit in the road. See src/world/grid.ts for the layout.
export const VENDOR_PLACEMENTS: VendorPlacement[] = [
  { vendorId: "bakso", pos: [12, 0, 41] },       // park entrance, south sidewalk of z=48
  { vendorId: "es-teh", pos: [55, 0, 20] },      // east sidewalk of x=48
  { vendorId: "siomay", pos: [41, 0, 72] },      // west sidewalk of x=48
  { vendorId: "nasi-goreng", pos: [89, 0, 56] }, // west sidewalk of x=96
  { vendorId: "cilok", pos: [-41, 0, 24] },      // east sidewalk of x=-48
];
