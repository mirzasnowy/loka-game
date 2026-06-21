/**
 * Per-NPC combat/flee state, shared so CombatSystem + GunSystem can hit ordinary
 * pedestrians (not just preman). NPCSystem owns movement and reads these flags.
 */
import { MAX_NPCS, npcPositions } from "@/core/store";

export const npcHp = new Float32Array(MAX_NPCS).fill(30);
export const npcFleeUntil = new Float32Array(MAX_NPCS); // performance.now() ms
export const npcHitAt = new Float32Array(MAX_NPCS);
export const npcDead = new Uint8Array(MAX_NPCS);

/**
 * Damage the nearest living NPC inside a forward cone. Marks it fleeing; kills it
 * if hp drops to 0. Returns { idx, killed } (idx -1 if nothing was in range).
 */
export function hitNpcNear(px: number, pz: number, fx: number, fz: number, reach: number, dmg: number): { idx: number; killed: boolean } {
  let best = -1;
  let bestScore = -Infinity;
  for (let i = 0; i < MAX_NPCS; i++) {
    if (npcDead[i]) continue;
    const x = npcPositions[i * 2];
    const z = npcPositions[i * 2 + 1];
    if (x > 90000) continue;
    const dx = x - px, dz = z - pz;
    const d = Math.hypot(dx, dz);
    if (d > reach || d < 0.01) continue;
    const dot = (dx / d) * fx + (dz / d) * fz;
    if (dot < 0.45) continue; // ~63° cone
    const score = dot - d / reach;
    if (score > bestScore) { bestScore = score; best = i; }
  }
  if (best < 0) return { idx: -1, killed: false };
  return { idx: best, killed: damageNpc(best, dmg) };
}

/** Apply damage to a specific NPC index. Returns true if it killed them. */
export function damageNpc(idx: number, dmg: number): boolean {
  if (idx < 0 || npcDead[idx]) return false;
  const now = performance.now();
  npcHp[idx] -= dmg;
  npcHitAt[idx] = now;
  npcFleeUntil[idx] = now + 6000;
  if (npcHp[idx] <= 0) { npcDead[idx] = 1; npcHitAt[idx] = now; return true; }
  return false;
}
