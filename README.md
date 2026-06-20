# Loka — Open World Indonesia

Stylized low-poly open-world Jakarta. Next.js + React Three Fiber + Three.js +
Rapier + Zustand. Built primitives-first so every placeholder is replaceable by
real GLB art with **zero gameplay-code changes**.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
npm test           # gameplay logic self-check (no browser needed)
```

Target: 30 FPS on Android 4GB. Capped DPR + AdaptiveDpr, instanced crowds/
traffic/buildings, spawn-around-player streaming, no antialias, kinematic agents.

## Controls

- **Move**: WASD / arrows / on-screen joystick
- **Run**: Shift · **Jump**: Space · **Dodge** (i-frames): Ctrl
- **Look**: drag mouse / screen
- **Interact** (buy food, enter/exit vehicle): E
- **Punch**: J / LMB · **Kick**: K · **Block**: hold B / RMB
- Mobile: full on-screen joystick + action buttons.

## Architecture

The seam that makes the whole thing future-proof is the **AssetRegistry**
(`src/core/assetRegistry.tsx`). Gameplay never names a mesh or a file — it
renders `<Asset id="monas" />`. To ship real art, drop a file in
`public/assets/` and add one line:

```ts
registerAsset("monas", { placeholder: Monas, glb: "/assets/monas.glb" });
```

No other file changes. Same for `player`, every vehicle, NPC and prop.

```
src/
  core/        assetRegistry · store (Zustand, ECS-ish) · input · save
  data/        quests · vehicles · vendors · drivables   ← data-driven content
  world/       worldConfig · proc (city gen) · World · placeholders
  player/      Player  (single control + camera authority: on-foot & driving)
  systems/     TimeWeather · NPC · Traffic · PlayerVehicles · Combat
               Quest · Interaction · Vendors · registries
  game/        Game (mounts everything) · HUD · Minimap
test/          logic.test.ts
```

**Design rules in force**
- Data-driven: districts, quests, vehicles, vendors, vehicle placements are
  plain serializable arrays — editable/loadable from JSON/CDN later.
- Decoupled systems: they read/write the central store + runtime registries
  (`systems/registries.ts`) instead of holding refs to each other.
- Single input layer (`core/input.ts`): keyboard, mouse and touch all feed one
  place; one-shot actions are edge-triggered and consumed once.

## What works now (playable)

- Procedural Jakarta from the reference: green/tan ground, north coastline,
  road grid, instanced skyline clustered by district (skyscrapers at Sudirman/
  HI → kampung at the edges), Monas, district labels.
- Third-person player (walk/run/jump/dodge) on Rapier physics, stamina drain.
- Day/night clock + weather (clear/cloudy/rain) driving sun, ambient, sky, fog
  and rain.
- Living city: pooled instanced pedestrians (schedule-aware density) and grid
  traffic obeying a 2-phase traffic signal — both spawn/despawn around player.
- Drivable vehicles (Beat/Vario/NMAX/Avanza/Innova/Pickup/TransJakarta) with
  enter/exit and simplified physics.
- Combat (Arkham-lite): punch/kick/block/dodge/combo vs preman with AI + HP.
- Data-driven quests (main/side/delivery) with reach/buy/defeat/deliver
  objectives, rewards, leveling.
- Economy: rupiah, street vendors (bakso/cilok/siomay/es teh/nasi goreng)
  selling food that heals.
- Minimap with POIs, vendors, vehicles, enemies, quest marker.
- Save: localStorage autosave + restore (cloud-save seam in `core/save.ts`).

## Roadmap (next milestones, not yet built)

These hang off the existing seams without touching gameplay code:
GLB art pass · animation/customization · police/escort quests · mosque + adzan
ambient + audio system · businesses/economy depth · fast travel · weather VFX
depth · LOD splits per archetype. Each is a new `system` + `data` entry + a few
`registerAsset` lines.
