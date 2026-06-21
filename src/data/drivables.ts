/** Fixed drivable vehicles placed in the world (data-driven world content). */
export interface DrivablePlacement {
  uid: string;
  specId: string;
  pos: [number, number, number];
}

// Parked at curbs near the player spawn (sidewalk-adjacent road edges).
export const DRIVABLE_PLACEMENTS: DrivablePlacement[] = [
  { uid: "v_beat", specId: "beat", pos: [24, 1, 43] },
  { uid: "v_nmax", specId: "nmax", pos: [28, 1, 43] },
  { uid: "v_avanza", specId: "avanza", pos: [44, 1, 30] },
  { uid: "v_innova", specId: "innova", pos: [44, 1, 38] },
  { uid: "v_bus", specId: "transjakarta", pos: [-44, 1, 30] },
];
