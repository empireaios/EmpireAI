/** X3-13 — Financial Risk Analyzer. */

import type { ScalingRiskMonitorConfiguration } from "./configuration.js";
import type { ScalingRiskRecord, ScalingRiskInput } from "./types.js";
import { buildScalingRiskRecord, computeRiskSignals } from "./structural-signals.js";

export class FinancialRiskAnalyzer {
  monitor(
    input: ScalingRiskInput,
    config: ScalingRiskMonitorConfiguration,
    sourceAvailable = true,
  ): ScalingRiskRecord {
    if (!config.financialRiskMonitoringEnabled) {
      throw new Error("Financial risk monitoring disabled");
    }
    const signals = computeRiskSignals(
      "financial_risk",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.riskProbability >= config.financialRiskThreshold
        ? `Financial risk ${signals.riskProbability}% above ${config.financialRiskThreshold} — protect capital before further scale`
        : signals.businessImpact;
    return buildScalingRiskRecord({
      ...signals,
      businessImpact: summary,
    });
  }
}
