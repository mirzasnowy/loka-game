/**
 * Shared player-avatar animation state. Player.tsx writes locomotion (speed/run/
 * grounded), CombatSystem writes strike triggers, PlayerModel reads everything to
 * drive limb animation. Decoupled like `input` so no component owns another.
 */
export const avatar = {
  speed: 0,        // current planar speed (m/s)
  running: false,
  grounded: true,
  blocking: false,
  punchAt: 0,      // performance.now() of last punch (for jab anim)
  kickAt: 0,       // performance.now() of last kick
  jumpAt: 0,       // performance.now() of last jump
  hurtAt: 0,       // performance.now() of last damage taken (flinch)
  fireAt: 0,       // performance.now() of last gunshot (recoil + muzzle flash)
  comboCount: 1,   // 1=jab, 2=hook, 3+=uppercut
  weapon: "fists" as "fists" | "pistol",
  ridingMode: false as false | "moto" | "car",
  // vehicle knockback (set by TrafficSystem, applied + cleared by Player)
  knockAt: 0,
  knockX: 0,
  knockZ: 0,
  // knockdown/ragdoll: fall, lie, then get back up (~2.4s)
  knockdownAt: 0,
  // sitting on a chair — seat world transform + transition timestamps
  sitting: false,
  sitAt: 0,
  standAt: 0,
  seatX: 0,
  seatY: 0,
  seatZ: 0,
  seatYaw: 0,
};
export const KNOCKDOWN_MS = 2400;
export const SIT_MS = 450; // sit-down / stand-up transition
