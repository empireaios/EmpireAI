/** R2-12 — Delivery Milestone Engine. */

import type { DeliveryMilestone, ShipmentTrackingRecord, TrackingStatus } from "./types.js";

export class DeliveryMilestoneEngine {
  advanceMilestone(record: ShipmentTrackingRecord, status: TrackingStatus): DeliveryMilestone {
    if (status === "delivered") return "delivered";
    if (status === "out_for_delivery") return "out_for_delivery";
    if (status === "in_transit" || status === "delayed") return "in_transit";
    if (status === "picked_up") return "picked_up";
    return record.deliveryMilestone;
  }

  isDelivered(status: TrackingStatus): boolean {
    return status === "delivered";
  }

  isFailed(status: TrackingStatus): boolean {
    return status === "failed" || status === "exception";
  }
}
