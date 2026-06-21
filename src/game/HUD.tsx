"use client";

import { useEffect, useRef, useState } from "react";
import { useGame, type InvItem } from "@/core/store";
import { input, type Action } from "@/core/input";
import { QUESTS, expForLevel, MAG_CAP } from "@/core/store";
import { VENDORS } from "@/data/vendors";
import { avatar } from "@/player/avatarState";
import { combat } from "@/systems/combatState";
import Minimap from "./Minimap";

const FOOD = Object.fromEntries(VENDORS.map((v) => [v.food.id, v.food]));

/** Full DOM HUD overlay: stats, time, quest tracker, prompts, toasts, mobile controls. */
export default function HUD() {
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", color: "#fff", fontFamily: "system-ui, sans-serif", textShadow: "0 1px 2px #000" }}>
      <Stats />
      <Clock />
      <div style={{ position: "absolute", top: 12, right: 12 }}>
        <Minimap />
      </div>
      <QuestTracker />
      <Prompt />
      <Toast />
      <WeaponHUD />
      <Crosshair />
      <DamageVignette />
      <ComboCounter />
      <MobileControls />
      <InventoryPanel />
    </div>
  );
}

/** Big combo readout that pops on each landed hit and fades (polls combatState). */
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
      <div style={{ fontSize: 40, fontWeight: 900, color: "#ffd24a", textShadow: "0 2px 8px #000, 0 0 18px rgba(255,180,20,0.6)" }}>COMBO x{s.n}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", letterSpacing: "0.1em" }}>{s.move}!</div>
    </div>
  );
}

/** Red screen flash when the player takes damage (polls avatar.hurtAt, no store churn). */
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
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
      background: `radial-gradient(ellipse at center, transparent 45%, rgba(190,0,0,${op}) 100%)` }} />
  );
}

function Crosshair() {
  const equipped = useGame((s) => s.equipped);
  const hitTime = useGame((s) => s.hitMarkerTime ?? 0);
  const isHit = performance.now() - hitTime < 200;
  if (equipped !== "pistol") return null; // only when aiming
  return (
    <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 22, height: 22, pointerEvents: "none", zIndex: 10 }}>
      <div style={{ position: "absolute", top: "50%", left: 0, width: "100%", height: 2, marginTop: -1, background: isHit ? "#ff3333" : "rgba(255,255,255,0.8)" }} />
      <div style={{ position: "absolute", left: "50%", top: 0, height: "100%", width: 2, marginLeft: -1, background: isHit ? "#ff3333" : "rgba(255,255,255,0.8)" }} />
    </div>
  );
}

/* ------------------------------- weapon HUD ------------------------------- */

function WeaponHUD() {
  const equipped = useGame((s) => s.equipped);
  const ammo = useGame((s) => s.ammo);
  return (
    <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 8, background: "rgba(14,17,23,0.5)", backdropFilter: "blur(6px)", padding: "5px 14px", borderRadius: 18, fontSize: 14, border: "1px solid rgba(255,255,255,0.08)" }}>
      {equipped === "pistol" ? (
        <>
          <span style={{ fontSize: 17 }}>🔫</span>
          <b style={{ color: ammo > 0 ? "#fff" : "#ff6a6a" }}>{ammo}</b>
          <span style={{ opacity: 0.55, fontSize: 12 }}>/ ∞</span>
        </>
      ) : (
        <><span style={{ fontSize: 17 }}>👊</span><span style={{ fontSize: 12, opacity: 0.8 }}>Tangan kosong</span></>
      )}
    </div>
  );
}

/* ------------------------------- inventory ------------------------------- */

function InventoryPanel() {
  const open = useGame((s) => s.inventoryOpen);
  const items = useGame((s) => s.inventory);
  const equipped = useGame((s) => s.equipped);
  if (!open) return null;

  const use = (item: InvItem) => {
    const g = useGame.getState();
    if (item.kind === "weapon" && item.id === "pistol") {
      g.setEquipped(equipped === "pistol" ? "fists" : "pistol");
    } else if (item.id === "hp-kit") {
      g.heal(60); g.removeItem("hp-kit", 1); g.notify("P3K dipakai (+60 HP)");
    } else if (item.kind === "food") {
      const f = FOOD[item.id];
      if (f) { g.heal(f.heal); g.setStamina(g.player.stamina + f.stamina); }
      g.removeItem(item.id, 1); g.notify(`Makan ${item.name}`);
    }
  };

  return (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "auto" }}
      onPointerDown={(e) => { if (e.target === e.currentTarget) useGame.getState().toggleInventory(false); }}>
      <div style={{ width: "min(440px, 92vw)", maxHeight: "80vh", overflowY: "auto", background: "rgba(22,26,34,0.97)", borderRadius: 14, padding: 18, border: "1px solid rgba(255,255,255,0.12)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 800 }}>🎒 Inventaris</div>
          <button data-ui="1" onPointerDown={() => useGame.getState().toggleInventory(false)}
            style={{ background: "#c0392b", color: "#fff", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 700 }}>Tutup ✕</button>
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
                {actionable && label && (
                  <button data-ui="1" onPointerDown={() => use(it)}
                    style={{ background: "#2e7d32", color: "#fff", border: "none", borderRadius: 8, padding: "6px 0", fontWeight: 700, fontSize: 13 }}>{label}</button>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, fontSize: 11, opacity: 0.55, textAlign: "center" }}>Tombol: F tembak · R isi · Q ganti senjata · I / Tas buka tas</div>
      </div>
    </div>
  );
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div style={{ width: 130, height: 8, background: "rgba(0,0,0,0.5)", borderRadius: 4, overflow: "hidden", marginTop: 2 }}>
      <div style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%`, height: "100%", background: color }} />
    </div>
  );
}

function Stats() {
  const p = useGame((s) => s.player);
  return (
    <div style={{ position: "absolute", top: 12, left: 12, fontSize: 12.5, background: "rgba(14,17,23,0.5)", backdropFilter: "blur(6px)", padding: "10px 12px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", minWidth: 154 }}>
      <div>❤️ HP <Bar value={p.health} max={p.maxHealth} color="#e53935" /></div>
      <div style={{ marginTop: 5 }}>⚡ Stamina <Bar value={p.stamina} max={p.maxStamina} color="#ffb300" /></div>
      <div style={{ marginTop: 7, fontWeight: 700, color: "#ffe082" }}>Rp {p.money.toLocaleString("id-ID")}</div>
      <div style={{ marginTop: 2, fontSize: 11.5, opacity: 0.85 }}>Lv {p.level} · {p.exp}/{expForLevel(p.level)} EXP</div>
    </div>
  );
}

const TIME_LABEL: Record<string, string> = { morning: "Pagi", afternoon: "Siang", sunset: "Senja", night: "Malam" };
const WEATHER_LABEL: Record<string, string> = { clear: "Cerah", cloudy: "Berawan", rain: "Hujan" };

function Clock() {
  const clock = useGame((s) => s.clock);
  const tod = useGame((s) => s.timeOfDay);
  const weather = useGame((s) => s.weather);
  const hh = Math.floor(clock).toString().padStart(2, "0");
  const mm = Math.floor((clock % 1) * 60).toString().padStart(2, "0");
  return (
    <div style={{ position: "absolute", top: 170, right: 12, textAlign: "right", fontSize: 13 }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{hh}:{mm}</div>
      <div>{TIME_LABEL[tod]} · {WEATHER_LABEL[weather]}</div>
    </div>
  );
}

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
    <div style={{ position: "absolute", left: 12, bottom: 120, maxWidth: 260, background: "rgba(0,0,0,0.45)", padding: "8px 10px", borderRadius: 8, pointerEvents: "none" }}>
      <div style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase" }}>{def.type}</div>
      <div style={{ fontWeight: 700, fontSize: 14 }}>{def.title}</div>
      {aq.done ? (
        <div style={{ color: "#8f8" }}>✓ Selesai</div>
      ) : obj ? (
        <div style={{ marginTop: 2, fontSize: 13 }}>
          ◦ {obj.label} {need > 1 ? `(${have}/${need})` : ""}
        </div>
      ) : null}
    </div>
  );
}

function Prompt() {
  const interact = useGame((s) => s.interact);
  if (!interact) return null;
  return (
    <div style={{ position: "absolute", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", padding: "8px 14px", borderRadius: 8, fontSize: 14 }}>
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
    <div style={{ position: "absolute", top: 90, left: "50%", transform: "translateX(-50%)", background: "rgba(20,20,30,0.85)", padding: "8px 16px", borderRadius: 20, fontSize: 14, maxWidth: "80%", textAlign: "center" }}>
      {shown}
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

      {/* Main action cluster (bottom-right) — primary + jump/dodge/block */}
      <div style={{ position: "absolute", right: 20, bottom: 26, display: "grid", gridTemplateColumns: "58px 70px", gap: 12, pointerEvents: "auto", alignItems: "end", justifyItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <HoldBlock />
          <ActBtn action="dodge" label="Hindar" color="rgba(0,131,143,0.85)" small />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <ActBtn action="jump" label="Lompat" color="rgba(21,101,192,0.85)" small />
          {equipped === "pistol"
            ? <ActBtn action="fire" label="Tembak" color="rgba(229,57,53,0.92)" big />
            : <ActBtn action="punch" label="Pukul" color="rgba(211,47,47,0.92)" big />}
        </div>
      </div>

      {/* Secondary row (bottom-center) — small, out of the way of the minimap */}
      <div style={{ position: "absolute", left: "50%", bottom: 60, transform: "translateX(-50%)", display: "flex", gap: 8, pointerEvents: "auto" }}>
        <ActBtn action="interact" label="Aksi" color="rgba(46,125,50,0.85)" small />
        <ActBtn action="swap" label="Senjata" color="rgba(55,71,79,0.85)" small />
        <ActBtn action="view" label="👁" color="rgba(70,55,90,0.9)" small />
        {equipped === "pistol" && <ActBtn action="reload" label="Isi" color="rgba(93,64,55,0.85)" small />}
      </div>

      {/* Inventory button (left, below stats) */}
      <button data-ui="1" onPointerDown={(e) => { e.preventDefault(); input.press("inv"); }}
        style={{ position: "absolute", left: 16, top: 116, width: 50, height: 50, borderRadius: 14, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(20,24,32,0.6)", backdropFilter: "blur(6px)", color: "#fff", fontSize: 11, fontWeight: 700, pointerEvents: "auto", touchAction: "none" }}>
        🎒 Tas
      </button>
    </>
  );
}

/**
 * Touch look-pad: drag anywhere on the right side to orbit the camera up/down/
 * left/right. Mouse events fall through to the global drag-look so desktop is
 * unchanged. Uses pointer capture so a finger can pan smoothly without losing
 * track, and coexists with the movement joystick (separate pointer).
 */
function LookPad() {
  const last = useRef<{ x: number; y: number } | null>(null);
  return (
    <div
      data-ui="1"
      onPointerDown={(e) => {
        if (e.pointerType !== "touch") return; // desktop uses mouse drag
        e.currentTarget.setPointerCapture(e.pointerId);
        last.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (!last.current) return;
        input.addLook(e.clientX - last.current.x, e.clientY - last.current.y);
        last.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={() => { last.current = null; }}
      onPointerCancel={() => { last.current = null; }}
      style={{ position: "absolute", right: 0, top: 0, width: "55%", height: "68%", pointerEvents: "auto", touchAction: "none" }}
    />
  );
}

function ActBtn({ action, label, color, big, small }: { action: Action; label: string; color: string; big?: boolean; small?: boolean }) {
  const size = big ? 76 : small ? 48 : 60;
  return (
    <button
      data-ui="1"
      onPointerDown={(e) => {
        e.preventDefault();
        input.press(action);
      }}
      style={{ width: size, height: size, borderRadius: "50%", border: big ? "3px solid rgba(255,255,255,0.4)" : "none", background: color, color: "#fff", fontSize: big ? 13 : small ? 10 : 11, fontWeight: 700, opacity: 0.9, touchAction: "none" }}
    >
      {label}
    </button>
  );
}

function HoldBlock() {
  return (
    <button
      data-ui="1"
      onPointerDown={(e) => { e.preventDefault(); input.block = true; }}
      onPointerUp={() => { input.block = false; }}
      onPointerLeave={() => { input.block = false; }}
      style={{ width: 60, height: 60, borderRadius: "50%", border: "none", background: "#455a64", color: "#fff", fontSize: 11, fontWeight: 700, opacity: 0.85, touchAction: "none" }}
    >
      Tangkis
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
    input.setStick(dx / R, -dy / R); // up = forward
  };
  const end = () => { active.current = false; setKnob({ x: 0, y: 0 }); input.setStick(0, 0); };

  return (
    <div
      ref={base}
      data-ui="1"
      onPointerDown={(e) => { e.preventDefault(); active.current = true; move(e); }}
      onPointerMove={move}
      onPointerUp={end}
      onPointerLeave={end}
      style={{ position: "absolute", left: 24, bottom: 28, width: 110, height: 110, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.25)", pointerEvents: "auto", touchAction: "none" }}
    >
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 48, height: 48, marginLeft: -24, marginTop: -24, borderRadius: "50%", background: "rgba(255,255,255,0.5)", transform: `translate(${knob.x}px, ${knob.y}px)` }} />
    </div>
  );
}
