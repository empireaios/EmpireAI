/** R2-16 — Supplier Risk Analysis Engine. */

import { appendSrmLog } from "./srm-logging.js";
import type { SupplierRiskMonitorConfiguration } from "./configuration.js";
import type {
  AvailabilityStatus,
  FulfilmentReliabilityStatus,
  StabilityStatus,
  SupplierRiskRecord,
} from "./types.js";

export class SupplierRiskAnalysisEngine {
  detectDisruption(availability: AvailabilityStatus): boolean {
    return availability === "disrupted" || availability === "unavailable";
  }

  detectAbnormalBehaviour(record: SupplierRiskRecord): boolean {
    return (
      record.pricingStability === "volatile" &&
      record.inventoryStability === "volatile" &&
      record.fulfilmentReliability === "low"
    );
  }

  generateAlerts(input: {
    availability: AvailabilityStatus;
    inventoryStability: StabilityStatus;
    pricingStability: StabilityStatus;
    fulfilmentReliability: FulfilmentReliabilityStatus;
    riskScore: number;
    config: SupplierRiskMonitorConfiguration;
  }): string[] {
    if (!input.config.alertRulesEnabled) return [];
    const alerts: string[] = [];
    if (input.availability === "disrupted") alerts.push("disruption");
    if (input.inventoryStability === "critical" || input.inventoryStability === "volatile") {
      alerts.push("inventory_instability");
    }
    if (input.pricingStability === "volatile" || input.pricingStability === "critical") {
      alerts.push("pricing_volatility");
    }
    if (input.fulfilmentReliability === "failed" || input.fulfilmentReliability === "low") {
      alerts.push("fulfilment_failure");
    }
    if (input.riskScore >= input.config.riskThresholdScore && input.riskScore < input.config.highRiskThresholdScore) {
      alerts.push("communication_degraded");
    }
    if (this.detectAbnormalFromMetrics(input)) alerts.push("abnormal_behaviour");
    if (alerts.length) {
      appendSrmLog({
        event: "risk_alert",
        level: "warn",
        details: `Risk alerts: ${alerts.join(", ")}`,
      });
    }
    return [...new Set(alerts)];
  }

  private detectAbnormalFromMetrics(input: {
    inventoryStability: StabilityStatus;
    pricingStability: StabilityStatus;
    fulfilmentReliability: FulfilmentReliabilityStatus;
  }): boolean {
    return (
      input.pricingStability === "volatile" &&
      input.inventoryStability === "volatile" &&
      (input.fulfilmentReliability === "low" || input.fulfilmentReliability === "failed")
    );
  }
}
