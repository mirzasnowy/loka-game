/**
 * Data-driven vehicle specs. Driving physics reads these numbers; the visual is
 * resolved through the AssetRegistry by `assetId` (placeholder now, GLB later).
 */
export interface VehicleSpec {
  id: string;
  name: string;
  assetId: string;
  kind: "scooter" | "car" | "bus";
  maxSpeed: number; // m/s
  accel: number; // m/s^2
  turnRate: number; // rad/s at speed
  fuelUse: number; // per second moving (future economy hook)
  seatHeight: number; // where the rider sits, for placing the player visual
}

export const VEHICLES: VehicleSpec[] = [
  { id: "beat", name: "Honda Beat", assetId: "veh_scooter", kind: "scooter", maxSpeed: 16, accel: 9, turnRate: 2.4, fuelUse: 0.05, seatHeight: 0.9 },
  { id: "vario", name: "Honda Vario", assetId: "veh_scooter", kind: "scooter", maxSpeed: 18, accel: 10, turnRate: 2.3, fuelUse: 0.06, seatHeight: 0.9 },
  { id: "nmax", name: "Yamaha NMAX", assetId: "veh_scooter", kind: "scooter", maxSpeed: 22, accel: 11, turnRate: 2.0, fuelUse: 0.08, seatHeight: 0.95 },
  { id: "avanza", name: "Toyota Avanza", assetId: "veh_car", kind: "car", maxSpeed: 24, accel: 7, turnRate: 1.6, fuelUse: 0.12, seatHeight: 1.1 },
  { id: "innova", name: "Toyota Innova", assetId: "veh_car", kind: "car", maxSpeed: 26, accel: 7.5, turnRate: 1.5, fuelUse: 0.14, seatHeight: 1.2 },
  { id: "pickup", name: "Pickup", assetId: "veh_pickup", kind: "car", maxSpeed: 22, accel: 6, turnRate: 1.5, fuelUse: 0.15, seatHeight: 1.2 },
  { id: "transjakarta", name: "TransJakarta", assetId: "veh_bus", kind: "bus", maxSpeed: 18, accel: 4, turnRate: 1.0, fuelUse: 0.25, seatHeight: 1.6 },
];

export const getVehicle = (id: string) => VEHICLES.find((v) => v.id === id);
