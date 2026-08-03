/** X3-18 — Scenario Simulation Engine. */

import type { ScaleSimulationEngineConfiguration } from "./configuration.js";
import type { ScaleSimulationRecord, ScaleSimulationInput } from "./types.js";
import {
  buildScaleSimulationRecord,
  computeScaleSimulationSignals,
} from "./structural-signals.js";

export class ScenarioSimulationEngine {
  simulateScenarios(
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
    sourceAvailable = true,
  ): ScaleSimulationRecord {
    if (!config.scalingScenarioSimulationEnabled) {
      throw new Error("Scaling scenario simulation disabled");
    }
    const signals = computeScaleSimulationSignals(
      "scaling_scenario_simulation",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.overallSimulationScore >= config.simulationScoreThreshold
        ? `Scenario simulation score ${signals.overallSimulationScore}% clears threshold ${config.simulationScoreThreshold} — simulation only; never execute against production`
        : `Scenario simulation score ${signals.overallSimulationScore}% below threshold — simulation only; never execute against production`;
    return buildScaleSimulationRecord({
      ...signals,
      recommendationSummary: summary,
    });
  }
}
