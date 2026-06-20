"use client";

import { Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { Physics } from "@react-three/rapier";

import World from "@/world/World";
import Player from "@/player/Player";
import { registerPlaceholders } from "@/world/placeholders";
import { useGame } from "@/core/store";
import { loadGame, startAutosave, stopAutosave } from "@/core/save";

import TimeWeather from "@/systems/TimeWeather";
import NPCSystem from "@/systems/NPCSystem";
import TrafficSystem from "@/systems/TrafficSystem";
import PlayerVehicles from "@/systems/PlayerVehicles";
import Vendors from "@/systems/Vendors";
import CombatSystem from "@/systems/CombatSystem";
import QuestSystem from "@/systems/QuestSystem";
import InteractionSystem from "@/systems/InteractionSystem";
import HUD from "./HUD";

registerPlaceholders();

export default function Game() {
  useEffect(() => {
    registerPlaceholders();
    loadGame(); // restore save if present
    startAutosave();
    useGame.getState().setBooted(true);
    return () => stopAutosave();
  }, []);

  return (
    <>
      <Canvas
        shadows
        dpr={[1, 1.5]} // capped for mobile; AdaptiveDpr drops further under load
        camera={{ position: [30, 12, 30], fov: 55, near: 0.5, far: 900 }}
        gl={{ powerPreference: "high-performance", antialias: false }}
      >
        <AdaptiveDpr pixelated />

        <Suspense fallback={null}>
          <TimeWeather />
          <Physics timeStep="vary">
            <World />
            <Player />
            <PlayerVehicles />
            <CombatSystem />
          </Physics>

          {/* Non-physics agents (kinematic, mobile-friendly) */}
          <NPCSystem />
          <TrafficSystem />
          <Vendors />

          {/* Logic-only systems */}
          <QuestSystem />
          <InteractionSystem />

          <Preload all />
        </Suspense>
      </Canvas>
      <HUD />
    </>
  );
}
