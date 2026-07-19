/** R4-14 — Risk Recommendation Engine. */

import type { CustomerRiskEngineConfiguration } from "./configuration.js";
import type { RecommendedAction, RiskLevel } from "./types.js";

export class RiskRecommendationEngine {
  recommend(input: {
    riskLevel: RiskLevel;
    indicators: string[];
    config: CustomerRiskEngineConfiguration;
  }): RecommendedAction {
    if (!input.config.recommendationRulesEnabled) return "review";

    if (input.riskLevel === "critical") return "escalate";
    if (input.riskLevel === "high") {
      return input.indicators.includes("repeat_return_pattern")
        ? "limit_transactions"
        : "verify_identity";
    }
    if (input.riskLevel === "medium") return "review";
    if (input.riskLevel === "low" && input.indicators.length === 0) return "no_action";
    return "monitor";
  }

  toMachineReadable(record: {
    customerRiskId: string;
    timestamp: string;
    customerId: string;
    riskCategory: string;
    riskIndicators: string[];
    riskScore: number;
    riskLevel: string;
    recommendedAction: string;
    alertStatus: string;
    validationStatus: string;
    metadataVersion: string;
  }): Record<string, unknown> {
    return { ...record };
  }

  summarize(
    records: Array<{ riskScore: number; riskLevel: string; alertStatus: string; validationStatus: string }>,
    alerts: unknown[],
  ) {
    const highRiskCustomers = new Set<string>();
    return {
      totalRecords: records.length,
      highRiskReturns: records.filter((r) => r.riskLevel === "high" || r.riskLevel === "critical")
        .length,
      activeAlerts: alerts.length,
      failedRecords: records.filter((r) => r.validationStatus === "failed").length,
      highRiskCustomers: highRiskCustomers.size,
    };
  }
}
