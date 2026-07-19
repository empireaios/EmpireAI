/** R2-11 — Shipping carrier health monitoring. */

import type { ShippingCarrierIntegrationConfiguration } from "./configuration.js";
import type {
  CarrierFailureFinding,
  CarrierHealthReport,
  CarrierValidationReport,
  InvalidShipmentFinding,
  ShipmentRecord,
} from "./types.js";

export class HealthMonitor {
  private lastOperationAt: string | null = null;
  private lastDecision: CarrierValidationReport["decision"] | null = null;
  private carrierFailures = 0;
  private labelsGenerated = 0;
  private invalidRequestsDetected = 0;

  recordOperation(
    decision: CarrierValidationReport["decision"],
    failures: CarrierFailureFinding[] = [],
    invalidRequests: InvalidShipmentFinding[] = [],
    labels = 0,
  ): void {
    this.lastOperationAt = new Date().toISOString();
    this.lastDecision = decision;
    if (decision === "fail") this.carrierFailures += 1;
    this.carrierFailures += failures.length;
    this.labelsGenerated += labels;
    this.invalidRequestsDetected += invalidRequests.length;
  }

  buildReport(input: {
    config: ShippingCarrierIntegrationConfiguration;
    records: ShipmentRecord[];
    registeredCarriers: number;
    consecutiveFailures: number;
    recoveryAttempts: number;
  }): CarrierHealthReport {
    let healthScore = 100;
    if (input.consecutiveFailures > 0) {
      healthScore -= Math.min(40, input.consecutiveFailures * 15);
    }
    if (!input.config.enabled) healthScore = 50;
    if (this.carrierFailures > 0) healthScore = Math.min(healthScore, 60);
    if (this.lastDecision === "fail") healthScore = Math.min(healthScore, 40);

    const status = !input.config.enabled
      ? "standby"
      : this.lastDecision === "fail"
        ? "failed"
        : input.consecutiveFailures > 1
          ? "degraded"
          : "healthy";

    const notes: string[] = [];
    if (!input.config.enabled) notes.push("Shipping carrier integration disabled");
    if (input.consecutiveFailures > 0) {
      notes.push(`${input.consecutiveFailures} consecutive carrier failures`);
    }
    if (input.recoveryAttempts > 0) notes.push(`${input.recoveryAttempts} recovery attempts`);
    notes.push(`Shipment records: ${input.records.length}, carriers: ${input.registeredCarriers}`);

    return {
      status,
      healthScore: Math.max(0, Math.min(100, healthScore)),
      engineEnabled: input.config.enabled,
      shipmentCount: input.records.length,
      registeredCarriers: input.registeredCarriers,
      lastShipmentAt: this.lastOperationAt,
      lastValidationDecision: this.lastDecision,
      consecutiveFailures: input.consecutiveFailures,
      recoveryAttempts: input.recoveryAttempts,
      carrierFailures: this.carrierFailures,
      labelsGenerated: this.labelsGenerated,
      invalidRequestsDetected: this.invalidRequestsDetected,
      notes,
    };
  }

  resetForTesting(): void {
    this.lastOperationAt = null;
    this.lastDecision = null;
    this.carrierFailures = 0;
    this.labelsGenerated = 0;
    this.invalidRequestsDetected = 0;
  }
}
