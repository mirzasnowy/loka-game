"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { Physics } from "@react-three/rapier";

import World from "@/world/World";
import Player from "@/player/Player";
import FPViewModel from "@/player/FPViewModel";
import { registerPlaceholders } from "@/world/placeholders";
import { useGame } from "@/core/store";
import { loadGame, startAutosave, stopAutosave } from "@/core/save";

import TimeWeather from "@/systems/TimeWeather";
import NPCSystem from "@/systems/NPCSystem";
import TrafficSystem from "@/systems/TrafficSystem";
import PlayerVehicles from "@/systems/PlayerVehicles";
import Vendors from "@/systems/Vendors";
import CombatSystem from "@/systems/CombatSystem";
import GunSystem from "@/systems/GunSystem";
import EffectsSystem from "@/systems/EffectsSystem";
import QuestSystem from "@/systems/QuestSystem";
import InteractionSystem from "@/systems/InteractionSystem";
import PostFX from "./PostFX";
import HUD from "./HUD";
import StartScreen from "./StartScreen";

registerPlaceholders();

export default function Game() {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;
    registerPlaceholders();
    loadGame();
    startAutosave();
    useGame.getState().setBooted(true);
    return () => stopAutosave();
  }, [started]);

  if (!started) return <StartScreen onStart={() => setStarted(true)} />;

  return (
    <>
      <Canvas
        shadows="soft"
        flat /* NoToneMapping — render colors at face value so nothing crushes to black */
        dpr={[1, 2]}
        camera={{ position: [30, 12, 30], fov: 55, near: 0.15, far: 900 }}
        gl={{ powerPreference: "high-performance", antialias: false, stencil: false, depth: true }}
      >
        {/* Bright sky background — guaranteed even before TimeWeather runs */}
        <color attach="background" args={["#7fc4f0"]} />
        <AdaptiveDpr pixelated />

        <Suspense fallback={null}>
          <TimeWeather />
          <Physics timeStep="vary">
            <World />
            <Player />
            <PlayerVehicles />
            <CombatSystem />
          </Physics>

          <NPCSystem />
          <TrafficSystem />
          <Vendors />
          <GunSystem />
          <EffectsSystem />
          <FPViewModel />
          <QuestSystem />
          <InteractionSystem />

          <Preload all />
          <PostFX />
        </Suspense>
      </Canvas>
      <HUD />
    </>
  );
}
