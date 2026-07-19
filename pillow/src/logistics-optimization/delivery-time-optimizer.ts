/** R2-17 — Delivery Time Optimizer. */

import type { ShipmentTrackingRecord } from "../shipment-tracking-engine/types.js";
import type { LogisticsOptimizationConfiguration } from "./configuration.js";

export class DeliveryTimeOptimizer {
  optimizeDeliveryTime(
    carrierDays: number,
    tracking: ShipmentTrackingRecord | null,
    config: LogisticsOptimizationConfiguration,
  ): { estimatedDays: number; improved: boolean } {
    if (!config.deliveryOptimizationRulesEnabled) {
      return { estimatedDays: carrierDays, improved: false };
    }

    let estimatedDays = carrierDays;
    if (tracking?.delayStatus === "delayed") {
      estimatedDays = Math.max(1, carrierDays - 1);
    } else if (tracking?.delayStatus === "at_risk") {
      estimatedDays = Math.max(2, carrierDays - 1);
    } else if (!tracking) {
      estimatedDays = Math.max(2, carrierDays - 1);
    }

    return { estimatedDays, improved: estimatedDays < carrierDays };
  }

  scoreDeliverySpeed(days: number): number {
    return Math.max(0, Math.min(100, Math.round(100 - days * 8)));
  }
}
