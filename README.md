# Loka — Open World Indonesia 🇮🇩

Stylized low-poly open-world **Jakarta**. Drive through Sudirman, brawl with
preman, ride a Honda Beat past Monas, eat bakso from a kaki-lima — all in the
browser.

## ▶️ Play now

**https://loka.mirzakur.xyz**

Works on desktop and mobile (touch controls). No install.

---

## Tech

Next.js 15 (static export) · React Three Fiber · Three.js · @react-three/rapier
(physics) · Zustand (state) · TypeScript. Primitives-first: every placeholder is
swappable for real GLB art with **zero gameplay-code changes** (see
`src/core/assetRegistry.tsx`).

## Features

- **Open city** on a real road grid — cars stay in lanes, pedestrians on
  sidewalks and cross at zebra crossings, working **traffic lights**.
- **Third- & first-person** camera (toggle TPS/FPS), full 360° look on mouse + touch.
- **Melee combos** — jab / cross / hook / uppercut / kick with an on-screen
  combo counter; **gun** with auto-aim, tracers, recoil, muzzle flash and reload.
- **NPCs** react: pedestrians flee when hit and can go down; preman fight back.
- **Vehicles** — Honda Beat/Vario/NMAX, Avanza, Innova, pickup, TransJakarta;
  walk up and an **Enter** prompt appears automatically.
- Get **run over** by traffic → knockback, ragdoll knockdown + get-up, red screen.
- **Sit** on park benches; riding animation on motorbikes.
- **Day/night + weather** with rain and **lightning**, volumetric clouds, dynamic sky.
- Landmarks: precise **Monas**, KRL station, bus haltes, Indomaret/Alfamart,
  street-food carts (bakso/somay/cilok/es-teh/nasi goreng).
- Quests, economy (Rupiah), inventory, leveling, localStorage save.

## Controls

| Action | Desktop | Mobile |
|---|---|---|
| Move | WASD / arrows | left joystick |
| Look | drag mouse | drag right side |
| Run | Shift | — |
| Jump | Space | Lompat |
| Punch / combo | J | Pukul |
| Kick | K | (combo) |
| Block / Dodge | B / Ctrl | Tangkis / Hindar |
| Fire / Reload | F / R | Tembak / Isi |
| Swap weapon | Q | Senjata |
| Toggle FPS/TPS | V | 👁 |
| Interact (enter car, buy, sit) | E | Aksi |
| Inventory | I / Tab | 🎒 Tas |

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export → ./out
npm test         # gameplay logic self-checks
```

## Deploy (CI/CD)

Pushing to `main` on GitHub auto-builds and redeploys to **Cloudflare Pages**
(project `loka-game`, custom domain `loka.mirzakur.xyz`). No manual step.

---

Made with [Claude Code](https://claude.com/claude-code).
