"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/core/store";
import { input, type Action } from "@/core/input";
import { QUESTS, expForLevel } from "@/core/store";
import Minimap from "./Minimap";

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
      <MobileControls />
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
    <div style={{ position: "absolute", top: 12, left: 12, fontSize: 13 }}>
      <div>❤️ HP <Bar value={p.health} max={p.maxHealth} color="#e53935" /></div>
      <div style={{ marginTop: 4 }}>⚡ Stamina <Bar value={p.stamina} max={p.maxStamina} color="#ffb300" /></div>
      <div style={{ marginTop: 6, fontWeight: 600 }}>Rp {p.money.toLocaleString("id-ID")}</div>
      <div style={{ marginTop: 2, fontSize: 12 }}>Lv {p.level} · EXP {p.exp}/{expForLevel(p.level)}</div>
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
  return (
    <>
      <LookPad />
      <Joystick />
      <div style={{ position: "absolute", right: 16, bottom: 24, display: "grid", gridTemplateColumns: "60px 60px", gap: 10, pointerEvents: "auto" }}>
        <ActBtn action="kick" label="Tendang" color="#8e24aa" />
        <ActBtn action="punch" label="Pukul" color="#d32f2f" />
        <HoldBlock />
        <ActBtn action="jump" label="Lompat" color="#1565c0" />
        <ActBtn action="dodge" label="Hindar" color="#00838f" />
        <ActBtn action="interact" label="Aksi (E)" color="#2e7d32" />
      </div>
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

function ActBtn({ action, label, color }: { action: Action; label: string; color: string }) {
  return (
    <button
      data-ui="1"
      onPointerDown={(e) => {
        e.preventDefault();
        input.press(action);
      }}
      style={{ width: 60, height: 60, borderRadius: "50%", border: "none", background: color, color: "#fff", fontSize: 11, fontWeight: 700, opacity: 0.85, touchAction: "none" }}
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
