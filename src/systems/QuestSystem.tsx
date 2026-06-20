"use client";

import { useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGame } from "@/core/store";
import { QUESTS } from "@/data/quests";
import { STARTER_QUESTS } from "@/data/quests";

/**
 * Quest runtime. Starts the opening quests, and each frame checks position-based
 * objectives ("reach"/"deliver") against the player — event-based ones ("buy"/
 * "defeat") are advanced by their source systems via store.reportEvent.
 */
export default function QuestSystem() {
  const startQuest = useGame((s) => s.startQuest);

  useEffect(() => {
    // Start any starter quest not already in progress/complete from a save.
    const { quests } = useGame.getState();
    STARTER_QUESTS.forEach((id) => {
      if (!quests[id]) startQuest(id);
    });
  }, [startQuest]);

  useFrame(() => {
    const st = useGame.getState();
    if (st.paused) return;
    const [px, , pz] = st.runtime.pos;

    for (const prog of Object.values(st.quests)) {
      if (prog.done) continue;
      const def = QUESTS.find((q) => q.id === prog.id);
      const obj = def?.objectives[prog.step];
      if (!obj || (obj.kind !== "reach" && obj.kind !== "deliver")) continue;
      if (!obj.pos) continue;
      const d = Math.hypot(px - obj.pos[0], pz - obj.pos[2]);
      if (d <= (obj.radius ?? 15)) {
        st.advanceObjective(prog.id, obj.id, 1);
      }
    }
  });

  return null;
}
