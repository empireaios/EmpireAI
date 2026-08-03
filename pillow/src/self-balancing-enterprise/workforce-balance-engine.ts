/** X3-19 — Workforce Balance Engine. */

import type { SelfBalancingEnterpriseConfiguration } from "./configuration.js";
import type { SelfBalancingRecord, SelfBalancingInput } from "./types.js";
import {
  buildSelfBalancingRecord,
  computeSelfBalancingSignals,
} from "./structural-signals.js";

export class WorkforceBalanceEngine {
  monitorWorkforceBalance(
    input: SelfBalancingInput,
    config: SelfBalancingEnterpriseConfiguration,
    sourceAvailable = true,
  ): SelfBalancingRecord {
    if (!config.workforceBalanceMonitoringEnabled) {
      throw new Error("Workforce balance monitoring disabled");
    }
    const signals = computeSelfBalancingSignals(
      "workforce_balance_monitoring",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.balanceScore >= config.workforceBalanceThreshold
        ? `Workforce balance score ${signals.balanceScore}% above ${config.workforceBalanceThreshold} — structural signals only`
        : signals.expectedImprovement;
    return buildSelfBalancingRecord({
      ...signals,
      resourceCategory: "workforce",
      expectedImprovement: summary,
    });
  }
}
