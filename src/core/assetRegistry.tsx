"use client";

import { Suspense, useMemo } from "react";
import type { ReactElement } from "react";
import { useGLTF } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";

type GroupProps = ThreeElements["group"];

/**
 * AssetRegistry — the single seam between "placeholder primitives now" and
 * "real GLB/animations later". Gameplay code NEVER imports a mesh or a file
 * name; it renders <Asset id="monas" />. Swapping to monas.glb is one
 * registry edit, zero gameplay edits.
 *
 *   registerAsset("monas", { placeholder: MonasBox, glb: "/assets/monas.glb" })
 *
 * If `glb` is set it loads; otherwise the placeholder draws. That's the whole
 * future-proofing contract.
 */
export type PlaceholderProps = GroupProps;
export type Placeholder = (props: PlaceholderProps) => ReactElement;

export interface AssetDef {
  placeholder: Placeholder;
  /** Optional real model. Drop a file + set this; gameplay code is untouched. */
  glb?: string;
}

const registry = new Map<string, AssetDef>();

export function registerAsset(id: string, def: AssetDef) {
  registry.set(id, def);
}
export function getAsset(id: string): AssetDef | undefined {
  return registry.get(id);
}

function GlbModel({ url, ...props }: { url: string } & GroupProps) {
  const { scene } = useGLTF(url);
  // Clone so the same GLB can be placed many times (buildings, NPCs, props).
  const clone = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={clone} {...props} />;
}

/** Render a registered asset by id. GLB if present, else placeholder. */
export function Asset({ id, ...props }: { id: string } & Omit<GroupProps, "id">) {
  const def = getAsset(id);
  if (!def) {
    // ponytail: fail loud in dev — a missing id is a content bug, not a crash.
    if (process.env.NODE_ENV !== "production") console.warn(`Asset "${id}" not registered`);
    return null;
  }
  if (def.glb) {
    return (
      <Suspense fallback={<def.placeholder {...props} />}>
        <GlbModel url={def.glb} {...props} />
      </Suspense>
    );
  }
  const P = def.placeholder;
  return <P {...props} />;
}
