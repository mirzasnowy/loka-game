"use client";

import dynamic from "next/dynamic";

// The whole game is client-only (WebGL). Skip SSR for the canvas.
const Game = dynamic(() => import("@/game/Game"), { ssr: false });

export default function Page() {
  return (
    <main>
      <Game />
    </main>
  );
}
