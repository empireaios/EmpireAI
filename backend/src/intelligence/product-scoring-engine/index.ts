export { DEFAULT_SCORING_WEIGHTS } from "./config/default-weights.js";
export { scoreProductSignal } from "./calculator/score-product-signal.js";
export type { ScoreProductSignalOptions } from "./calculator/score-product-signal.js";
export {
  computeEmpireScore,
  resolveWeightConfig,
  scoreAllDimensions,
} from "./calculator/score-calculator.js";
export { computeScoringConfidence } from "./confidence/confidence-scorer.js";
export {
  aggregateReasons,
  formatEmpireScoreExplanation,
} from "./explanation/score-explainer.js";
export { rankProducts } from "./services/product-ranking-service.js";
export type { ProductRankingOptions } from "./services/product-ranking-service.js";
export { selectTopOpportunities } from "./services/top-opportunity-selector.js";
export type { TopOpportunityThresholds } from "./services/top-opportunity-selector.js";

export { scoreDemand } from "./dimensions/demand-scorer.js";
export { scoreCompetition } from "./dimensions/competition-scorer.js";
export { scoreMargin } from "./dimensions/margin-scorer.js";
export { scoreSupplierTrust } from "./dimensions/supplier-trust-scorer.js";
export { scoreShipping } from "./dimensions/shipping-scorer.js";
export { scoreBrandability } from "./dimensions/brandability-scorer.js";
export { scoreAdvertisementPotential } from "./dimensions/advertisement-potential-scorer.js";
export { scoreTrendMomentum } from "./dimensions/trend-momentum-scorer.js";
export { scoreRisk } from "./dimensions/risk-scorer.js";

export type { ProductScore, ProductSignalReference } from "./types/product-score.js";
export type {
  DimensionScoreResult,
  ScoringDimension,
} from "./types/scoring-dimensions.js";
export { SCORING_DIMENSIONS } from "./types/scoring-dimensions.js";
export type { ScoringWeightConfig, ScoringWeightOverrides } from "./types/weight-config.js";
