/** X3-13 — Risk Detection Engine (scaling / supplier / marketing / workforce / expansion). */

import type { ScalingRiskMonitorConfiguration } from "./configuration.js";
import type {
  RiskOperation,
  ScalingRiskRecord,
  ScalingRiskInput,
} from "./types.js";
import { buildScalingRiskRecord, computeRiskSignals } from "./structural-signals.js";

const OPERATION_FLAG: Partial<
  Record<RiskOperation, keyof ScalingRiskMonitorConfiguration>
> = {
  scaling_risk: "scalingRiskMonitoringEnabled",
  supplier_risk: "supplierRiskMonitoringEnabled",
  marketing_risk: "marketingRiskMonitoringEnabled",
  workforce_risk: "workforceRiskMonitoringEnabled",
  uncontrolled_expansion: "uncontrolledExpansionDetectionEnabled",
};

export class RiskDetectionEngine {
  assess(
    operation: Extract<
      RiskOperation,
      | "scaling_risk"
      | "supplier_risk"
      | "marketing_risk"
      | "workforce_risk"
      | "uncontrolled_expansion"
    >,
    input: ScalingRiskInput,
    config: ScalingRiskMonitorConfiguration,
    sourceAvailable = true,
  ): ScalingRiskRecord {
    const flag = OPERATION_FLAG[operation];
    if (flag && !config[flag]) {
      throw new Error(`${operation} scaling risk monitoring disabled`);
    }
    const signals = computeRiskSignals(operation, input, config, sourceAvailable);
    return buildScalingRiskRecord(signals);
  }

  detectUncontrolledExpansion(
    input: ScalingRiskInput,
    config: ScalingRiskMonitorConfiguration,
    sourceAvailable = true,
  ): ScalingRiskRecord {
    if (!config.uncontrolledExpansionDetectionEnabled) {
      throw new Error("Uncontrolled expansion detection disabled");
    }
    const signals = computeRiskSignals(
      "uncontrolled_expansion",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.riskSeverity === "critical" || signals.riskSeverity === "high"
        ? `Uncontrolled expansion detected · probability ${signals.riskProbability}% — never suppress critical scaling risks`
        : `Expansion within control bounds · probability ${signals.riskProbability}%`;
    return buildScalingRiskRecord({
      ...signals,
      businessImpact: summary,
      mitigationRecommendation:
        signals.riskSeverity === "low"
          ? signals.mitigationRecommendation
          : "Throttle expansion; enforce capacity and financial gates — never suppress critical scaling risks",
    });
  }
}
