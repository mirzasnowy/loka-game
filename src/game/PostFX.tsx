"use client";

import { EffectComposer, Bloom, Vignette, SMAA, BrightnessContrast, HueSaturation } from "@react-three/postprocessing";

/**
 * Cinematic post-processing: bloom makes lights/emissives glow, SMAA gives clean
 * edges (antialias is off on the renderer), a gentle vignette + contrast/saturation
 * punch up the image. Kept light enough for mobile.
 */
export default function PostFX() {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {/* threshold high so only real lights/emissives glow, not bright walls/sky */}
      <Bloom intensity={0.7} luminanceThreshold={0.85} luminanceSmoothing={0.2} mipmapBlur radius={0.75} />
      <BrightnessContrast brightness={0.0} contrast={0.07} />
      <HueSaturation saturation={0.12} hue={0} />
      <Vignette eskil={false} offset={0.22} darkness={0.42} />
      <SMAA />
    </EffectComposer>
  );
}
