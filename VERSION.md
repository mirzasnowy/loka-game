# Versioning Rule

Current version: **1.2.1**

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
- 1.2.1 — clock beside quest (top center), fixed non-overlapping action buttons,
  first-person viewmodel (animated hands/pistol), versioning rule.
- 1.2.0 — boxer body/head punch motion, redesigned minimal GUI (hotbar, top banner).
