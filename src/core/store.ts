"use client";

import { create } from "zustand";
import { QUESTS, type QuestDef, type ObjectiveKind } from "@/data/quests";

/**
 * Central world state — the "components" half of an ECS-ish design. Systems
 * (time, npc, traffic, combat, quest...) read and mutate slices here instead of
 * importing each other. High-frequency data (thousands of agent transforms)
 * stays in system-local refs for perf; only gameplay-relevant facts live here.
 */

export type TimeOfDay = "morning" | "afternoon" | "sunset" | "night";
export type Weather = "clear" | "cloudy" | "rain";

export interface PlayerStats {
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  money: number; // Rupiah
  exp: number;
  level: number;
}

export interface QuestProgress {
  id: string;
  step: number; // index into QuestDef.objectives
  counters: Record<string, number>; // objective id -> progress count
  done: boolean;
}

export interface InteractTarget {
  id: string;
  kind: "vendor" | "vehicle" | "npc" | "poi";
  label: string; // prompt text, e.g. "Beli Bakso (Rp 15.000)"
  pos: [number, number, number];
}

/** Live, shared world facts the player's transform/state. Written by Player. */
export interface PlayerRuntime {
  pos: [number, number, number];
  facing: number; // yaw the player visual is facing
  inVehicleId: string | null;
}

interface GameState {
  booted: boolean;
  paused: boolean;

  player: PlayerStats;
  runtime: PlayerRuntime;

  // time + weather
  clock: number; // hours 0..24
  timeScale: number; // game-seconds per real-second (multiplier)
  timeOfDay: TimeOfDay;
  weather: Weather;

  // interaction
  interact: InteractTarget | null;

  // quests
  quests: Record<string, QuestProgress>;
  activeQuestId: string | null;

  // combat
  inCombat: boolean;
  enemiesAlive: number;

  // notifications (transient toasts)
  toast: { id: number; text: string } | null;

  // --- actions ---
  setBooted: (b: boolean) => void;
  setPaused: (b: boolean) => void;

  setPlayerPos: (p: [number, number, number]) => void;
  setPlayerFacing: (yaw: number) => void;
  setInVehicle: (id: string | null) => void;

  addMoney: (rp: number) => boolean; // false if can't afford a negative amount
  damage: (n: number) => void;
  heal: (n: number) => void;
  setStamina: (n: number) => void;
  addExp: (n: number) => void;

  setClock: (h: number) => void;
  setTimeOfDay: (t: TimeOfDay) => void;
  setWeather: (w: Weather) => void;

  setInteract: (t: InteractTarget | null) => void;

  startQuest: (id: string) => void;
  advanceObjective: (questId: string, objectiveId: string, amount?: number) => void;
  /** Fan a world event out to every active quest watching for it. */
  reportEvent: (kind: ObjectiveKind, info?: { target?: string; amount?: number }) => void;
  setActiveQuest: (id: string | null) => void;

  setCombat: (inCombat: boolean, enemiesAlive: number) => void;

  notify: (text: string) => void;
  hydrate: (partial: Partial<SaveShape>) => void;
}

/** Subset of state we persist. Keep flat + serializable. */
export interface SaveShape {
  player: PlayerStats;
  clock: number;
  weather: Weather;
  quests: Record<string, QuestProgress>;
  activeQuestId: string | null;
  runtime: Pick<PlayerRuntime, "pos">;
}

function deriveTimeOfDay(h: number): TimeOfDay {
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 16) return "afternoon";
  if (h >= 16 && h < 19) return "sunset";
  return "night";
}

const expForLevel = (lvl: number) => 100 * lvl * lvl;

let toastSeq = 1;

export const useGame = create<GameState>((set, get) => ({
  booted: false,
  paused: false,

  player: {
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    money: 50_000,
    exp: 0,
    level: 1,
  },
  runtime: { pos: [20, 2, 20], facing: 0, inVehicleId: null },

  clock: 7,
  timeScale: 60, // 1 real second = 1 game minute → 24h in 24 real min
  timeOfDay: "morning",
  weather: "clear",

  interact: null,

  quests: {},
  activeQuestId: null,

  inCombat: false,
  enemiesAlive: 0,

  toast: null,

  setBooted: (booted) => set({ booted }),
  setPaused: (paused) => set({ paused }),

  setPlayerPos: (pos) => set((s) => ({ runtime: { ...s.runtime, pos } })),
  setPlayerFacing: (facing) => set((s) => ({ runtime: { ...s.runtime, facing } })),
  setInVehicle: (inVehicleId) => set((s) => ({ runtime: { ...s.runtime, inVehicleId } })),

  addMoney: (rp) => {
    const { money } = get().player;
    if (money + rp < 0) return false;
    set((s) => ({ player: { ...s.player, money: s.player.money + rp } }));
    return true;
  },
  damage: (n) =>
    set((s) => ({ player: { ...s.player, health: Math.max(0, s.player.health - n) } })),
  heal: (n) =>
    set((s) => ({
      player: { ...s.player, health: Math.min(s.player.maxHealth, s.player.health + n) },
    })),
  setStamina: (n) =>
    set((s) => ({
      player: { ...s.player, stamina: Math.max(0, Math.min(s.player.maxStamina, n)) },
    })),
  addExp: (n) =>
    set((s) => {
      let { exp, level, maxHealth, maxStamina } = s.player;
      exp += n;
      while (exp >= expForLevel(level)) {
        exp -= expForLevel(level);
        level += 1;
        maxHealth += 10;
        maxStamina += 5;
      }
      return {
        player: { ...s.player, exp, level, maxHealth, maxStamina },
      };
    }),

  setClock: (h) => set({ clock: ((h % 24) + 24) % 24, timeOfDay: deriveTimeOfDay(h) }),
  setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
  setWeather: (weather) => set({ weather }),

  setInteract: (interact) => set({ interact }),

  startQuest: (id) => {
    if (get().quests[id]) return;
    const def = QUESTS.find((q) => q.id === id);
    if (!def) return;
    set((s) => ({
      quests: {
        ...s.quests,
        [id]: { id, step: 0, counters: {}, done: false },
      },
      activeQuestId: s.activeQuestId ?? id,
    }));
    get().notify(`Quest baru: ${def.title}`);
  },

  advanceObjective: (questId, objectiveId, amount = 1) => {
    const def = QUESTS.find((q) => q.id === questId);
    const prog = get().quests[questId];
    if (!def || !prog || prog.done) return;
    const obj = def.objectives[prog.step];
    if (!obj || obj.id !== objectiveId) return;

    const have = (prog.counters[objectiveId] ?? 0) + amount;
    const need = obj.count ?? 1;
    const counters = { ...prog.counters, [objectiveId]: have };

    if (have >= need) {
      const nextStep = prog.step + 1;
      const finished = nextStep >= def.objectives.length;
      set((s) => ({
        quests: {
          ...s.quests,
          [questId]: { ...prog, counters, step: finished ? prog.step : nextStep, done: finished },
        },
      }));
      if (finished) {
        get().addMoney(def.reward.money);
        get().addExp(def.reward.exp);
        get().notify(`Quest selesai: ${def.title} (+Rp ${def.reward.money.toLocaleString("id-ID")})`);
      } else {
        get().notify(`Objektif selesai: ${obj.label}`);
      }
    } else {
      set((s) => ({ quests: { ...s.quests, [questId]: { ...prog, counters } } }));
    }
  },

  reportEvent: (kind, info = {}) => {
    const { quests } = get();
    for (const prog of Object.values(quests)) {
      if (prog.done) continue;
      const def = QUESTS.find((q) => q.id === prog.id);
      const obj = def?.objectives[prog.step];
      if (!obj || obj.kind !== kind) continue;
      if (obj.target && obj.target !== info.target) continue;
      get().advanceObjective(prog.id, obj.id, info.amount ?? 1);
    }
  },

  setActiveQuest: (activeQuestId) => set({ activeQuestId }),

  setCombat: (inCombat, enemiesAlive) => set({ inCombat, enemiesAlive }),

  notify: (text) => set({ toast: { id: toastSeq++, text } }),

  hydrate: (p) =>
    set((s) => ({
      player: p.player ? { ...s.player, ...p.player } : s.player,
      clock: p.clock ?? s.clock,
      timeOfDay: deriveTimeOfDay(p.clock ?? s.clock),
      weather: p.weather ?? s.weather,
      quests: p.quests ?? s.quests,
      activeQuestId: p.activeQuestId ?? s.activeQuestId,
      runtime: p.runtime?.pos ? { ...s.runtime, pos: p.runtime.pos } : s.runtime,
    })),
}));

export { deriveTimeOfDay, expForLevel, QUESTS };
export type { QuestDef };
