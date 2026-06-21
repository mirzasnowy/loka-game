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
};
