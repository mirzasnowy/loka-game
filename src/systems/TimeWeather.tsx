"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import {
  DirectionalLight,
  AmbientLight,
  Color,
  Points,
  BufferGeometry,
  Float32BufferAttribute,
  FogExp2,
  Vector3,
} from "three";
import { useThree } from "@react-three/fiber";
import { useGame, deriveTimeOfDay, type Weather } from "@/core/store";

/**
 * Drives the whole day/night + weather look from the store clock. Owns the sun,
 * ambient, fog and rain so a single system controls atmosphere — other systems
 * just read `timeOfDay` / `weather` from the store.
 */

const RAIN_COUNT = 1200;
const RAIN_AREA = 120;

// Palette keyed by hour buckets; lerped between for smooth transitions.
const SKY_DAY = new Color("#bcd6e6");
const SKY_SUNSET = new Color("#e7a86b");
const SKY_NIGHT = new Color("#10131f");
const SUN_DAY = new Color("#fff4e0");
const SUN_SUNSET = new Color("#ff9d4d");
const SUN_NIGHT = new Color("#34406a");

function sunColorFor(h: number, out: Color) {
  if (h >= 6 && h < 16) return out.copy(SUN_DAY);
  if (h >= 16 && h < 19) return out.copy(SUN_DAY).lerp(SUN_SUNSET, (h - 16) / 3);
  if (h >= 19 && h < 21) return out.copy(SUN_SUNSET).lerp(SUN_NIGHT, (h - 19) / 2);
  if (h >= 5 && h < 6) return out.copy(SUN_NIGHT).lerp(SUN_DAY, h - 5);
  return out.copy(SUN_NIGHT);
}
function skyColorFor(h: number, out: Color) {
  if (h >= 7 && h < 16) return out.copy(SKY_DAY);
  if (h >= 16 && h < 19) return out.copy(SKY_DAY).lerp(SKY_SUNSET, (h - 16) / 3);
  if (h >= 19 && h < 21) return out.copy(SKY_SUNSET).lerp(SKY_NIGHT, (h - 19) / 2);
  if (h >= 5 && h < 7) return out.copy(SKY_NIGHT).lerp(SKY_DAY, (h - 5) / 2);
  return out.copy(SKY_NIGHT);
}

export default function TimeWeather() {
  const sun = useRef<DirectionalLight>(null!);
  const ambient = useRef<AmbientLight>(null!);
  const rain = useRef<Points>(null!);
  const { scene } = useThree();

  const setClock = useGame((s) => s.setClock);
  const setWeather = useGame((s) => s.setWeather);

  const weatherTimer = useRef(20 + Math.random() * 40);
  const tmpSky = useMemo(() => new Color(), []);
  const tmpSun = useMemo(() => new Color(), []);
  const sunVec = useMemo(() => new Vector3(), []);

  // Rain geometry: a falling column field re-centered on the player each frame.
  const rainGeo = useMemo(() => {
    const g = new BufferGeometry();
    const pos = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * RAIN_AREA;
      pos[i * 3 + 1] = Math.random() * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * RAIN_AREA;
    }
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((_, delta) => {
    const st = useGame.getState();
    if (st.paused) return;

    // Advance clock (timeScale game-seconds per real second).
    let h = st.clock + (delta * st.timeScale) / 3600;
    if (h >= 24) h -= 24;
    setClock(h);

    // Occasionally roll the weather.
    weatherTimer.current -= delta;
    if (weatherTimer.current <= 0) {
      weatherTimer.current = 30 + Math.random() * 60;
      const roll = Math.random();
      const next: Weather = roll < 0.55 ? "clear" : roll < 0.8 ? "cloudy" : "rain";
      setWeather(next);
    }
    const wet = st.weather === "rain";
    const cloudy = st.weather !== "clear";

    // Sun orbit: angle from clock (noon overhead, night below horizon).
    const t = (h - 6) / 12; // 0 at 6:00, 1 at 18:00
    const ang = t * Math.PI;
    sunVec.set(Math.cos(ang) * 120, Math.sin(ang) * 120, 40);
    const daylight = Math.max(0, Math.sin(ang));

    if (sun.current) {
      sun.current.position.copy(sunVec);
      sunColorFor(h, tmpSun);
      sun.current.color.copy(tmpSun);
      sun.current.intensity = (0.15 + daylight * 1.5) * (cloudy ? 0.6 : 1);
      sun.current.target.position.set(0, 0, 0);
      sun.current.target.updateMatrixWorld();
    }
    if (ambient.current) {
      ambient.current.intensity = 0.35 + daylight * 0.6;
    }

    // Sky + fog tint follow the clock.
    skyColorFor(h, tmpSky);
    if (cloudy) tmpSky.lerp(new Color("#9aa3ad"), 0.4);
    if (!(scene.background instanceof Color)) scene.background = tmpSky.clone();
    else (scene.background as Color).copy(tmpSky);
    if (!(scene.fog instanceof FogExp2)) scene.fog = new FogExp2(tmpSky.getHex(), 0.0016);
    else {
      (scene.fog as FogExp2).color.copy(tmpSky);
      (scene.fog as FogExp2).density = wet ? 0.0032 : cloudy ? 0.0022 : 0.0016;
    }

    // Rain: fall + recenter on player.
    if (rain.current) {
      rain.current.visible = wet;
      if (wet) {
        const [px, , pz] = st.runtime.pos;
        const arr = (rainGeo.getAttribute("position") as Float32BufferAttribute).array as Float32Array;
        for (let i = 0; i < RAIN_COUNT; i++) {
          arr[i * 3 + 1] -= delta * 40;
          if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = 50;
        }
        rainGeo.getAttribute("position").needsUpdate = true;
        rain.current.position.set(px, 0, pz);
      }
    }
  });

  return (
    <>
      <ambientLight ref={ambient} intensity={0.7} />
      <directionalLight
        ref={sun}
        position={[80, 120, 40]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-140}
        shadow-camera-right={140}
        shadow-camera-top={140}
        shadow-camera-bottom={-140}
        shadow-camera-far={400}
      />
      <Sky sunPosition={[100, 30, 100]} turbidity={8} rayleigh={2} />
      <points ref={rain} geometry={rainGeo} visible={false}>
        <pointsMaterial color="#afc6d6" size={0.18} transparent opacity={0.6} />
      </points>
    </>
  );
}
