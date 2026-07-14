/** T2-08 — Overall UX score aggregation. */

import { ScoringWeightManager } from "./scoring-weight-manager.js";
import { averageConfidence } from "./scoring-helpers.js";
import type { ScoreBreakdownEntry } from "./types.js";
import type { UxScoringConfiguration } from "./configuration.js";

export class OverallScoreAggregator {
  private readonly weights = new ScoringWeightManager();

  aggregate(
    dimensionScores: {
      screenScore: number;
      componentScore: number;
      layoutScore: number;
      workflowScore: number;
      accessibilityScore: number;
      consistencyScore: number;
      executivePreferenceAlignmentScore: number;
    },
    breakdown: ScoreBreakdownEntry[],
    confidenceValues: number[],
    config: UxScoringConfiguration,
  ): { overallUxScore: number; scoreBreakdown: ScoreBreakdownEntry[]; confidenceScore: number } {
    const normalizedWeights = this.weights.getNormalizedWeights(config);

    const enrichedBreakdown = breakdown.map((entry) => {
      const weight = normalizedWeights.get(entry.category) ?? entry.weight;
      return {
        ...entry,
        weight,
        weightedScore: Math.round(entry.score * weight * 100) / 100,
      };
    });

    const categoryMap = new Map(enrichedBreakdown.map((e) => [e.category, e.score]));
    let weightedSum = 0;
    let totalWeight = 0;

    for (const [category, weight] of normalizedWeights) {
      const score = categoryMap.get(category);
      if (score !== undefined && weight > 0) {
        weightedSum += score * weight;
        totalWeight += weight;
      }
    }

    const categoryOverall =
      totalWeight > 0 ? weightedSum / totalWeight : config.scoreScale.max * 0.5;

    const dimensionAvg =
      (dimensionScores.screenScore +
        dimensionScores.componentScore +
        dimensionScores.layoutScore +
        dimensionScores.workflowScore +
        dimensionScores.accessibilityScore +
        dimensionScores.consistencyScore +
        dimensionScores.executivePreferenceAlignmentScore) /
      7;

    const blended = categoryOverall * 0.6 + dimensionAvg * 0.4;
    const confidence = averageConfidence(confidenceValues);
    const confidenceScore = Math.round(confidence * 100);
    const overallUxScore = this.weights.applyConfidence(
      this.weights.clamp(blended, config),
      confidence,
      config,
    );

    return { overallUxScore, scoreBreakdown: enrichedBreakdown, confidenceScore };
  }
}
