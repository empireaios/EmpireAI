/** R2-16 — Risk Scoring Engine. */

import type { SupplierRiskMonitorConfiguration } from "./configuration.js";
import type { AvailabilityStatus, StabilityStatus, FulfilmentReliabilityStatus } from "./types.js";

export class RiskScoringEngine {
  calculateRiskScore(input: {
    healthScore: number;
    availabilityStatus: AvailabilityStatus;
    inventoryStability: StabilityStatus;
    pricingStability: StabilityStatus;
    fulfilmentReliability: FulfilmentReliabilityStatus;
    config: SupplierRiskMonitorConfiguration;
  }): number {
    let risk = 100 - input.healthScore;
    if (input.availabilityStatus === "disrupted") risk += 20;
    else if (input.availabilityStatus === "unavailable") risk += 15;
    else if (input.availabilityStatus === "limited") risk += 8;
    if (input.inventoryStability === "critical") risk += 15;
    else if (input.inventoryStability === "volatile") risk += 8;
    if (input.pricingStability === "critical") risk += 12;
    else if (input.pricingStability === "volatile") risk += 6;
    if (input.fulfilmentReliability === "failed") risk += 18;
    else if (input.fulfilmentReliability === "low") risk += 10;
    return Math.max(0, Math.min(100, Math.round(risk)));
  }

  isHighRisk(riskScore: number, config: SupplierRiskMonitorConfiguration): boolean {
    return riskScore >= config.highRiskThresholdScore;
  }

  exceedsThreshold(riskScore: number, config: SupplierRiskMonitorConfiguration): boolean {
    return riskScore >= config.riskThresholdScore;
  }
}
