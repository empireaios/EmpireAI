/** R2-12 — Tracking fixtures (structural — no live HTTP). */

import type { TrackingStatus } from "./types.js";

export function buildTrackingNumber(carrierId: string, shipmentId: string): string {
  return `TRK-${carrierId.toUpperCase()}-${shipmentId.replace("sci-", "").slice(0, 12)}`;
}

export function getFixtureTrackingStatus(mode: "in_transit" | "delivered" | "delayed" | "failed"): {
  status: TrackingStatus;
  location: string | null;
  milestone: import("./types.js").DeliveryMilestone;
  delayStatus: import("./types.js").DelayStatus;
} {
  if (mode === "delivered") {
    return {
      status: "delivered",
      location: "Customer address",
      milestone: "delivered",
      delayStatus: "none",
    };
  }
  if (mode === "delayed") {
    return {
      status: "delayed",
      location: "Regional hub",
      milestone: "in_transit",
      delayStatus: "delayed",
    };
  }
  if (mode === "failed") {
    return {
      status: "failed",
      location: "Delivery facility",
      milestone: "out_for_delivery",
      delayStatus: "at_risk",
    };
  }
  return {
    status: "in_transit",
    location: "Distribution center",
    milestone: "in_transit",
    delayStatus: "none",
  };
}

export function estimateDeliveryDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split("T")[0]!;
}
