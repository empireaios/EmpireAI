import type { ProductSignal } from "../../../eye/contract/product-signal.js";
import { DEFAULT_SCORING_WEIGHTS } from "../config/default-weights.js";
import { scoreAdvertisementPotential } from "../dimensions/advertisement-potential-scorer.js";
import { scoreBrandability } from "../dimensions/brandability-scorer.js";
import { scoreCompetition } from "../dimensions/competition-scorer.js";
import { scoreDemand } from "../dimensions/demand-scorer.js";
import { scoreMargin } from "../dimensions/margin-scorer.js";
import { scoreRisk } from "../dimensions/risk-scorer.js";
import { clampScore } from "../dimensions/scoring-utils.js";
import { scoreShipping } from "../dimensions/shipping-scorer.js";
import { scoreSupplierTrust } from "../dimensions/supplier-trust-scorer.js";
import { scoreTrendMomentum } from "../dimensions/trend-momentum-scorer.js";
import type { DimensionScoreResult } from "../types/scoring-dimensions.js";
import type { ScoringWeightConfig, ScoringWeightOverrides } from "../types/weight-config.js";

export function resolveWeightConfig(overrides?: ScoringWeightOverrides): ScoringWeightConfig {
  return { ...DEFAULT_SCORING_WEIGHTS, ...overrides };
}

export function scoreAllDimensions(
  signal: ProductSignal,
  weights: ScoringWeightConfig,
): DimensionScoreResult[] {
  return [
    scoreDemand(signal, weights.demand),
    scoreCompetition(signal, weights.competition),
    scoreMargin(signal, weights.margin),
    scoreSupplierTrust(signal, weights.supplierTrust),
    scoreShipping(signal, weights.shipping),
    scoreBrandability(signal, weights.brandability),
    scoreAdvertisementPotential(signal, weights.advertisementPotential),
    scoreTrendMomentum(signal, weights.trendMomentum),
    scoreRisk(signal, weights.risk),
  ];
}

/**
 * Empire Score = Σ(dimensionScore × normalizedWeight) where normalized weights sum to 1.
 * Each dimension score is 0–100; risk is inverted so lower business risk yields a higher score.
 */
export function computeEmpireScore(dimensions: DimensionScoreResult[]): number {
  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
  if (totalWeight <= 0) return 0;

  const weightedSum = dimensions.reduce((sum, d) => sum + d.score * (d.weight / totalWeight), 0);
  return clampScore(weightedSum);
}
