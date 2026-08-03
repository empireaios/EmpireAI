/** X3-18 — Scenario Comparison Engine (compare / rank). */

import type { ScaleSimulationEngineConfiguration } from "./configuration.js";
import type { ScaleSimulationRecord, ScaleSimulationInput } from "./types.js";
import {
  buildScaleSimulationRecord,
  computeScaleSimulationSignals,
} from "./structural-signals.js";

export class ScenarioComparisonEngine {
  compareScenarios(
    records: ScaleSimulationRecord[],
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
    sourceAvailable = true,
  ): ScaleSimulationRecord {
    if (!config.multiScenarioComparisonEnabled) {
      throw new Error("Multi-scenario comparison disabled");
    }
    const signals = computeScaleSimulationSignals(
      "multi_scenario_comparison",
      input,
      config,
      sourceAvailable,
    );
    const best = [...records].sort(
      (a, b) => b.overallSimulationScore - a.overallSimulationScore,
    )[0];
    const score = best?.overallSimulationScore ?? signals.overallSimulationScore;
    const scenario = best?.simulationScenario ?? signals.simulationScenario;
    const summary =
      records.length === 0
        ? `No prior simulation records — comparative baseline score ${score}% · simulation only`
        : `Compared ${records.length} scenarios — leading ${scenario} at ${score}% · never execute simulated actions against production`;
    return buildScaleSimulationRecord({
      companyReference: signals.companyReference,
      simulationScenario: scenario,
      revenueProjection: best?.revenueProjection ?? signals.revenueProjection,
      profitProjection: best?.profitProjection ?? signals.profitProjection,
      capacityProjection: best?.capacityProjection ?? signals.capacityProjection,
      riskProjection: best?.riskProjection ?? signals.riskProjection,
      overallSimulationScore: score,
      recommendationSummary: summary,
    });
  }

  rankOutcomes(
    records: ScaleSimulationRecord[],
    input: ScaleSimulationInput,
    config: ScaleSimulationEngineConfiguration,
    sourceAvailable = true,
  ): ScaleSimulationRecord {
    if (!config.simulationOutcomeRankingEnabled) {
      throw new Error("Simulation outcome ranking disabled");
    }
    const signals = computeScaleSimulationSignals(
      "simulation_outcome_ranking",
      input,
      config,
      sourceAvailable,
    );
    const ranked = [...records].sort(
      (a, b) => b.overallSimulationScore - a.overallSimulationScore,
    );
    const top = ranked[0];
    const score = top?.overallSimulationScore ?? signals.overallSimulationScore;
    const scenario = top?.simulationScenario ?? signals.simulationScenario;
    const summary =
      ranked.length === 0
        ? `No outcomes to rank — structural baseline ${score}% · simulation only`
        : `Ranked ${ranked.length} outcomes — top ${scenario} score ${score}% · simulation only; never execute against production`;
    return buildScaleSimulationRecord({
      companyReference: signals.companyReference,
      simulationScenario: scenario,
      revenueProjection: top?.revenueProjection ?? signals.revenueProjection,
      profitProjection: top?.profitProjection ?? signals.profitProjection,
      capacityProjection: top?.capacityProjection ?? signals.capacityProjection,
      riskProjection: top?.riskProjection ?? signals.riskProjection,
      overallSimulationScore: score,
      recommendationSummary: summary,
    });
  }
}
