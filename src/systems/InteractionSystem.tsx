"use client";

import { useFrame } from "@react-three/fiber";
import { useGame, type InteractTarget } from "@/core/store";
import { input } from "@/core/input";
import { VENDOR_PLACEMENTS, VENDORS } from "@/data/vendors";
import { drivables } from "./registries";
import { avatar } from "@/player/avatarState";
import { generateCity } from "@/world/proc";

// Park benches (matches World.MonasPark) — sit-able seats.
const SEATS: [number, number][] = Array.from({ length: 12 }, (_, k) => {
  const a = (k / 12) * Math.PI * 2 + 0.26, r = 33;
  return [Math.cos(a) * r, Math.sin(a) * r];
});

// Warteg storefronts (placed by proc) — eat-in food.
const WARTEGS: [number, number][] = generateCity().stores
  .filter((s) => s.id === "store_warteg")
  .map((s) => [s.x, s.z + 2.6]); // stand at the counter, in front of the stall
const WARTEG_PRICE = 18_000;

/**
 * Proximity interaction + economy. Finds the nearest interactable (vendor or
 * vehicle) to the player, exposes a prompt via store.interact, and on the
 * "interact" action performs buy / enter / exit. Decoupled from the player
 * controller: it only flips store flags the controller already reacts to.
 */

const REACH = 4.5;

export default function InteractionSystem() {
  const setInteract = useGame((s) => s.setInteract);

  useFrame(() => {
    const st = useGame.getState();
    if (st.paused) return;
    const [px, , pz] = st.runtime.pos;

    // While sitting, the only interaction is to stand up.
    if (avatar.sitting) {
      const target: InteractTarget = { id: "seat", kind: "poi", label: "Berdiri (E)", pos: [px, 0, pz] };
      if (st.interact?.label !== target.label) setInteract(target);
      if (input.consume("interact")) avatar.sitting = false;
      return;
    }

    // While driving, the only interaction is to exit.
    if (st.runtime.inVehicleId) {
      const target: InteractTarget = {
        id: st.runtime.inVehicleId,
        kind: "vehicle",
        label: "Keluar kendaraan (E)",
        pos: [px, 0, pz],
      };
      if (st.interact?.label !== target.label) setInteract(target);
      if (input.consume("interact")) useGame.getState().setInVehicle(null);
      return;
    }

    // Find nearest vendor or vehicle within reach.
    let best: InteractTarget | null = null;
    let bestDist = REACH;

    for (const p of VENDOR_PLACEMENTS) {
      const v = VENDORS.find((x) => x.id === p.vendorId);
      if (!v) continue;
      const d = Math.hypot(px - p.pos[0], pz - p.pos[2]);
      if (d < bestDist) {
        bestDist = d;
        best = {
          id: v.id,
          kind: "vendor",
          label: `Beli ${v.food.name} — Rp ${v.food.price.toLocaleString("id-ID")} (E)`,
          pos: p.pos,
        };
      }
    }

    drivables.forEach((entry) => {
      const t = entry.body.translation();
      const d = Math.hypot(px - t.x, pz - t.z);
      if (d < bestDist) {
        bestDist = d;
        best = {
          id: entry.uid,
          kind: "vehicle",
          label: `Naik ${entry.spec.name} (E)`,
          pos: [t.x, t.y, t.z],
        };
      }
    });

    // Benches (sit)
    for (const [sx, sz] of SEATS) {
      const d = Math.hypot(px - sx, pz - sz);
      if (d < bestDist) {
        bestDist = d;
        best = { id: `seat-${sx.toFixed(0)}-${sz.toFixed(0)}`, kind: "poi", label: "Duduk (E)", pos: [sx, 0, sz] };
      }
    }

    // Warteg (eat-in)
    for (const [wx, wz] of WARTEGS) {
      const d = Math.hypot(px - wx, pz - wz);
      if (d < bestDist) {
        bestDist = d;
        best = { id: `warteg-${wx.toFixed(0)}-${wz.toFixed(0)}`, kind: "poi", label: `Makan di Warteg — Rp ${WARTEG_PRICE.toLocaleString("id-ID")} (E)`, pos: [wx, 0, wz] };
      }
    }

    if (best?.id !== st.interact?.id || best?.kind !== st.interact?.kind) setInteract(best);

    if (best && input.consume("interact")) {
      const g = useGame.getState();
      const target = best as InteractTarget;
      if (target.kind === "vehicle") {
        g.setInVehicle(target.id);
      } else if (target.kind === "poi" && target.id.startsWith("warteg")) {
        if (g.addMoney(-WARTEG_PRICE)) {
          g.heal(55);
          g.setStamina(g.player.stamina + 45);
          g.reportEvent("buy", { target: "warteg" });
          g.notify("Makan di Warteg (+55 HP) 🍛");
        } else {
          g.notify("Uang tidak cukup!");
        }
      } else if (target.kind === "poi") {
        avatar.sitting = true;
        g.notify("Duduk 🪑");
      } else if (target.kind === "vendor") {
        const v = VENDORS.find((x) => x.id === target.id)!;
        if (g.addMoney(-v.food.price)) {
          g.heal(v.food.heal);
          g.setStamina(g.player.stamina + v.food.stamina);
          g.reportEvent("buy", { target: v.food.id });
          g.notify(`Makan ${v.food.name} (+${v.food.heal} HP)`);
        } else {
          g.notify("Uang tidak cukup!");
        }
      }
    } else if (!best && input.consume("interact")) {
      /* nothing nearby — drop the queued press so it doesn't leak */
    }
  });

  return null;
}
