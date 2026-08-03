/** X3-19 — Operational Balance Engine. */

import type { SelfBalancingEnterpriseConfiguration } from "./configuration.js";
import type { SelfBalancingRecord, SelfBalancingInput } from "./types.js";
import {
  buildSelfBalancingRecord,
  computeSelfBalancingSignals,
} from "./structural-signals.js";

export class OperationalBalanceEngine {
  monitorOperationalBalance(
    input: SelfBalancingInput,
    config: SelfBalancingEnterpriseConfiguration,
    sourceAvailable = true,
  ): SelfBalancingRecord {
    if (!config.operationalBalanceMonitoringEnabled) {
      throw new Error("Operational balance monitoring disabled");
    }
    const signals = computeSelfBalancingSignals(
      "operational_balance_monitoring",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.balanceScore >= config.operationalBalanceThreshold
        ? `Operational balance score ${signals.balanceScore}% above ${config.operationalBalanceThreshold} — structural signals only`
        : signals.expectedImprovement;
    return buildSelfBalancingRecord({
      ...signals,
      resourceCategory: "operational",
      expectedImprovement: summary,
    });
  }
}
