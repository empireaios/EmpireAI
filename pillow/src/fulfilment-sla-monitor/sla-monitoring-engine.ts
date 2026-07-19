/** R2-18 — SLA Monitoring Engine. */

import type { FulfilmentRecord } from "../fulfilment-orchestrator/types.js";
import type { ShipmentTrackingRecord } from "../shipment-tracking-engine/types.js";
import type { LogisticsRecord } from "../logistics-optimization/types.js";
import type { FulfilmentSlaMonitorConfiguration } from "./configuration.js";

export class SlaMonitoringEngine {
  resolveSlaTarget(
    logistics: LogisticsRecord | null,
    config: FulfilmentSlaMonitorConfiguration,
  ): number {
    if (logistics?.estimatedDeliveryTime) {
      return logistics.estimatedDeliveryTime * 24;
    }
    return config.slaThresholdHours;
  }

  estimateActualFulfilmentTime(
    fulfilment: FulfilmentRecord | null,
    tracking: ShipmentTrackingRecord | null,
    logistics: LogisticsRecord | null,
  ): number {
    if (tracking?.deliveredTimestamp && fulfilment?.timestamp) {
      const start = new Date(fulfilment.timestamp).getTime();
      const end = new Date(tracking.deliveredTimestamp).getTime();
      if (end > start) return Math.round((end - start) / (1000 * 60 * 60));
    }
    if (tracking?.delayStatus === "delayed") return 84;
    if (tracking?.delayStatus === "at_risk") return 60;
    if (logistics?.estimatedDeliveryTime) return logistics.estimatedDeliveryTime * 20;
    if (fulfilment?.fulfilmentStatus === "fulfilled") return 40;
    if (fulfilment?.fulfilmentStatus === "in_progress") return 52;
    return 48;
  }

  hasFulfilmentData(fulfilments: FulfilmentRecord[], orderReference: string): boolean {
    return fulfilments.some((f) => f.orderReference === orderReference);
  }

  hasShipmentData(tracking: ShipmentTrackingRecord[], shipments: string[], orderReference: string): boolean {
    return (
      tracking.some((t) => t.orderReference === orderReference) ||
      shipments.some((s) => s.includes(orderReference))
    );
  }
}
