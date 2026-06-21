"use client";

import { useGame, type SaveShape } from "./store";

/**
 * Save system. localStorage now; the SaveDriver interface is the seam for a
 * cloud backend later (implement load/save against an API, swap the export).
 */
const KEY = "loka.save.v1";

export interface SaveDriver {
  load(): SaveShape | null;
  save(data: SaveShape): void;
  clear(): void;
}

const localDriver: SaveDriver = {
  load() {
    if (typeof window === "undefined") return null;
    try {
      const raw = window.localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as SaveShape) : null;
    } catch {
      return null;
    }
  },
  save(data) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* quota or private mode — ignore, gameplay continues */
    }
  },
  clear() {
    if (typeof window !== "undefined") window.localStorage.removeItem(KEY);
  },
};

// ponytail: single driver for now; cloud save swaps this binding, no callers change.
export const saveDriver: SaveDriver = localDriver;

function snapshot(): SaveShape {
  const s = useGame.getState();
  return {
    player: s.player,
    clock: s.clock,
    weather: s.weather,
    quests: s.quests,
    activeQuestId: s.activeQuestId,
    runtime: { pos: s.runtime.pos },
    inventory: s.inventory,
    ammo: s.ammo,
    equipped: s.equipped,
  };
}

export function saveGame() {
  saveDriver.save(snapshot());
}

export function loadGame(): boolean {
  const data = saveDriver.load();
  if (!data) return false;
  useGame.getState().hydrate(data);
  return true;
}

let autosaveId: ReturnType<typeof setInterval> | null = null;
export function startAutosave(intervalMs = 15_000) {
  stopAutosave();
  autosaveId = setInterval(saveGame, intervalMs);
  if (typeof window !== "undefined") window.addEventListener("beforeunload", saveGame);
}
export function stopAutosave() {
  if (autosaveId) clearInterval(autosaveId);
  autosaveId = null;
  if (typeof window !== "undefined") window.removeEventListener("beforeunload", saveGame);
}
