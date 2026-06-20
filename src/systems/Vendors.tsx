"use client";

import { Asset } from "@/core/assetRegistry";
import { VENDOR_PLACEMENTS, VENDORS } from "@/data/vendors";

/** Static street-vendor carts. Interaction/economy handled by InteractionSystem. */
export default function Vendors() {
  return (
    <>
      {VENDOR_PLACEMENTS.map((p, i) => {
        const v = VENDORS.find((x) => x.id === p.vendorId);
        if (!v) return null;
        return <Asset key={i} id={v.assetId} position={p.pos} />;
      })}
    </>
  );
}
