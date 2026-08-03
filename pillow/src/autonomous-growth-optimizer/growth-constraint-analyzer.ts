/** X3-15 — Growth Constraint Analyzer. */

import type { AutonomousGrowthOptimizerConfiguration } from "./configuration.js";
import type { GrowthOptimizationRecord, GrowthOptimizationInput } from "./types.js";
import {
  buildGrowthOptimizationRecord,
  computeGrowthOptimizationSignals,
} from "./structural-signals.js";

export class GrowthConstraintAnalyzer {
  identify(
    input: GrowthOptimizationInput,
    config: AutonomousGrowthOptimizerConfiguration,
    sourceAvailable = true,
  ): GrowthOptimizationRecord {
    if (!config.growthConstraintIdentificationEnabled) {
      throw new Error("Growth constraint identification disabled");
    }
    const signals = computeGrowthOptimizationSignals(
      "growth_constraint_identification",
      input,
      config,
      sourceAvailable,
    );
    const constrained = signals.growthOpportunityScore < config.operationalGrowthThreshold;
    const summary = constrained
      ? `Growth constraint detected for ${signals.growthCategory} — opportunity ${signals.growthOpportunityScore}% below operational threshold; never optimize beyond validated operational limits`
      : `No hard growth constraint for ${signals.growthCategory} at opportunity ${signals.growthOpportunityScore}% — remain within validated operational limits`;
    return buildGrowthOptimizationRecord({
      ...signals,
      growthCategory: "operational",
      expectedGrowthImpact: constrained
        ? "Constrained — hold acceleration until operational limits clear"
        : signals.expectedGrowthImpact,
      recommendationSummary: summary,
    });
  }
}
