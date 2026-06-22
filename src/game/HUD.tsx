"use client";

import { useEffect, useRef, useState } from "react";
import { useGame, type InvItem } from "@/core/store";
import { input, type Action } from "@/core/input";
import { QUESTS } from "@/core/store";
import { VENDORS } from "@/data/vendors";
import { avatar } from "@/player/avatarState";
import { combat } from "@/systems/combatState";
import { view } from "@/core/view";
import { DISTRICT } from "@/world/districtData";
import { DPR_NAV } from "@/world/dprData";
import Minimap from "./Minimap";

const NAV_POINTS = [
  { name: "Monas", short: "🗼 Monas", x: 0, z: 38 },
  DPR_NAV,
  ...DISTRICT.map((p) => ({ name: p.name, short: p.short, x: p.cx, z: p.cz - 11 })),
];

const FOOD = Object.fromEntries(VENDORS.map((v) => [v.food.id, v.food]));

// Safe-area helpers (notch / home indicator) — works on all devices.
const ST = "env(safe-area-inset-top, 0px)";
const SL = "env(safe-area-inset-left, 0px)";
const SR = "env(safe-area-inset-right, 0px)";
const SB = "env(safe-area-inset-bottom, 0px)";
const c = (inset: string, px: number) => `calc(${inset} + ${px}px)`;

const CARD = "rgba(14,17,23,0.55)";
const BORDER = "1px solid rgba(255,255,255,0.10)";
const TIME_LABEL: Record<string, string> = { morning: "Pagi", afternoon: "Siang", sunset: "Senja", night: "Malam" };
const WEATHER_LABEL: Record<string, string> = { clear: "Cerah", cloudy: "Berawan", rain: "Hujan" };

export default function HUD() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mapOn, setMapOn] = useState(true);
  const [clockOn, setClockOn] = useState(true);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", color: "#fff", fontFamily: "system-ui, sans-serif", textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>
      <Stats />
      <TopCenter clockOn={clockOn} />
      <NavBanner />
      {mapOn && !menuOpen && (
        <div style={{ position: "absolute", top: c(ST, 52), right: c(SR, 12), zIndex: 10 }}><Minimap /></div>
      )}
      <Hamburger menuOpen={menuOpen} setMenuOpen={setMenuOpen} mapOn={mapOn} setMapOn={setMapOn} clockOn={clockOn} setClockOn={setClockOn} />
      <Prompt />
      <Toast />
      <Crosshair />
      <DamageVignette />
      <ComboCounter />
      <Hotbar />
      <MobileControls />
      <InventoryPanel />
      <DeathScreen />
    </div>
  );
}

/* --------------------------------- stats -------------------------------- */

function Stats() {
  const p = useGame((s) => s.player);
  const kills = useGame((s) => s.kills);
  return (
    <div style={{ position: "absolute", top: c(ST, 10), left: c(SL, 12), fontSize: 12, background: CARD, backdropFilter: "blur(8px)", padding: "9px 11px", borderRadius: 12, border: BORDER, minWidth: 148, zIndex: 30 }}>
      <Bar label="❤️" value={p.health} max={p.maxHealth} color="#ff5b54" />
      <Bar label="⚡" value={p.stamina} max={p.maxStamina} color="#ffc23d" />
      <div style={{ marginTop: 7, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontWeight: 800, color: "#ffe082" }}>Rp {p.money.toLocaleString("id-ID")}</span>
        <span style={{ fontSize: 11, opacity: 0.8 }}>Lv {p.level}</span>
      </div>
      <div style={{ marginTop: 4, fontSize: 11, opacity: 0.85, display: "flex", gap: 10 }}>
        <span>💀 Preman {kills.preman}</span>
        <span>🧍 Warga {kills.warga}</span>
      </div>
    </div>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
      <span style={{ fontSize: 12, width: 16 }}>{label}</span>
      <div style={{ flex: 1, height: 7, background: "rgba(0,0,0,0.45)", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, height: "100%", background: color, transition: "width 0.2s" }} />
      </div>
    </div>
  );
}

/* --------------------------- top-center banner -------------------------- */

function TopCenter({ clockOn }: { clockOn: boolean }) {
  const quests = useGame((s) => s.quests);
  const activeId = useGame((s) => s.activeQuestId);
  const clock = useGame((s) => s.clock);
  const tod = useGame((s) => s.timeOfDay);
  const weather = useGame((s) => s.weather);
  const aq = activeId ? quests[activeId] : null;
  const def = aq ? QUESTS.find((q) => q.id === aq.id) : null;
  const obj = def && aq && !aq.done ? def.objectives[aq.step] : null;
  const have = obj && aq ? aq.counters[obj.id] ?? 0 : 0;
  const need = obj?.count ?? 1;
  const hh = Math.floor(clock).toString().padStart(2, "0");
  const mm = Math.floor((clock % 1) * 60).toString().padStart(2, "0");

  return (
    <div style={{ position: "absolute", top: c(ST, 10), left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "row", alignItems: "center", gap: 8, pointerEvents: "none", zIndex: 20 }}>
      {def && (
        <div style={{ background: CARD, backdropFilter: "blur(8px)", border: BORDER, borderRadius: 12, padding: "6px 14px", textAlign: "center", minWidth: 170 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.14em", color: "#ffd24a" }}>{def.type.toUpperCase()}</div>
          <div style={{ fontSize: 13.5, fontWeight: 700 }}>{def.title}</div>
          {aq?.done ? <div style={{ fontSize: 11.5, color: "#7fe08a" }}>✓ Selesai</div>
            : obj ? <div style={{ fontSize: 11.5, opacity: 0.85 }}>◦ {obj.label}{need > 1 ? ` (${have}/${need})` : ""}</div> : null}
        </div>
      )}
      {clockOn && (
        <div style={{ background: CARD, backdropFilter: "blur(8px)", border: BORDER, borderRadius: 12, padding: "6px 12px", fontSize: 12, fontWeight: 700, textAlign: "center", lineHeight: 1.4 }}>
          <div>🕐 {hh}:{mm}</div>
          <div style={{ opacity: 0.85, fontWeight: 600 }}>{TIME_LABEL[tod]} · {WEATHER_LABEL[weather]}</div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ navigation ------------------------------ */

function NavBanner() {
  const nav = useGame((s) => s.navTarget);
  const [info, setInfo] = useState({ dist: 0, ang: 0 });
  useEffect(() => {
    if (!nav) return;
    let raf = 0;
    const tick = () => {
      const st = useGame.getState();
      const [px, , pz] = st.runtime.pos;
      const dx = nav.x - px, dz = nav.z - pz;
      const dist = Math.hypot(dx, dz);
      if (dist < 12) { st.setNavTarget(null); st.notify(`Tiba di ${nav.name} ✅`); return; }
      setInfo({ dist, ang: Math.atan2(dx, dz) - st.runtime.facing });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [nav]);
  if (!nav) return null;
  return (
    <div style={{ position: "absolute", top: c(ST, 62), left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 8, background: "rgba(14,17,23,0.62)", backdropFilter: "blur(8px)", border: "1px solid rgba(80,200,255,0.4)", borderRadius: 999, padding: "5px 8px 5px 12px", fontSize: 12.5, fontWeight: 700, pointerEvents: "auto", zIndex: 25, boxShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
      <span style={{ display: "inline-block", transform: `rotate(${info.ang}rad)`, color: "#5fd0ff", fontSize: 14 }}>▲</span>
      <span>{nav.name}</span>
      <span style={{ opacity: 0.7 }}>{Math.round(info.dist)}m</span>
      <button data-ui="1" onPointerDown={(e) => { e.preventDefault(); useGame.getState().setNavTarget(null); }}
        style={{ width: 22, height: 22, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.14)", color: "#fff", fontSize: 12, lineHeight: 1 }}>✕</button>
    </div>
  );
}

/* ---------------------------- hamburger menu ---------------------------- */

function Hamburger(props: {
  menuOpen: boolean; setMenuOpen: (b: boolean) => void;
  mapOn: boolean; setMapOn: (b: boolean) => void;
  clockOn: boolean; setClockOn: (b: boolean) => void;
}) {
  const { menuOpen, setMenuOpen, mapOn, setMapOn, clockOn, setClockOn } = props;
  const [, force] = useState(0);
  const Item = ({ label, on, onClick }: { label: string; on?: boolean; onClick: () => void }) => (
    <button data-ui="1" onPointerDown={(e) => { e.preventDefault(); onClick(); }}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "rgba(255,255,255,0.07)", color: "#fff", border: "none", borderRadius: 9, padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>
      <span>{label}</span>
      {on !== undefined && <span style={{ fontSize: 11, fontWeight: 800, color: on ? "#5fd36a" : "#888" }}>{on ? "ON" : "OFF"}</span>}
    </button>
  );
  return (
    <>
      <button data-ui="1" onPointerDown={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); }}
        style={{ position: "absolute", top: c(ST, 10), right: c(SR, 12), width: 40, height: 40, borderRadius: 11, border: BORDER, background: CARD, backdropFilter: "blur(8px)", color: "#fff", fontSize: 18, pointerEvents: "auto", touchAction: "none", zIndex: 210 }}>
        {menuOpen ? "✕" : "☰"}
      </button>
      {menuOpen && (
        <>
          {/* backdrop to guarantee taps land + close on outside tap */}
          <div data-ui="1" onPointerDown={() => setMenuOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", pointerEvents: "auto", zIndex: 190 }} />
          <div style={{ position: "absolute", top: c(ST, 56), right: c(SR, 12), width: 200, maxHeight: "78vh", overflowY: "auto", background: "rgba(18,22,30,0.97)", border: BORDER, borderRadius: 12, padding: 8, pointerEvents: "auto", display: "flex", flexDirection: "column", gap: 6, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", zIndex: 200 }}>
            <Item label="🗺️ Peta" on={mapOn} onClick={() => setMapOn(!mapOn)} />
            <Item label="🕐 Jam & Cuaca" on={clockOn} onClick={() => setClockOn(!clockOn)} />
            <Item label={`🎥 Kamera ${view.mode.toUpperCase()}`} onClick={() => { view.mode = view.mode === "tps" ? "fps" : "tps"; force((n) => n + 1); }} />
            <Item label="🎒 Inventaris" onClick={() => { useGame.getState().toggleInventory(true); setMenuOpen(false); }} />
            <Item label="💫 Respawn" onClick={() => { useGame.getState().respawn(); setMenuOpen(false); }} />
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", color: "#ffd24a", padding: "6px 4px 2px", borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 2 }}>🧭 NAVIGASI</div>
            {NAV_POINTS.map((n) => (
              <button key={n.name} data-ui="1" onPointerDown={(e) => { e.preventDefault(); useGame.getState().setNavTarget(n); setMenuOpen(false); }}
                style={{ textAlign: "left", background: "rgba(255,255,255,0.06)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 11px", fontSize: 12.5, fontWeight: 600 }}>
                {n.short}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}

/* ------------------------------ hotbar slots ----------------------------- */

function Hotbar() {
  const equipped = useGame((s) => s.equipped);
  const ammo = useGame((s) => s.ammo);
  const inv = useGame((s) => s.inventory);

  type Slot = { id: string; icon: string; active?: boolean; badge?: number | string; onTap: () => void };
  const slots: Slot[] = [];
  slots.push({ id: "fists", icon: "👊", active: equipped === "fists", onTap: () => useGame.getState().setEquipped("fists") });
  if (inv.find((i) => i.id === "pistol")) {
    slots.push({ id: "pistol", icon: "🔫", badge: ammo, active: equipped === "pistol", onTap: () => useGame.getState().setEquipped("pistol") });
  }
  for (const it of inv.filter((i) => i.kind === "food" || i.id === "hp-kit")) {
    slots.push({
      id: it.id, icon: it.icon, badge: it.qty, onTap: () => {
        const g = useGame.getState();
        if (it.id === "hp-kit") { g.heal(60); g.removeItem("hp-kit", 1); g.notify("P3K dipakai (+60 HP)"); }
        else { const f = FOOD[it.id]; if (f) { g.heal(f.heal); g.setStamina(g.player.stamina + f.stamina); } g.removeItem(it.id, 1); g.notify(`Makan ${it.name}`); }
      },
    });
  }

  return (
    <div style={{ position: "absolute", bottom: c(SB, 12), left: "50%", transform: "translateX(-50%)", display: "flex", gap: 7, pointerEvents: "auto", zIndex: 40 }}>
      {slots.map((s) => (
        <button key={s.id} data-ui="1" onPointerDown={(e) => { e.preventDefault(); s.onTap(); }}
          style={{ position: "relative", width: 46, height: 46, borderRadius: 11, background: s.active ? "rgba(255,200,60,0.22)" : "rgba(14,17,23,0.55)", backdropFilter: "blur(6px)", border: s.active ? "2px solid #ffd24a" : BORDER, fontSize: 20, touchAction: "none" }}>
          {s.icon}
          {s.badge !== undefined && (
            <span style={{ position: "absolute", right: -3, bottom: -3, minWidth: 16, height: 16, padding: "0 3px", borderRadius: 8, background: "#222", border: "1px solid rgba(255,255,255,0.2)", fontSize: 10, fontWeight: 800, lineHeight: "15px", color: "#fff" }}>{s.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------- effects ------------------------------- */

function DamageVignette() {
  const [op, setOp] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const dt = performance.now() - avatar.hurtAt;
      setOp(dt < 450 ? (1 - dt / 450) * 0.55 : 0);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  if (op <= 0.001) return null;
  return <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(ellipse at center, transparent 45%, rgba(190,0,0,${op}) 100%)` }} />;
}

function ComboCounter() {
  const [s, setS] = useState<{ n: number; move: string; op: number }>({ n: 0, move: "", op: 0 });
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const dt = performance.now() - combat.comboAt;
      setS({ n: combat.comboCount, move: combat.lastMove, op: dt < 900 ? 1 : dt < 1300 ? 1 - (dt - 900) / 400 : 0 });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  if (s.op <= 0.01 || s.n < 2) return null;
  const scale = 1 + Math.min(s.n, 8) * 0.06;
  return (
    <div style={{ position: "absolute", top: "32%", left: "50%", transform: `translate(-50%,-50%) scale(${scale})`, opacity: s.op, pointerEvents: "none", textAlign: "center" }}>
      <div style={{ fontSize: 38, fontWeight: 900, color: "#ffd24a", textShadow: "0 2px 8px #000, 0 0 18px rgba(255,180,20,0.6)" }}>COMBO x{s.n}</div>
      <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.1em" }}>{s.move}!</div>
    </div>
  );
}

function Crosshair() {
  const equipped = useGame((s) => s.equipped);
  const hitTime = useGame((s) => s.hitMarkerTime ?? 0);
  const isHit = performance.now() - hitTime < 200;
  if (equipped !== "pistol") return null;
  return (
    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 22, height: 22, pointerEvents: "none", zIndex: 10 }}>
      <div style={{ position: "absolute", top: "50%", left: 0, width: "100%", height: 2, marginTop: -1, background: isHit ? "#ff3333" : "rgba(255,255,255,0.8)" }} />
      <div style={{ position: "absolute", left: "50%", top: 0, height: "100%", width: 2, marginLeft: -1, background: isHit ? "#ff3333" : "rgba(255,255,255,0.8)" }} />
    </div>
  );
}

/* ------------------------------ prompt/toast ----------------------------- */

function Prompt() {
  const interact = useGame((s) => s.interact);
  if (!interact) return null;
  return (
    <div style={{ position: "absolute", bottom: c(SB, 70), left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.62)", border: BORDER, padding: "8px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600, zIndex: 45 }}>
      {interact.label}
    </div>
  );
}

function Toast() {
  const toast = useGame((s) => s.toast);
  const [shown, setShown] = useState<string | null>(null);
  useEffect(() => {
    if (!toast) return;
    setShown(toast.text);
    const id = setTimeout(() => setShown(null), 3000);
    return () => clearTimeout(id);
  }, [toast?.id, toast]);
  if (!shown) return null;
  return (
    <div style={{ position: "absolute", top: "22%", left: "50%", transform: "translateX(-50%)", background: "rgba(20,20,30,0.9)", border: BORDER, padding: "8px 16px", borderRadius: 20, fontSize: 13.5, maxWidth: "70%", textAlign: "center", zIndex: 60 }}>
      {shown}
    </div>
  );
}

/* ----------------------------- death screen ----------------------------- */

function DeathScreen() {
  const health = useGame((s) => s.player.health);
  if (health > 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(40,0,0,0.55)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "auto", gap: 18, zIndex: 300 }}>
      <div style={{ fontSize: 32, fontWeight: 900, color: "#ff6a6a", textShadow: "0 2px 12px #000" }}>Kamu Pingsan 💀</div>
      <button data-ui="1" onPointerDown={(e) => { e.preventDefault(); useGame.getState().respawn(); }}
        style={{ background: "linear-gradient(135deg,#27ae60,#2ecc71)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 40px", fontSize: 17, fontWeight: 800, letterSpacing: "0.05em", boxShadow: "0 6px 20px rgba(0,0,0,0.4)" }}>
        💫 Respawn
      </button>
    </div>
  );
}

/* ------------------------------- inventory ------------------------------ */

function InventoryPanel() {
  const open = useGame((s) => s.inventoryOpen);
  const items = useGame((s) => s.inventory);
  const equipped = useGame((s) => s.equipped);
  if (!open) return null;
  const use = (item: InvItem) => {
    const g = useGame.getState();
    if (item.kind === "weapon" && item.id === "pistol") g.setEquipped(equipped === "pistol" ? "fists" : "pistol");
    else if (item.id === "hp-kit") { g.heal(60); g.removeItem("hp-kit", 1); g.notify("P3K dipakai (+60 HP)"); }
    else if (item.kind === "food") { const f = FOOD[item.id]; if (f) { g.heal(f.heal); g.setStamina(g.player.stamina + f.stamina); } g.removeItem(item.id, 1); g.notify(`Makan ${item.name}`); }
  };
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "auto", zIndex: 250 }}
      onPointerDown={(e) => { if (e.target === e.currentTarget) useGame.getState().toggleInventory(false); }}>
      <div style={{ width: "min(440px, 92vw)", maxHeight: "80vh", overflowY: "auto", background: "rgba(22,26,34,0.97)", borderRadius: 14, padding: 18, border: BORDER }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>🎒 Inventaris</div>
          <button data-ui="1" onPointerDown={() => useGame.getState().toggleInventory(false)} style={{ background: "#c0392b", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 700 }}>Tutup ✕</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {items.map((it) => {
            const actionable = it.kind === "weapon" || it.kind === "food" || it.id === "hp-kit";
            const label = it.kind === "weapon" ? (equipped === "pistol" ? "Lepas" : "Pasang") : it.id === "hp-kit" ? "Pakai" : it.kind === "food" ? "Makan" : null;
            return (
              <div key={it.id} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 26 }}>{it.icon}</span>
                  <div style={{ lineHeight: 1.2 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{it.name}</div>
                    <div style={{ fontSize: 12, opacity: 0.65 }}>x{it.qty}{it.id === "pistol" && equipped === "pistol" ? " · terpasang" : ""}</div>
                  </div>
                </div>
                {actionable && label && <button data-ui="1" onPointerDown={() => use(it)} style={{ background: "#2e7d32", color: "#fff", border: "none", borderRadius: 8, padding: "6px 0", fontWeight: 700, fontSize: 13 }}>{label}</button>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- mobile controls ---------------------------- */

function MobileControls() {
  const equipped = useGame((s) => s.equipped);
  // All buttons sit in ONE low horizontal row at fixed right-offsets. Nothing
  // stacks upward (so it never collides with the minimap) and toggling the pistol
  // never reflows the others (the "Isi" slot is reserved).
  return (
    <>
      <LookPad />
      <Joystick />
      {/* primary attack (corner) */}
      <div style={{ position: "absolute", right: c(SR, 16), bottom: c(SB, 18), pointerEvents: "auto", zIndex: 50 }}>
        {equipped === "pistol"
          ? <ActBtn action="fire" label="Tembak" color="rgba(229,57,53,0.92)" big />
          : <ActBtn action="punch" label="Pukul" color="rgba(211,47,47,0.92)" big />}
      </div>
      {/* reload (reserved slot, pistol only) */}
      {equipped === "pistol" && (
        <div style={{ position: "absolute", right: c(SR, 102), bottom: c(SB, 28), pointerEvents: "auto", zIndex: 50 }}>
          <ActBtn action="reload" label="Isi" color="rgba(93,64,55,0.9)" small />
        </div>
      )}
      {/* jump */}
      <div style={{ position: "absolute", right: c(SR, 162), bottom: c(SB, 28), pointerEvents: "auto", zIndex: 50 }}>
        <ActBtn action="jump" label="Lompat" color="rgba(21,101,192,0.9)" small />
      </div>
      {/* action */}
      <div style={{ position: "absolute", right: c(SR, 222), bottom: c(SB, 28), pointerEvents: "auto", zIndex: 50 }}>
        <ActBtn action="interact" label="Aksi" color="rgba(46,125,50,0.9)" small />
      </div>
    </>
  );
}

function LookPad() {
  const last = useRef<{ x: number; y: number } | null>(null);
  return (
    <div data-ui="1"
      onPointerDown={(e) => { if (e.pointerType !== "touch") return; e.currentTarget.setPointerCapture(e.pointerId); last.current = { x: e.clientX, y: e.clientY }; }}
      onPointerMove={(e) => { if (!last.current) return; input.addLook(e.clientX - last.current.x, e.clientY - last.current.y); last.current = { x: e.clientX, y: e.clientY }; }}
      onPointerUp={() => { last.current = null; }}
      onPointerCancel={() => { last.current = null; }}
      style={{ position: "absolute", right: 0, top: "14%", width: "48%", height: "56%", pointerEvents: "auto", touchAction: "none" }}
    />
  );
}

function ActBtn({ action, label, color, big, small }: { action: Action; label: string; color: string; big?: boolean; small?: boolean }) {
  const size = big ? 78 : small ? 54 : 62;
  return (
    <button data-ui="1" onPointerDown={(e) => { e.preventDefault(); input.press(action); }}
      style={{ width: size, height: size, borderRadius: "50%", border: big ? "3px solid rgba(255,255,255,0.35)" : BORDER, background: color, color: "#fff", fontSize: big ? 14 : 11, fontWeight: 800, opacity: 0.95, touchAction: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
      {label}
    </button>
  );
}

function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const active = useRef(false);
  const R = 48;
  const move = (e: React.PointerEvent) => {
    if (!active.current || !base.current) return;
    const rect = base.current.getBoundingClientRect();
    let dx = e.clientX - (rect.left + rect.width / 2);
    let dy = e.clientY - (rect.top + rect.height / 2);
    const len = Math.hypot(dx, dy) || 1;
    if (len > R) { dx = (dx / len) * R; dy = (dy / len) * R; }
    setKnob({ x: dx, y: dy });
    input.setStick(dx / R, -dy / R);
  };
  const end = () => { active.current = false; setKnob({ x: 0, y: 0 }); input.setStick(0, 0); };
  return (
    <div ref={base} data-ui="1"
      onPointerDown={(e) => { e.preventDefault(); active.current = true; move(e); }}
      onPointerMove={move} onPointerUp={end} onPointerLeave={end} onPointerCancel={end}
      style={{ position: "absolute", left: c(SL, 42), bottom: c(SB, 40), width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.10)", border: "2px solid rgba(255,255,255,0.22)", pointerEvents: "auto", touchAction: "none", zIndex: 50 }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 52, height: 52, marginLeft: -26, marginTop: -26, borderRadius: "50%", background: "rgba(255,255,255,0.55)", transform: `translate(${knob.x}px, ${knob.y}px)`, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }} />
    </div>
  );
}
