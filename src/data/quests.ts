/**
 * Data-driven quests. A quest is a list of ordered objectives; the QuestSystem
 * watches world events and advances them. Add a quest = add an entry here (or
 * load this array from JSON/CDN later — the shape is plain serializable data).
 */

export type ObjectiveKind =
  | "reach" // get within `radius` of `pos`
  | "talk" // interact with npc/poi `target`
  | "buy" // buy `count` items from any vendor (or `target` vendor kind)
  | "defeat" // defeat `count` enemies of `target` kind
  | "deliver"; // reach `pos` while carrying (set by a prior buy/talk)

export interface Objective {
  id: string;
  kind: ObjectiveKind;
  label: string;
  count?: number;
  radius?: number;
  pos?: [number, number, number];
  target?: string;
}

export interface QuestDef {
  id: string;
  title: string;
  type: "main" | "side" | "delivery";
  giver?: string;
  objectives: Objective[];
  reward: { money: number; exp: number };
}

export const QUESTS: QuestDef[] = [
  {
    id: "main-01-arrival",
    title: "Selamat Datang di Jakarta",
    type: "main",
    objectives: [
      { id: "go-monas", kind: "reach", label: "Pergi ke Monas", pos: [0, 0, 40], radius: 20 },
      { id: "eat-bakso", kind: "buy", label: "Beli makanan dari pedagang", count: 1 },
    ],
    reward: { money: 25_000, exp: 80 },
  },
  {
    id: "side-01-preman",
    title: "Bersihkan Preman",
    type: "side",
    objectives: [
      { id: "beat-preman", kind: "defeat", label: "Kalahkan 3 preman", count: 3, target: "preman" },
    ],
    reward: { money: 40_000, exp: 150 },
  },
  {
    id: "delivery-01-warung",
    title: "Antar Pesanan Warung",
    type: "delivery",
    objectives: [
      { id: "buy-food", kind: "buy", label: "Beli nasi goreng", count: 1, target: "nasi-goreng" },
      {
        id: "deliver-hi",
        kind: "deliver",
        label: "Antar ke Bundaran HI",
        pos: [120, 0, 60],
        radius: 18,
      },
    ],
    reward: { money: 30_000, exp: 120 },
  },
];

export const STARTER_QUESTS = ["main-01-arrival", "side-01-preman"];
