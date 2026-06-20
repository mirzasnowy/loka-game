/** Fixed drivable vehicles placed in the world (data-driven world content). */
export interface DrivablePlacement {
  uid: string;
  specId: string;
  pos: [number, number, number];
}

export const DRIVABLE_PLACEMENTS: DrivablePlacement[] = [
  { uid: "v_beat", specId: "beat", pos: [26, 1, 26] },
  { uid: "v_nmax", specId: "nmax", pos: [-12, 1, 44] },
  { uid: "v_avanza", specId: "avanza", pos: [44, 1, 64] },
  { uid: "v_innova", specId: "innova", pos: [100, 1, 50] },
  { uid: "v_bus", specId: "transjakarta", pos: [70, 1, 96] },
];
