import type { ProductSignal } from "../../../eye/contract/product-signal.js";
import { computeEmpireScore, resolveWeightConfig, scoreAllDimensions } from "../calculator/score-calculator.js";
import { computeScoringConfidence } from "../confidence/confidence-scorer.js";
import { aggregateReasons } from "../explanation/score-explainer.js";
import type { ProductScore } from "../types/product-score.js";
import type { ScoringWeightOverrides } from "../types/weight-config.js";

export type ScoreProductSignalOptions = {
  weightOverrides?: ScoringWeightOverrides;
  scoredAt?: string;
};

export function scoreProductSignal(
  signal: ProductSignal,
  options: ScoreProductSignalOptions = {},
): ProductScore {
  const weights = resolveWeightConfig(options.weightOverrides);
  const dimensions = scoreAllDimensions(signal, weights);
  const empireScore = computeEmpireScore(dimensions);
  const confidence = computeScoringConfidence(signal, dimensions);
  const reasons = aggregateReasons(dimensions);

  return {
    empireScore,
    dimensions,
    confidence,
    scoredAt: options.scoredAt ?? new Date().toISOString(),
    signalReference: {
      signalId: signal.signalId,
      providerId: signal.providerId,
      productTitle: signal.productTitle,
      workspaceId: signal.workspaceId,
      subjectKey: signal.subjectKey,
    },
    reasons,
  };
}
