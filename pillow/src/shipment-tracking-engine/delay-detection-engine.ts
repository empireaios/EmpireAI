/** R2-12 — Delay Detection Engine. */

import type { DelayStatus, ShipmentTrackingRecord, TrackingStatus } from "./types.js";
import type { ShipmentTrackingEngineConfiguration } from "./configuration.js";

export class DelayDetectionEngine {
  detectDelay(input: {
    status: TrackingStatus;
    estimatedDeliveryDate: string | null;
    config: ShipmentTrackingEngineConfiguration;
  }): DelayStatus {
    if (!input.config.delayDetectionRulesEnabled) return "none";
    if (input.status === "delayed") return "delayed";
    if (input.status === "failed" || input.status === "exception") return "at_risk";

    if (input.estimatedDeliveryDate) {
      const eta = new Date(input.estimatedDeliveryDate).getTime();
      const threshold = input.config.delayThresholdDays * 86400000;
      if (Date.now() > eta + threshold) return "delayed";
      if (Date.now() > eta) return "at_risk";
    }

    return "none";
  }

  detectDelayChange(
    previous: ShipmentTrackingRecord | null,
    current: ShipmentTrackingRecord,
  ): boolean {
    return previous?.delayStatus !== current.delayStatus && current.delayStatus !== "none";
  }
}
