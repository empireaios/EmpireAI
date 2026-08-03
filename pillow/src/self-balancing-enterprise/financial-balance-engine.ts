/** X3-19 — Financial Balance Engine. */

import type { SelfBalancingEnterpriseConfiguration } from "./configuration.js";
import type { SelfBalancingRecord, SelfBalancingInput } from "./types.js";
import {
  buildSelfBalancingRecord,
  computeSelfBalancingSignals,
} from "./structural-signals.js";

export class FinancialBalanceEngine {
  monitorFinancialBalance(
    input: SelfBalancingInput,
    config: SelfBalancingEnterpriseConfiguration,
    sourceAvailable = true,
  ): SelfBalancingRecord {
    if (!config.financialBalanceMonitoringEnabled) {
      throw new Error("Financial balance monitoring disabled");
    }
    const signals = computeSelfBalancingSignals(
      "financial_balance_monitoring",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.balanceScore >= config.financialBalanceThreshold
        ? `Financial balance score ${signals.balanceScore}% above ${config.financialBalanceThreshold} — structural signals only`
        : signals.expectedImprovement;
    return buildSelfBalancingRecord({
      ...signals,
      resourceCategory: "financial",
      expectedImprovement: summary,
    });
  }
}
