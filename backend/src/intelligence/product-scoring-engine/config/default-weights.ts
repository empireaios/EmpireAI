import type { ScoringWeightConfig } from "../types/weight-config.js";

/**
 * Default dimension weights (sum = 100 for readability).
 * Calculator normalizes to proportional shares before weighted averaging.
 */
export const DEFAULT_SCORING_WEIGHTS: ScoringWeightConfig = {
  demand: 16,
  competition: 13,
  margin: 15,
  supplierTrust: 11,
  shipping: 9,
  brandability: 9,
  advertisementPotential: 9,
  trendMomentum: 7,
  risk: 11,
};
