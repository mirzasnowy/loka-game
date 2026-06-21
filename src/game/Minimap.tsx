"use client";

import { useEffect, useRef } from "react";
import { useGame } from "@/core/store";
import { DISTRICTS, WORLD } from "@/world/worldConfig";
import { VENDOR_PLACEMENTS } from "@/data/vendors";
import { drivables, enemies } from "@/systems/registries";
import { QUESTS } from "@/data/quests";

/**
 * Canvas minimap. North-up, player-centred, showing POIs, vendors, vehicles,
 * enemies and the active quest marker. Plain 2D canvas = effectively free vs.
 * a second 3D render.
 */
const SIZE = 108;
const RANGE = 160; // world units shown across the map radius

export default function Minimap() {
  const canvas = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    let raf = 0;
    const ctx = canvas.current.getContext("2d")!;
    const r = SIZE / 2;

    const w2m = (wx: number, wz: number, px: number, pz: number) => [
      r + ((wx - px) / RANGE) * r,
      r + ((wz - pz) / RANGE) * r,
    ];

    const draw = () => {
      const st = useGame.getState();
      const [px, , pz] = st.runtime.pos;

      ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.fillStyle = "#1d2a1d";
      ctx.beginPath();
      ctx.arc(r, r, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.save();
      ctx.beginPath();
      ctx.arc(r, r, r, 0, Math.PI * 2);
      ctx.clip();

      // sea band (north)
      const [, seaY] = w2m(0, WORLD.seaLine, px, pz);
      ctx.fillStyle = "#2c5670";
      ctx.fillRect(0, 0, SIZE, seaY);

      const dot = (wx: number, wz: number, color: string, size = 2) => {
        const [mx, my] = w2m(wx, wz, px, pz);
        if (mx < -5 || mx > SIZE + 5 || my < -5 || my > SIZE + 5) return;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(mx, my, size, 0, Math.PI * 2);
        ctx.fill();
      };

      DISTRICTS.forEach((d) => dot(d.pos[0], d.pos[1], "#cfd6dd", 3));
      VENDOR_PLACEMENTS.forEach((v) => dot(v.pos[0], v.pos[2], "#ffb300", 2));
      drivables.forEach((e) => {
        const t = e.body.translation();
        dot(t.x, t.z, "#42a5f5", 2);
      });
      enemies.forEach((en) => {
        if (!en.dead) dot(en.pos[0], en.pos[2], "#e53935", 2.5);
      });

      // active quest marker
      const aq = st.activeQuestId && st.quests[st.activeQuestId];
      if (aq && !aq.done) {
        const def = QUESTS.find((x) => x.id === aq.id);
        const obj = def?.objectives[aq.step];
        if (obj?.pos) dot(obj.pos[0], obj.pos[2], "#7c4dff", 3.5);
      }

      ctx.restore();

      // player arrow (center)
      ctx.save();
      ctx.translate(r, r);
      ctx.rotate(st.runtime.facing);
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(0, -5);
      ctx.lineTo(4, 5);
      ctx.lineTo(-4, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.arc(r, r, r - 1, 0, Math.PI * 2);
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <canvas
      ref={canvas}
      width={SIZE}
      height={SIZE}
      style={{ width: SIZE, height: SIZE, borderRadius: "50%", boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
    />
  );
}
