"use client";

import { Asset } from "@/core/assetRegistry";
import { VENDOR_PLACEMENTS, VENDORS } from "@/data/vendors";
import { nearestLine } from "@/world/grid";

/**
 * Street-vendor carts + the penjual standing behind each one (facing the road).
 * Interaction/economy handled by InteractionSystem.
 */
export default function Vendors() {
  return (
    <>
      {VENDOR_PLACEMENTS.map((p, i) => {
        const v = VENDORS.find((x) => x.id === p.vendorId);
        if (!v) return null;
        const [x, , z] = p.pos;
        // Which axis is the road on? Put the seller on the building side, facing it.
        const onX = Math.abs(x - nearestLine(x)) < Math.abs(z - nearestLine(z));
        const roadX = onX ? nearestLine(x) : x;
        const roadZ = onX ? z : nearestLine(z);
        // seller stands ~1.1m on the far side of the cart from the road
        const dirX = onX ? Math.sign(x - roadX) : 0;
        const dirZ = onX ? 0 : Math.sign(z - roadZ);
        const sx = x + dirX * 1.1;
        const sz = z + dirZ * 1.1;
        const yaw = onX ? (dirX > 0 ? Math.PI / 2 : -Math.PI / 2) : (dirZ > 0 ? 0 : Math.PI);
        return (
          <group key={i}>
            <Asset id={v.assetId} position={p.pos} rotation={[0, yaw + Math.PI, 0]} />
            <Asset id={v.sellerId} position={[sx, 0, sz]} rotation={[0, yaw + Math.PI, 0]} />
          </group>
        );
      })}
    </>
  );
}
