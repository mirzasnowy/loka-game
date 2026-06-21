"use client";

import { Asset } from "@/core/assetRegistry";
import { VENDOR_PLACEMENTS, VENDORS } from "@/data/vendors";
import { nearestLine } from "@/world/grid";

/**
 * Street-vendor carts + the penjual standing behind each one, both facing the
 * road (where the player approaches). Buying is handled by InteractionSystem.
 */
export default function Vendors() {
  return (
    <>
      {VENDOR_PLACEMENTS.map((p, i) => {
        const v = VENDORS.find((x) => x.id === p.vendorId);
        if (!v) return null;
        const [x, , z] = p.pos;
        // Unit vector from the cart toward the nearer road.
        const onX = Math.abs(x - nearestLine(x)) < Math.abs(z - nearestLine(z));
        const rdx = onX ? Math.sign(nearestLine(x) - x) || 1 : 0;
        const rdz = onX ? 0 : Math.sign(nearestLine(z) - z) || 1;
        const yaw = Math.atan2(rdx, rdz);           // face the road
        const sx = x - rdx * 1.15;                  // seller stands behind the cart
        const sz = z - rdz * 1.15;
        return (
          <group key={i}>
            <Asset id={v.assetId} position={[x, 0, z]} rotation={[0, yaw, 0]} />
            <Asset id={v.sellerId} position={[sx, 0, sz]} rotation={[0, yaw, 0]} />
          </group>
        );
      })}
    </>
  );
}
