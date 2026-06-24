import type { ProductSignal } from "../../../eye/contract/product-signal.js";
import type { DimensionScoreResult } from "../types/scoring-dimensions.js";
import { clampScore, hasField, negativeReason, positiveReason } from "./scoring-utils.js";

/**
 * Risk dimension — higher score means lower business risk (inverted risk model).
 * Elevated risk reduces the Empire Score via a lower dimension score.
 */
export function scoreRisk(signal: ProductSignal, weight: number): DimensionScoreResult {
  const reasons: string[] = [];
  let riskPoints = 0;

  if (signal.competitionIndex >= 70) riskPoints += 18;
  else if (signal.competitionIndex >= 50) riskPoints += 10;

  if (signal.marginEstimatePct < 20) riskPoints += 20;
  else if (signal.marginEstimatePct < 30) riskPoints += 10;

  if (signal.trendDirection === "falling") riskPoints += 15;
  if (signal.mock) riskPoints += 8;
  if (signal.confidence < 40) riskPoints += 12;

  if (hasField(signal.avgRating) && signal.avgRating < 3.5) {
    riskPoints += 10;
    reasons.push(negativeReason("Quality risk from low ratings"));
  }

  if (hasField(signal.listingCount) && signal.listingCount > 1000) {
    riskPoints += 8;
    reasons.push(negativeReason("Market saturation risk"));
  }

  const score = clampScore(100 - riskPoints);

  if (score >= 75) {
    reasons.unshift(positiveReason("Low business risk"));
  } else if (score >= 55) {
    reasons.unshift(negativeReason("Moderate risk factors"));
  } else {
    reasons.unshift(negativeReason("Elevated risk"));
  }

  if (signal.marginEstimatePct >= 40 && signal.demandIndex >= 60) {
    reasons.push(positiveReason("Strong fundamentals offset risk"));
  }

  return { dimension: "risk", score, weight, reasons };
}
