/** X3-18 — Revenue Simulation Engine. */

import type { ScaleSimulationEngineConfiguration } from "./configuration.js";
import type { ScaleSimulationRecord, ScaleSimulationInput } from "./types.js";
import {
  buildScaleSimulationRecord,
  computeScaleSimulationSignals,
} from "./structural-signals.js";

export class RevenueSimulationEngine {
  simulateRevenueOutcomes(
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
    sourceAvailable = true,
  ): ScaleSimulationRecord {
    if (!config.revenueOutcomeSimulationEnabled) {
      throw new Error("Revenue outcome simulation disabled");
    }
    const signals = computeScaleSimulationSignals(
      "revenue_outcome_simulation",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.revenueProjection >= config.revenueProjectionThreshold
        ? `Revenue projection structural score ${signals.revenueProjection}% above ${config.revenueProjectionThreshold} — simulation only`
        : signals.recommendationSummary;
    return buildScaleSimulationRecord({
      ...signals,
      simulationScenario: "revenue_focus",
      recommendationSummary: summary,
    });
  }
}
