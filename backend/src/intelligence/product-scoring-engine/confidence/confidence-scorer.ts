import type { ProductSignal } from "../../../eye/contract/product-signal.js";
import type { DimensionScoreResult } from "../types/scoring-dimensions.js";
import { clampScore, hasField, providerTrustHint } from "../dimensions/scoring-utils.js";

export function computeScoringConfidence(
  signal: ProductSignal,
  dimensions: DimensionScoreResult[],
): number {
  const checks: boolean[] = [
    signal.productTitle.length > 0,
    signal.category.length > 0,
    signal.demandIndex > 0,
    signal.competitionIndex >= 0,
    signal.marginEstimatePct > 0,
    hasField(signal.estimatedSellingPriceCents),
    hasField(signal.monthlyOrdersEstimate),
    hasField(signal.listingCount),
    hasField(signal.avgRating),
    signal.trendDirection.length > 0,
    signal.confidence > 0,
    signal.observationIds.length > 0,
    dimensions.every((d) => d.score >= 0 && d.score <= 100),
  ];

  const present = checks.filter(Boolean).length;
  const completeness = present / checks.length;

  let confidence = completeness * 70;

  confidence += Math.min(15, signal.confidence * 0.15);
  confidence += providerTrustHint(signal);

  if (signal.mock) {
    confidence -= 10;
  } else {
    confidence += 5;
  }

  return clampScore(Math.round(confidence));
}
