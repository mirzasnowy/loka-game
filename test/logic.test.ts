/**
 * Framework-free self-check for the store's gameplay logic (quest progression,
 * economy guard, leveling). Run: `npx tsx test/logic.test.ts`
 */
import assert from "node:assert";
import { useGame, expForLevel } from "../src/core/store";

const g = () => useGame.getState();

// --- economy guard: can't spend into the negative ---
const startMoney = g().player.money;
assert.equal(g().addMoney(-1_000_000_000), false, "overspend rejected");
assert.equal(g().player.money, startMoney, "balance unchanged after rejected spend");
assert.equal(g().addMoney(-10_000), true, "affordable spend ok");
assert.equal(g().player.money, startMoney - 10_000, "balance debited");

// --- leveling: crossing the threshold levels up and raises caps ---
const lvl0 = g().player.level;
const maxHp0 = g().player.maxHealth;
g().addExp(expForLevel(lvl0));
assert.equal(g().player.level, lvl0 + 1, "leveled up");
assert.ok(g().player.maxHealth > maxHp0, "max health grew on level up");

// --- quest: multi-step quest advances on matching events then pays out ---
g().startQuest("delivery-01-warung");
const before = g().player.money;
// step 0 is a "buy" of nasi-goreng
g().reportEvent("buy", { target: "nasi-goreng" });
assert.equal(g().quests["delivery-01-warung"].step, 1, "advanced to deliver step");
assert.equal(g().quests["delivery-01-warung"].done, false, "not done after first step");
// wrong-target buy must not advance the deliver step (it's a deliver, not buy)
g().reportEvent("buy", { target: "bakso" });
assert.equal(g().quests["delivery-01-warung"].step, 1, "unrelated event ignored");
// finish via the deliver objective
g().advanceObjective("delivery-01-warung", "deliver-hi", 1);
assert.equal(g().quests["delivery-01-warung"].done, true, "quest completed");
assert.ok(g().player.money > before, "reward paid out");

// --- defeat counter: needs N events to complete ---
g().startQuest("side-01-preman");
g().reportEvent("defeat", { target: "preman" });
g().reportEvent("defeat", { target: "preman" });
assert.equal(g().quests["side-01-preman"].done, false, "2/3 not done");
g().reportEvent("defeat", { target: "preman" });
assert.equal(g().quests["side-01-preman"].done, true, "3/3 done");

console.log("OK — all gameplay logic self-checks passed");
