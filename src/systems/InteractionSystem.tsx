"use client";

import { useFrame } from "@react-three/fiber";
import { useGame, type InteractTarget } from "@/core/store";
import { input } from "@/core/input";
import { VENDOR_PLACEMENTS, VENDORS } from "@/data/vendors";
import { drivables } from "./registries";

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

    if (best?.id !== st.interact?.id || best?.kind !== st.interact?.kind) setInteract(best);

    if (best && input.consume("interact")) {
      const g = useGame.getState();
      const target = best as InteractTarget;
      if (target.kind === "vehicle") {
        g.setInVehicle(target.id);
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
