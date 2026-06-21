"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  DirectionalLight, AmbientLight, HemisphereLight,
  Color, Points, BufferGeometry, Float32BufferAttribute,
  FogExp2, Vector3,
} from "three";
import { useGame, deriveTimeOfDay, type Weather } from "@/core/store";

const RAIN_COUNT = 1200;
const RAIN_AREA  = 120;

// Vivid Synty-style palette — bright, saturated, no dark world
const SKY_MORNING = new Color("#80c8f8");
const SKY_DAY     = new Color("#58b0f0");
const SKY_SUNSET  = new Color("#f0904a");
const SKY_NIGHT   = new Color("#162038");
const SUN_MORNING = new Color("#ffe880");
const SUN_DAY     = new Color("#fff4c0");
const SUN_SUNSET  = new Color("#ff7820");
const SUN_NIGHT   = new Color("#304898");
const GROUND_DAY  = new Color("#4a9030");
const GROUND_NIGHT= new Color("#1a3018");

function sunColor(h: number, out: Color) {
  if (h >= 6  && h < 9 ) return out.copy(SUN_MORNING);
  if (h >= 9  && h < 16) return out.copy(SUN_DAY);
  if (h >= 16 && h < 19) return out.copy(SUN_DAY).lerp(SUN_SUNSET, (h - 16) / 3);
  if (h >= 19 && h < 21) return out.copy(SUN_SUNSET).lerp(SUN_NIGHT, (h - 19) / 2);
  if (h >= 5  && h < 6 ) return out.copy(SUN_NIGHT).lerp(SUN_MORNING, h - 5);
  return out.copy(SUN_NIGHT);
}
function skyColor(h: number, out: Color) {
  if (h >= 6  && h < 9 ) return out.copy(SKY_MORNING);
  if (h >= 9  && h < 16) return out.copy(SKY_DAY);
  if (h >= 16 && h < 19) return out.copy(SKY_DAY).lerp(SKY_SUNSET, (h - 16) / 3);
  if (h >= 19 && h < 21) return out.copy(SKY_SUNSET).lerp(SKY_NIGHT, (h - 19) / 2);
  if (h >= 5  && h < 6 ) return out.copy(SKY_NIGHT).lerp(SKY_MORNING, h - 5);
  return out.copy(SKY_NIGHT);
}

export default function TimeWeather() {
  const sun    = useRef<DirectionalLight>(null!);
  const amb    = useRef<AmbientLight>(null!);
  const hemi   = useRef<HemisphereLight>(null!);
  const rain   = useRef<Points>(null!);
  const { scene } = useThree();

  const setClock   = useGame((s) => s.setClock);
  const setWeather = useGame((s) => s.setWeather);

  const weatherTimer = useRef(20 + Math.random() * 40);
  const tmpSky = useMemo(() => new Color(), []);
  const tmpSun = useMemo(() => new Color(), []);
  const sunVec = useMemo(() => new Vector3(), []);

  const rainGeo = useMemo(() => {
    const g = new BufferGeometry();
    const pos = new Float32Array(RAIN_COUNT * 3);
    for (let i = 0; i < RAIN_COUNT; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * RAIN_AREA;
      pos[i * 3 + 1] = Math.random() * 50;
      pos[i * 3 + 2] = (Math.random() - 0.5) * RAIN_AREA;
    }
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((_, delta) => {
    const st = useGame.getState();
    if (st.paused) return;

    // Advance clock
    let h = st.clock + (delta * st.timeScale) / 3600;
    if (h >= 24) h -= 24;
    setClock(h);

    // Weather roll
    weatherTimer.current -= delta;
    if (weatherTimer.current <= 0) {
      weatherTimer.current = 30 + Math.random() * 60;
      const roll = Math.random();
      const next: Weather = roll < 0.55 ? "clear" : roll < 0.8 ? "cloudy" : "rain";
      setWeather(next);
    }
    const wet    = st.weather === "rain";
    const cloudy = st.weather !== "clear";

    // Sun orbit
    const t = (h - 6) / 12;
    const ang = t * Math.PI;
    sunVec.set(Math.cos(ang) * 120, Math.sin(ang) * 120, 40);
    const daylight = Math.max(0, Math.sin(ang));

    if (sun.current) {
      sun.current.position.copy(sunVec);
      sunColor(h, tmpSun);
      sun.current.color.copy(tmpSun);
      sun.current.intensity = Math.max(0.6, (0.4 + daylight * 1.2) * (cloudy ? 0.7 : 1));
      sun.current.target.position.set(0, 0, 0);
      sun.current.target.updateMatrixWorld();
    }

    // Ambient — high floor so every face keeps its color even in shadow
    if (amb.current) {
      amb.current.intensity = Math.max(1.0, 1.0 + daylight * 0.6);
    }

    // Hemisphere — sky/ground tint for color fill
    if (hemi.current) {
      skyColor(h, tmpSky);
      hemi.current.color.copy(tmpSky);
      hemi.current.groundColor.copy(daylight > 0.1 ? GROUND_DAY : GROUND_NIGHT);
      hemi.current.intensity = Math.max(0.7, 0.7 + daylight * 0.5);
    }

    // Background / fog
    skyColor(h, tmpSky);
    if (cloudy) tmpSky.lerp(new Color("#9aa3ad"), 0.35);
    if (!(scene.background instanceof Color)) scene.background = tmpSky.clone();
    else (scene.background as Color).copy(tmpSky);
    if (!(scene.fog instanceof FogExp2)) scene.fog = new FogExp2(tmpSky.getHex(), 0.0014);
    else {
      (scene.fog as FogExp2).color.copy(tmpSky);
      (scene.fog as FogExp2).density = wet ? 0.0028 : cloudy ? 0.0020 : 0.0014;
    }

    // Rain
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
      {/* Very strong flat ambient — every face gets near-full albedo, never black */}
      <ambientLight ref={amb} intensity={1.5} color="#eaf4ff" />

      {/* Hemisphere: blue sky fill + green bounce light from the ground */}
      <hemisphereLight
        ref={hemi}
        args={["#bfe0f8", "#6abf4a", 1.1]}
        position={[0, 1, 0]}
      />

      {/* Sun — primary directional, warm, casts shadows */}
      <directionalLight
        ref={sun}
        position={[80, 120, 40]}
        intensity={1.5}
        color="#fff0c0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-160}
        shadow-camera-right={160}
        shadow-camera-top={160}
        shadow-camera-bottom={-160}
        shadow-camera-far={500}
        shadow-bias={-0.0004}
      />

      {/* Fill lights from the other sides so no face stays dark */}
      <directionalLight position={[-70, 50, -60]} intensity={0.7} color="#cfe2ff" />
      <directionalLight position={[0, 30, -90]} intensity={0.5} color="#dfe8ff" />

      {/* Rain */}
      <points ref={rain} geometry={rainGeo} visible={false}>
        <pointsMaterial color="#afc6d6" size={0.18} transparent opacity={0.6} />
      </points>
    </>
  );
}
