/** X3-13 — Operational Risk Analyzer. */

import type { ScalingRiskMonitorConfiguration } from "./configuration.js";
import type { ScalingRiskRecord, ScalingRiskInput } from "./types.js";
import { buildScalingRiskRecord, computeRiskSignals } from "./structural-signals.js";

export class OperationalRiskAnalyzer {
  monitor(
    input: ScalingRiskInput,
    config: ScalingRiskMonitorConfiguration,
    sourceAvailable = true,
  ): ScalingRiskRecord {
    if (!config.operationalRiskMonitoringEnabled) {
      throw new Error("Operational risk monitoring disabled");
    }
    const signals = computeRiskSignals(
      "operational_risk",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.riskProbability >= config.operationalRiskThreshold
        ? `Operational risk ${signals.riskProbability}% above ${config.operationalRiskThreshold} — constrain scale until ops risk clears`
        : signals.businessImpact;
    return buildScalingRiskRecord({
      ...signals,
      businessImpact: summary,
    });
  }
}
