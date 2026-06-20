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
export const VENDOR_PLACEMENTS: VendorPlacement[] = [
  { vendorId: "bakso", pos: [30, 0, 30] },
  { vendorId: "es-teh", pos: [-20, 0, 50] },
  { vendorId: "siomay", pos: [60, 0, 80] },
  { vendorId: "nasi-goreng", pos: [110, 0, 55] },
  { vendorId: "cilok", pos: [-110, 0, 25] },
];
