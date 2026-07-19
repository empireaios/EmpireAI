/** R2-18 — SLA Compliance Engine. */

import type { FulfilmentSlaMonitorConfiguration } from "./configuration.js";
import type { ComplianceStatus } from "./types.js";

export class SlaComplianceEngine {
  calculateComplianceScore(
    slaTarget: number,
    actualTime: number,
    config: FulfilmentSlaMonitorConfiguration,
  ): number {
    if (!config.complianceRulesEnabled) return 50;
    if (actualTime <= 0 || slaTarget <= 0) return 0;
    const ratio = actualTime / slaTarget;
    if (ratio <= 0.5) return 100;
    if (ratio <= 0.75) return 90;
    if (ratio <= 1) return Math.round(100 - ratio * 20);
    if (ratio <= 1.25) return Math.round(60 - (ratio - 1) * 40);
    return Math.max(0, Math.round(40 - (ratio - 1.25) * 30));
  }

  determineComplianceStatus(
    score: number,
    actualTime: number,
    slaTarget: number,
    config: FulfilmentSlaMonitorConfiguration,
  ): ComplianceStatus {
    if (!config.complianceRulesEnabled) return "pending";
    if (score < config.breachThresholdScore || actualTime > slaTarget * 1.25) return "breached";
    if (score < config.riskThresholdScore || actualTime > slaTarget * 0.85) return "at_risk";
    return "compliant";
  }

  isSupplierCompliant(supplierId: string, fulfilmentStatus: string | null): boolean {
    if (!supplierId) return false;
    return fulfilmentStatus !== "failed" && fulfilmentStatus !== "blocked";
  }

  isCarrierCompliant(delayStatus: string | null): boolean {
    return delayStatus !== "delayed";
  }
}
