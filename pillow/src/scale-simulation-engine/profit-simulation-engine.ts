/** X3-18 — Profit Simulation Engine. */

import type { ScaleSimulationEngineConfiguration } from "./configuration.js";
import type { ScaleSimulationRecord, ScaleSimulationInput } from "./types.js";
import {
  buildScaleSimulationRecord,
  computeScaleSimulationSignals,
} from "./structural-signals.js";

export class ProfitSimulationEngine {
  simulateProfitOutcomes(
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
    sourceAvailable = true,
  ): ScaleSimulationRecord {
    if (!config.profitOutcomeSimulationEnabled) {
      throw new Error("Profit outcome simulation disabled");
    }
    const signals = computeScaleSimulationSignals(
      "profit_outcome_simulation",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.profitProjection >= config.profitProjectionThreshold
        ? `Profit projection structural score ${signals.profitProjection}% above ${config.profitProjectionThreshold} — simulation only`
        : signals.recommendationSummary;
    return buildScaleSimulationRecord({
      ...signals,
      simulationScenario: "profit_focus",
      recommendationSummary: summary,
    });
  }
}
