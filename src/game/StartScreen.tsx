"use client";
import { useEffect, useState } from "react";

export default function StartScreen({ onStart }: { onStart: () => void }) {
  const [visible, setVisible] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 150);
    const t2 = setTimeout(() => setShowMenu(true), 2100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, overflow: "hidden",
      background: "linear-gradient(180deg, #03080f 0%, #071428 30%, #0e1e10 65%, #060e06 100%)",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Atmospheric glow layers */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 80% 35% at 50% 82%, rgba(240,130,20,0.10) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 25% at 50% 78%, rgba(255,200,50,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />

      <StarField />
      <CityLine />
      <MonasSilhouette />

      {/* Ground gradient */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "22%", background: "linear-gradient(0deg, #040c04 0%, transparent 100%)", pointerEvents: "none" }} />

      {/* Main content */}
      <div style={{
        position: "relative", zIndex: 10, height: "100%",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        paddingBottom: "14%",
      }}>
        {/* Title block */}
        <div style={{
          textAlign: "center",
          transition: "opacity 1.5s ease, transform 1.5s cubic-bezier(.22,1,.36,1)",
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translateY(-28px)",
        }}>
          {/* Indonesian flag bar */}
          <div style={{ display: "flex", justifyContent: "center", gap: 5, marginBottom: 20 }}>
            <div style={{ width: 36, height: 4, background: "#cb2026", borderRadius: 2 }} />
            <div style={{ width: 36, height: 4, background: "#ffffff", borderRadius: 2, opacity: 0.9 }} />
          </div>

          {/* LOKA wordmark */}
          <div style={{
            fontSize: "clamp(84px, 18vw, 160px)",
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            background: "linear-gradient(180deg, #ffffff 0%, #f8e88a 42%, #d4a010 80%, #8a6008 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 2px 40px rgba(210,160,16,0.45))",
            userSelect: "none",
          }}>
            LOKA
          </div>

          <div style={{
            fontSize: "clamp(10px, 2vw, 15px)",
            letterSpacing: "0.5em",
            color: "#7090b0",
            textTransform: "uppercase",
            marginTop: 10,
            fontWeight: 400,
          }}>
            Open World Jakarta
          </div>
        </div>

        {/* Menu */}
        <div style={{
          marginTop: 44,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 14,
          transition: "opacity 0.9s ease, transform 0.9s ease",
          opacity: showMenu ? 1 : 0,
          transform: showMenu ? "none" : "translateY(20px)",
        }}>
          <StartBtn onClick={onStart} />

          <div style={{
            marginTop: 6, fontSize: 11,
            color: "#2a4a3a", letterSpacing: "0.12em",
            fontFamily: "monospace",
          }}>
            v0.1.0 · Low Poly · Jakarta
          </div>
        </div>
      </div>

      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.9; }
        }
        @keyframes monasFlame {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(210,170,20,0.6)); }
          50% { filter: drop-shadow(0 0 22px rgba(255,200,40,1)); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: none; }
        }
        .start-btn:hover { transform: scale(1.04) !important; box-shadow: 0 6px 32px rgba(210,160,20,0.6) !important; }
        .start-btn:active { transform: scale(0.97) !important; }
      `}</style>
    </div>
  );
}

function StartBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      className="start-btn"
      onClick={onClick}
      style={{
        background: "linear-gradient(135deg, #b08010 0%, #f5d050 45%, #c89010 100%)",
        color: "#0a0800",
        border: "none", borderRadius: 7,
        padding: "15px 56px",
        fontSize: "clamp(14px, 2.5vw, 17px)",
        fontWeight: 800,
        letterSpacing: "0.20em",
        textTransform: "uppercase",
        cursor: "pointer",
        boxShadow: "0 4px 24px rgba(200,150,10,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
        transition: "transform 0.12s, box-shadow 0.12s",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}
    >
      ▶&ensp;Mulai Bermain
    </button>
  );
}

function StarField() {
  // Deterministic star positions from index math
  const stars = Array.from({ length: 90 }, (_, i) => ({
    x: ((i * 137.508) % 100),
    y: ((i * 97.13) % 58),
    r: i % 5 === 0 ? 2.2 : i % 3 === 0 ? 1.6 : 1.1,
    dur: 2.2 + ((i * 0.41) % 3),
    delay: (i * 0.37) % 5,
  }));

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {stars.map((s, i) => (
        <div key={i} style={{
          position: "absolute",
          left: `${s.x}%`, top: `${s.y}%`,
          width: s.r, height: s.r,
          borderRadius: "50%",
          background: "#ffffff",
          animation: `twinkle ${s.dur}s ${s.delay}s ease-in-out infinite`,
        }} />
      ))}
    </div>
  );
}

function CityLine() {
  type BuildingSpec = { left?: number; right?: number; w: number; h: number };
  const buildings: BuildingSpec[] = [
    { left: 0, w: 55, h: 50 }, { left: 50, w: 38, h: 78 }, { left: 83, w: 48, h: 42 },
    { left: 126, w: 28, h: 62 }, { left: 150, w: 42, h: 38 }, { left: 188, w: 32, h: 88 },
    { left: 218, w: 24, h: 66 }, { left: 238, w: 50, h: 48 },
    { right: 0, w: 48, h: 58 }, { right: 44, w: 33, h: 82 }, { right: 73, w: 42, h: 50 },
    { right: 111, w: 28, h: 72 }, { right: 136, w: 52, h: 42 }, { right: 184, w: 38, h: 64 },
    { right: 220, w: 28, h: 48 }, { right: 245, w: 58, h: 52 },
  ];

  const windows = [
    { left: 60, b: 45 }, { left: 68, b: 58 }, { left: 76, b: 68 },
    { left: 196, b: 28 }, { left: 204, b: 42 }, { left: 212, b: 56 }, { left: 220, b: 70 },
    { right: 50, b: 38 }, { right: 58, b: 54 }, { right: 66, b: 70 },
    { right: 118, b: 32 }, { right: 126, b: 50 }, { right: 134, b: 64 },
  ];

  return (
    <div style={{ position: "absolute", bottom: "20%", left: 0, right: 0, pointerEvents: "none" }}>
      {buildings.map((b, i) => (
        <div key={i} style={{
          position: "absolute", bottom: 0,
          ...(b.left != null ? { left: b.left } : { right: b.right }),
          width: b.w, height: b.h,
          background: "#050d05",
        }} />
      ))}
      {/* Lit windows */}
      {windows.map((w, i) => (
        <div key={`w${i}`} style={{
          position: "absolute", bottom: w.b,
          ...(w.left != null ? { left: w.left } : { right: (w as any).right }),
          width: 4, height: 5,
          background: "#f8e060",
          boxShadow: "0 0 5px #f0c840",
          opacity: 0.75,
        }} />
      ))}
    </div>
  );
}

function MonasSilhouette() {
  return (
    <div style={{
      position: "absolute", bottom: "20%", left: "50%",
      transform: "translateX(-50%)",
      display: "flex", flexDirection: "column", alignItems: "center",
      animation: "monasFlame 3.5s ease-in-out infinite",
      pointerEvents: "none",
    }}>
      {/* Flame */}
      <div style={{
        width: 16, height: 22,
        background: "radial-gradient(ellipse at 50% 65%, #ffe060, #e08010)",
        clipPath: "polygon(50% 0%, 82% 55%, 68% 100%, 32% 100%, 18% 55%)",
        marginBottom: -2,
        boxShadow: "0 0 12px #f0c030",
      }} />
      {/* Shaft */}
      <div style={{
        width: 8, height: 88,
        background: "linear-gradient(180deg, #c8a830 0%, #8a7020 50%, #5a4c18 100%)",
        clipPath: "polygon(28% 0%, 72% 0%, 82% 100%, 18% 100%)",
      }} />
      {/* Base */}
      <div style={{
        width: 36, height: 9,
        background: "linear-gradient(180deg, #8a7820, #3a3210)",
        borderRadius: "0 0 3px 3px",
      }} />
    </div>
  );
}
