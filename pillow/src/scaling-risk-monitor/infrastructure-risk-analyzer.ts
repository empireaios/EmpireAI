/** X3-13 — Infrastructure Risk Analyzer. */

import type { ScalingRiskMonitorConfiguration } from "./configuration.js";
import type { ScalingRiskRecord, ScalingRiskInput } from "./types.js";
import { buildScalingRiskRecord, computeRiskSignals } from "./structural-signals.js";

export class InfrastructureRiskAnalyzer {
  monitor(
    input: ScalingRiskInput,
    config: ScalingRiskMonitorConfiguration,
    sourceAvailable = true,
  ): ScalingRiskRecord {
    if (!config.infrastructureRiskMonitoringEnabled) {
      throw new Error("Infrastructure risk monitoring disabled");
    }
    const signals = computeRiskSignals(
      "infrastructure_risk",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.riskProbability >= config.infrastructureRiskThreshold
        ? `Infrastructure risk ${signals.riskProbability}% above ${config.infrastructureRiskThreshold} — stabilize infra before expansion`
        : signals.businessImpact;
    return buildScalingRiskRecord({
      ...signals,
      businessImpact: summary,
    });
  }
}
