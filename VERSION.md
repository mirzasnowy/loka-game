# Versioning Rule

Current version: **1.2.4**

## Scheme: `MAJOR.MINOR.PATCH`

- **PATCH** (`1.2.1` → `1.2.2` → `1.2.3` …): every normal change, fix, or small
  feature. **This is the default — always bump the patch.**
- **MINOR** (`1.2.x` → `1.3.0`): only when the build is **stable** and a meaningful
  milestone is reached. Do **not** jump to a new minor for routine work.
- **MAJOR** (`1.x` → `2.0.0`): big rewrites / breaking changes only.

So: keep shipping `1.2.1, 1.2.2, 1.2.3, …`. Move to `1.3.0` **only** when things are
stable and we deliberately cut a milestone.

## On each change
1. Bump the patch here and in `package.json`.
2. Commit `vX.Y.Z — summary`.
3. Push `main` → Cloudflare Pages auto-redeploys to https://loka.mirzakur.xyz

## History
- 1.2.4 — solid colliders for world props (trees, lamps, traffic poles, benches,
  bollards, carts, stores, haltes, station) so you can't walk through them; proper
  3-aspect traffic-light models (red/yellow/green stacked) at intersections, lit per
  the signal phase, with vehicles obeying them.
- 1.2.3 — vehicle crash effects (inelastic jolt, sparks, camera shake), vehicles run
  over & kill pedestrians, rear-end braking (no more driving through cars), kill counter
  (warga/preman) in HUD, money drops from kills you can walk over to collect, proper
  sit-on-chair (pinned to seat + knee-jointed sit pose, analog disabled), animated
  seated rider on motorcycles/cars, FPS pistol one-handed with snappy recoil.
- 1.2.2 — fixed floating vehicles (traffic body height + drivable collider offset),
  precise crosshair raycast shooting (no more random kills), FPS pistol aimed forward,
  robust HUD (smaller minimap + one low fixed action row, no minimap overlap).
- 1.2.1 — clock beside quest (top center), fixed non-overlapping action buttons,
  first-person viewmodel (animated hands/pistol), versioning rule.
- 1.2.0 — boxer body/head punch motion, redesigned minimal GUI (hotbar, top banner).
