/** X3-18 — Risk Simulation Engine (financial impact / scaling risks). */

import type { ScaleSimulationEngineConfiguration } from "./configuration.js";
import type { ScaleSimulationRecord, ScaleSimulationInput } from "./types.js";
import {
  buildScaleSimulationRecord,
  computeScaleSimulationSignals,
} from "./structural-signals.js";

export class RiskSimulationEngine {
  simulateFinancialImpact(
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
    sourceAvailable = true,
  ): ScaleSimulationRecord {
    if (!config.financialImpactSimulationEnabled) {
      throw new Error("Financial impact simulation disabled");
    }
    const signals = computeScaleSimulationSignals(
      "financial_impact_simulation",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.overallSimulationScore >= config.riskProjectionThreshold
        ? `Financial impact simulation score ${signals.overallSimulationScore}% above ${config.riskProjectionThreshold} — structural signals only; simulation only`
        : signals.recommendationSummary;
    return buildScaleSimulationRecord({
      ...signals,
      simulationScenario: "balanced",
      recommendationSummary: summary,
    });
  }

  simulateScalingRisks(
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
    sourceAvailable = true,
  ): ScaleSimulationRecord {
    if (!config.scalingRiskSimulationEnabled) {
      throw new Error("Scaling risk simulation disabled");
    }
    const signals = computeScaleSimulationSignals(
      "scaling_risk_simulation",
      input,
      config,
      sourceAvailable,
    );
    const elevatedRisk = signals.riskProjection >= config.riskProjectionThreshold;
    const summary = elevatedRisk
      ? `Elevated simulated scaling risk ${signals.riskProjection}% for ${signals.simulationScenario} — hold production execution; simulation only`
      : `Simulated scaling risk ${signals.riskProjection}% within bounds — never execute simulated actions against production`;
    return buildScaleSimulationRecord({
      ...signals,
      simulationScenario: "risk_averse",
      recommendationSummary: summary,
    });
  }
}
