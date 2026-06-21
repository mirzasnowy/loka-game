"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import {
  DirectionalLight, AmbientLight, HemisphereLight,
  Color, Points, BufferGeometry, Float32BufferAttribute,
  FogExp2, Vector3,
} from "three";
import { useGame, deriveTimeOfDay, type Weather } from "@/core/store";

const RAIN_COUNT = 1200;
const RAIN_AREA  = 120;

// Morning palette — warm, bright, no black world
const SKY_MORNING = new Color("#a8d4f0");
const SKY_DAY     = new Color("#78bce8");
const SKY_SUNSET  = new Color("#e8904a");
const SKY_NIGHT   = new Color("#0e1828");
const SUN_MORNING = new Color("#ffe0a0");
const SUN_DAY     = new Color("#fff8e8");
const SUN_SUNSET  = new Color("#ff8830");
const SUN_NIGHT   = new Color("#2840a0");
const GROUND_DAY  = new Color("#3a7028");
const GROUND_NIGHT= new Color("#0a1808");

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
      // Always keep at least 0.5 intensity so no black world
      sun.current.intensity = Math.max(0.5, (0.3 + daylight * 1.8) * (cloudy ? 0.65 : 1));
      sun.current.target.position.set(0, 0, 0);
      sun.current.target.updateMatrixWorld();
    }

    // Ambient — strong floor so shadows never go pitch black
    if (amb.current) {
      amb.current.intensity = Math.max(0.55, 0.55 + daylight * 0.7);
    }

    // Hemisphere — sky/ground tint for color fill
    if (hemi.current) {
      skyColor(h, tmpSky);
      hemi.current.color.copy(tmpSky);
      hemi.current.groundColor.copy(daylight > 0.1 ? GROUND_DAY : GROUND_NIGHT);
      hemi.current.intensity = Math.max(0.3, 0.3 + daylight * 0.5);
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
      {/* Strong ambient so nothing is ever pitch black */}
      <ambientLight ref={amb} intensity={0.8} color="#e8f0ff" />

      {/* Hemisphere fills sky/ground color into surfaces */}
      <hemisphereLight
        ref={hemi}
        args={["#a8d4f0", "#3a7028", 0.6]}
        position={[0, 1, 0]}
      />

      {/* Sun — primary directional */}
      <directionalLight
        ref={sun}
        position={[80, 120, 40]}
        intensity={1.8}
        color="#ffe0a0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-160}
        shadow-camera-right={160}
        shadow-camera-top={160}
        shadow-camera-bottom={-160}
        shadow-camera-far={500}
        shadow-bias={-0.0004}
      />

      {/* Sky dome */}
      <Sky sunPosition={[80, 30, 100]} turbidity={6} rayleigh={2} mieCoefficient={0.005} />

      {/* Rain */}
      <points ref={rain} geometry={rainGeo} visible={false}>
        <pointsMaterial color="#afc6d6" size={0.18} transparent opacity={0.6} />
      </points>
    </>
  );
}
