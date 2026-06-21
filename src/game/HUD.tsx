"use client";

import { useEffect, useRef, useState } from "react";
import { useGame, type InvItem } from "@/core/store";
import { input, type Action } from "@/core/input";
import { QUESTS, expForLevel } from "@/core/store";
import { VENDORS } from "@/data/vendors";
import { avatar } from "@/player/avatarState";
import { combat } from "@/systems/combatState";
import { view } from "@/core/view";
import Minimap from "./Minimap";

const FOOD = Object.fromEntries(VENDORS.map((v) => [v.food.id, v.food]));

// Safe-area helpers (notch / home indicator) — works on all devices.
const ST = "env(safe-area-inset-top, 0px)";
const SL = "env(safe-area-inset-left, 0px)";
const SR = "env(safe-area-inset-right, 0px)";
const SB = "env(safe-area-inset-bottom, 0px)";
const c = (inset: string, px: number) => `calc(${inset} + ${px}px)`;

const CARD = "rgba(14,17,23,0.52)";
const BORDER = "1px solid rgba(255,255,255,0.10)";

export default function HUD() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mapOn, setMapOn] = useState(true);
  const [clockOn, setClockOn] = useState(true);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", color: "#fff", fontFamily: "system-ui, sans-serif", textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>
      <Stats />
      <TitleBar />
      <TopRight menuOpen={menuOpen} setMenuOpen={setMenuOpen} mapOn={mapOn} setMapOn={setMapOn} clockOn={clockOn} setClockOn={setClockOn} />
      {mapOn && <div style={{ position: "absolute", top: c(ST, 56), right: c(SR, 12) }}><Minimap /></div>}
      {clockOn && <Clock mapOn={mapOn} />}
      <QuestTracker />
      <Prompt />
      <Toast />
      <WeaponHUD />
      <Crosshair />
      <DamageVignette />
      <ComboCounter />
      <MobileControls />
      <InventoryPanel />
      <DeathScreen />
    </div>
  );
}

/* ------------------------------- top bars ------------------------------- */

function TitleBar() {
  return (
    <div style={{ position: "absolute", top: c(ST, 12), left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
      <div style={{ display: "inline-block", background: CARD, border: BORDER, borderRadius: 999, padding: "4px 16px", fontSize: 13, fontWeight: 800, letterSpacing: "0.18em" }}>
        <span style={{ color: "#ffd24a" }}>LOKA</span>
        <span style={{ opacity: 0.6, fontWeight: 600 }}> · JAKARTA</span>
      </div>
    </div>
  );
}

function Stats() {
  const p = useGame((s) => s.player);
  return (
    <div style={{ position: "absolute", top: c(ST, 10), left: c(SL, 12), fontSize: 12, background: CARD, backdropFilter: "blur(8px)", padding: "9px 11px", borderRadius: 12, border: BORDER, minWidth: 150 }}>
      <Bar label="❤️" value={p.health} max={p.maxHealth} color="#ff5b54" />
      <Bar label="⚡" value={p.stamina} max={p.maxStamina} color="#ffc23d" />
      <div style={{ marginTop: 7, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontWeight: 800, color: "#ffe082" }}>Rp {p.money.toLocaleString("id-ID")}</span>
        <span style={{ fontSize: 11, opacity: 0.8 }}>Lv {p.level}</span>
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

const TIME_LABEL: Record<string, string> = { morning: "Pagi", afternoon: "Siang", sunset: "Senja", night: "Malam" };
const WEATHER_LABEL: Record<string, string> = { clear: "Cerah", cloudy: "Berawan", rain: "Hujan" };

function Clock({ mapOn }: { mapOn: boolean }) {
  const clock = useGame((s) => s.clock);
  const tod = useGame((s) => s.timeOfDay);
  const weather = useGame((s) => s.weather);
  const hh = Math.floor(clock).toString().padStart(2, "0");
  const mm = Math.floor((clock % 1) * 60).toString().padStart(2, "0");
  return (
    <div style={{ position: "absolute", top: mapOn ? c(ST, 188) : c(ST, 56), right: c(SR, 12), textAlign: "center", fontSize: 12, background: CARD, border: BORDER, borderRadius: 10, padding: "5px 10px" }}>
      <div style={{ fontSize: 16, fontWeight: 800 }}>{hh}:{mm}</div>
      <div style={{ opacity: 0.85, fontSize: 11 }}>{TIME_LABEL[tod]} · {WEATHER_LABEL[weather]}</div>
    </div>
  );
}

/* ---------------------------- hamburger menu ---------------------------- */

function TopRight(props: {
  menuOpen: boolean; setMenuOpen: (b: boolean) => void;
  mapOn: boolean; setMapOn: (b: boolean) => void;
  clockOn: boolean; setClockOn: (b: boolean) => void;
}) {
  const { menuOpen, setMenuOpen, mapOn, setMapOn, clockOn, setClockOn } = props;
  const [, force] = useState(0);
  const Item = ({ label, on, onClick }: { label: string; on?: boolean; onClick: () => void }) => (
    <button data-ui="1" onPointerDown={(e) => { e.preventDefault(); onClick(); }}
      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", background: "rgba(255,255,255,0.06)", color: "#fff", border: "none", borderRadius: 9, padding: "9px 12px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
      <span>{label}</span>
      {on !== undefined && <span style={{ fontSize: 11, fontWeight: 800, color: on ? "#5fd36a" : "#888" }}>{on ? "ON" : "OFF"}</span>}
    </button>
  );
  return (
    <>
      <button data-ui="1" onPointerDown={(e) => { e.preventDefault(); setMenuOpen(!menuOpen); }}
        style={{ position: "absolute", top: c(ST, 10), right: c(SR, 12), width: 40, height: 40, borderRadius: 11, border: BORDER, background: CARD, backdropFilter: "blur(8px)", color: "#fff", fontSize: 18, pointerEvents: "auto", touchAction: "none" }}>
        {menuOpen ? "✕" : "☰"}
      </button>
      {menuOpen && (
        <div style={{ position: "absolute", top: c(ST, 58), right: c(SR, 12), width: 210, background: "rgba(18,22,30,0.95)", border: BORDER, borderRadius: 14, padding: 10, pointerEvents: "auto", display: "flex", flexDirection: "column", gap: 7, boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
          <div style={{ fontSize: 11, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.1em", padding: "2px 4px" }}>Menu</div>
          <Item label="🗺️ Peta" on={mapOn} onClick={() => setMapOn(!mapOn)} />
          <Item label="🕐 Jam & Cuaca" on={clockOn} onClick={() => setClockOn(!clockOn)} />
          <Item label={`🎥 Kamera: ${view.mode.toUpperCase()}`} onClick={() => { view.mode = view.mode === "tps" ? "fps" : "tps"; force((n) => n + 1); }} />
          <Item label="🔫 Ganti Senjata" onClick={() => useGame.getState().setEquipped(useGame.getState().equipped === "pistol" ? "fists" : "pistol")} />
          <Item label="🎒 Inventaris" onClick={() => useGame.getState().toggleInventory(true)} />
          <Item label="💫 Respawn" onClick={() => { useGame.getState().respawn(); setMenuOpen(false); }} />
          <div style={{ fontSize: 10.5, opacity: 0.5, padding: "4px 4px 2px", lineHeight: 1.5 }}>
            Gerak: joystick · Lihat: geser kanan · E: interaksi
          </div>
        </div>
      )}
    </>
  );
}

/* ----------------------------- death screen ----------------------------- */

function DeathScreen() {
  const health = useGame((s) => s.player.health);
  if (health > 0) return null;
  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(40,0,0,0.55)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "auto", gap: 18 }}>
      <div style={{ fontSize: 32, fontWeight: 900, color: "#ff6a6a", textShadow: "0 2px 12px #000" }}>Kamu Pingsan 💀</div>
      <button data-ui="1" onPointerDown={(e) => { e.preventDefault(); useGame.getState().respawn(); }}
        style={{ background: "linear-gradient(135deg,#27ae60,#2ecc71)", color: "#fff", border: "none", borderRadius: 12, padding: "14px 40px", fontSize: 17, fontWeight: 800, letterSpacing: "0.05em", cursor: "pointer", boxShadow: "0 6px 20px rgba(0,0,0,0.4)" }}>
        💫 Respawn
      </button>
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
    <div style={{ position: "absolute", top: "30%", left: "50%", transform: `translate(-50%,-50%) scale(${scale})`, opacity: s.op, pointerEvents: "none", textAlign: "center" }}>
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

function WeaponHUD() {
  const equipped = useGame((s) => s.equipped);
  const ammo = useGame((s) => s.ammo);
  return (
    <div style={{ position: "absolute", bottom: c(SB, 12), left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 8, background: CARD, backdropFilter: "blur(6px)", padding: "5px 14px", borderRadius: 16, fontSize: 14, border: BORDER }}>
      {equipped === "pistol"
        ? <><span style={{ fontSize: 16 }}>🔫</span><b style={{ color: ammo > 0 ? "#fff" : "#ff6a6a" }}>{ammo}</b><span style={{ opacity: 0.5, fontSize: 12 }}>/ ∞</span></>
        : <><span style={{ fontSize: 16 }}>👊</span><span style={{ fontSize: 12, opacity: 0.8 }}>Tangan kosong</span></>}
    </div>
  );
}

/* ------------------------------ quest/prompt ----------------------------- */

function QuestTracker() {
  const quests = useGame((s) => s.quests);
  const activeId = useGame((s) => s.activeQuestId);
  const aq = activeId ? quests[activeId] : null;
  if (!aq) return null;
  const def = QUESTS.find((q) => q.id === aq.id);
  if (!def) return null;
  const obj = def.objectives[aq.step];
  const have = obj ? aq.counters[obj.id] ?? 0 : 0;
  const need = obj?.count ?? 1;
  return (
    <div style={{ position: "absolute", left: c(SL, 12), bottom: c(SB, 150), maxWidth: 240, background: CARD, backdropFilter: "blur(6px)", padding: "8px 11px", borderRadius: 10, border: BORDER }}>
      <div style={{ fontSize: 10, opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.08em" }}>{def.type}</div>
      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{def.title}</div>
      {aq.done ? <div style={{ color: "#8f8", fontSize: 13 }}>✓ Selesai</div>
        : obj ? <div style={{ marginTop: 2, fontSize: 12.5, opacity: 0.95 }}>◦ {obj.label} {need > 1 ? `(${have}/${need})` : ""}</div> : null}
    </div>
  );
}

function Prompt() {
  const interact = useGame((s) => s.interact);
  if (!interact) return null;
  return (
    <div style={{ position: "absolute", bottom: c(SB, 96), left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.62)", border: BORDER, padding: "8px 16px", borderRadius: 10, fontSize: 14, fontWeight: 600 }}>
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
    <div style={{ position: "absolute", top: c(ST, 58), left: "50%", transform: "translateX(-50%)", background: "rgba(20,20,30,0.88)", border: BORDER, padding: "8px 16px", borderRadius: 20, fontSize: 13.5, maxWidth: "70%", textAlign: "center" }}>
      {shown}
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
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "auto" }}
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
  return (
    <>
      <LookPad />
      <Joystick />

      {/* Primary actions (bottom-right, safe-inset) */}
      <div style={{ position: "absolute", right: c(SR, 26), bottom: c(SB, 40), display: "flex", flexDirection: "column", alignItems: "center", gap: 12, pointerEvents: "auto" }}>
        <ActBtn action="jump" label="Lompat" color="rgba(21,101,192,0.88)" small />
        {equipped === "pistol"
          ? <ActBtn action="fire" label="Tembak" color="rgba(229,57,53,0.92)" big />
          : <ActBtn action="punch" label="Pukul" color="rgba(211,47,47,0.92)" big />}
      </div>

      {/* Context actions (just left of primary) */}
      <div style={{ position: "absolute", right: c(SR, 116), bottom: c(SB, 40), display: "flex", flexDirection: "column", gap: 10, pointerEvents: "auto" }}>
        <ActBtn action="interact" label="Aksi" color="rgba(46,125,50,0.9)" small />
        {equipped === "pistol" && <ActBtn action="reload" label="Isi" color="rgba(93,64,55,0.9)" small />}
      </div>
    </>
  );
}

function LookPad() {
  const last = useRef<{ x: number; y: number } | null>(null);
  return (
    <div
      data-ui="1"
      onPointerDown={(e) => { if (e.pointerType !== "touch") return; e.currentTarget.setPointerCapture(e.pointerId); last.current = { x: e.clientX, y: e.clientY }; }}
      onPointerMove={(e) => { if (!last.current) return; input.addLook(e.clientX - last.current.x, e.clientY - last.current.y); last.current = { x: e.clientX, y: e.clientY }; }}
      onPointerUp={() => { last.current = null; }}
      onPointerCancel={() => { last.current = null; }}
      style={{ position: "absolute", right: 0, top: "12%", width: "50%", height: "60%", pointerEvents: "auto", touchAction: "none" }}
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
      style={{ position: "absolute", left: c(SL, 42), bottom: c(SB, 44), width: 120, height: 120, borderRadius: "50%", background: "rgba(255,255,255,0.10)", border: "2px solid rgba(255,255,255,0.22)", pointerEvents: "auto", touchAction: "none" }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 52, height: 52, marginLeft: -26, marginTop: -26, borderRadius: "50%", background: "rgba(255,255,255,0.55)", transform: `translate(${knob.x}px, ${knob.y}px)`, boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }} />
    </div>
  );
}
