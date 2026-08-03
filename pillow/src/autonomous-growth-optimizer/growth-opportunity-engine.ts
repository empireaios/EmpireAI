/** X3-15 — Growth Opportunity Engine. */

import type { AutonomousGrowthOptimizerConfiguration } from "./configuration.js";
import type { GrowthOptimizationRecord, GrowthOptimizationInput } from "./types.js";
import {
  buildGrowthOptimizationRecord,
  computeGrowthOptimizationSignals,
} from "./structural-signals.js";

export class GrowthOpportunityEngine {
  identify(
    input: GrowthOptimizationInput,
    config: AutonomousGrowthOptimizerConfiguration,
    sourceAvailable = true,
  ): GrowthOptimizationRecord {
    if (!config.growthOpportunityIdentificationEnabled) {
      throw new Error("Growth opportunity identification disabled");
    }
    const signals = computeGrowthOptimizationSignals(
      "growth_opportunity_identification",
      input,
      config,
      sourceAvailable,
    );
    const summary =
      signals.growthOpportunityScore >= config.growthOpportunityThreshold
        ? `Identified sustainable growth opportunity ${signals.growthOpportunityScore}% for ${signals.companyReference} · ${signals.growthCategory} — structural signals only`
        : signals.recommendationSummary;
    return buildGrowthOptimizationRecord({
      ...signals,
      recommendationSummary: summary,
    });
  }
}
