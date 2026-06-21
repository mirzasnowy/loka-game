/** Shared combo readout for the HUD. CombatSystem writes on each landed hit. */
export const combat = {
  comboCount: 0,   // current combo length
  comboAt: 0,      // performance.now() of the last landed hit
  lastMove: "",    // name of the last attack (Jab/Cross/Hook/Uppercut/Kick)
};

export const COMBO_MOVES = ["Jab", "Cross", "Hook", "Uppercut", "Tendang"];
