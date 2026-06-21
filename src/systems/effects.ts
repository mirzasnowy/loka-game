/**
 * Shared world effects: camera shake, impact sparks, and pick-up-able money drops.
 * Systems push into these; EffectsSystem renders sparks + coins and handles
 * pickup; Player reads `fx.shake` for the camera.
 */

export const fx = { shake: 0 };
export function addShake(a: number) { fx.shake = Math.min(1.6, fx.shake + a); }

export interface Spark { x: number; y: number; z: number; at: number; }
export const sparks: Spark[] = [];
export function addSpark(x: number, y: number, z: number) {
  sparks.push({ x, y, z, at: performance.now() });
  if (sparks.length > 48) sparks.shift();
}

export interface MoneyDrop { id: number; x: number; z: number; amt: number; born: number; }
let dropSeq = 1;
export const moneyDrops: MoneyDrop[] = [];
export function dropMoney(x: number, z: number, amt: number) {
  moneyDrops.push({ id: dropSeq++, x, z, amt, born: performance.now() });
  if (moneyDrops.length > 60) moneyDrops.shift();
}
