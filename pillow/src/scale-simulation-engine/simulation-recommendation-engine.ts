/** X3-18 — Simulation Recommendation Engine. */

import type { ScaleSimulationEngineConfiguration } from "./configuration.js";
import type {
  ScaleSimulationRecommendation,
  ScaleSimulationRecord,
} from "./types.js";

export class SimulationRecommendationEngine {
  generate(
    records: ScaleSimulationRecord[],
    config: ScaleSimulationEngineConfiguration,
  ): ScaleSimulationRecommendation[] {
    // Never execute simulated actions against production.
    const eligible = records.filter(
      (r) =>
        r.validationStatus === "passed" &&
        r.overallSimulationScore >= config.simulationScoreThreshold &&
        r.overallSimulationScore >= config.highScoreThreshold &&
        r.neverExecuteSimulatedActionsAgainstProduction === true &&
        r.simulationOnly === true,
    );

    if (eligible.length === 0) {
      return [
        {
          recommendationId: `ssi-rec-${Date.now()}-hold`,
          timestamp: new Date().toISOString(),
          companyReference: records[0]?.companyReference ?? "company-default",
          simulationScenario: records[0]?.simulationScenario ?? "baseline_scale",
          recommendationSummary:
            "Hold simulated scale — validated structural scores do not clear thresholds (never execute simulated actions against production)",
          overallSimulationScore: records[0]?.overallSimulationScore ?? 0,
          revenueProjection: records[0]?.revenueProjection ?? 0,
          profitProjection: records[0]?.profitProjection ?? 0,
          capacityProjection: records[0]?.capacityProjection ?? 0,
          riskProjection: records[0]?.riskProjection ?? 0,
          structuralSignalOnly: true,
          neverExecuteSimulatedActionsAgainstProduction: true,
          simulationOnly: true,
        },
      ];
    }

    return eligible.slice(0, 8).map((record, index) => {
      const posture =
        record.overallSimulationScore >= config.criticalScoreThreshold
          ? "stage-simulated-scale"
          : record.overallSimulationScore >= config.highScoreThreshold
            ? "prepare-simulation"
            : "observe";
      const summary = `${posture} ${record.simulationScenario} — score ${record.overallSimulationScore}% · never execute simulated actions against production`;
      return {
        recommendationId: `ssi-rec-${Date.now()}-${index}`,
        timestamp: new Date().toISOString(),
        companyReference: record.companyReference,
        simulationScenario: record.simulationScenario,
        recommendationSummary: summary,
        overallSimulationScore: record.overallSimulationScore,
        revenueProjection: record.revenueProjection,
        profitProjection: record.profitProjection,
        capacityProjection: record.capacityProjection,
        riskProjection: record.riskProjection,
        structuralSignalOnly: true,
        neverExecuteSimulatedActionsAgainstProduction: true,
        simulationOnly: true,
      };
    });
  }
}
