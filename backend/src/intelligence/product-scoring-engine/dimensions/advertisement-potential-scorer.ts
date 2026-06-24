import type { ProductSignal } from "../../../eye/contract/product-signal.js";
import type { DimensionScoreResult } from "../types/scoring-dimensions.js";
import { clampScore, hasField, negativeReason, positiveReason } from "./scoring-utils.js";

export function scoreAdvertisementPotential(
  signal: ProductSignal,
  weight: number,
): DimensionScoreResult {
  const reasons: string[] = [];
  let score = clampScore(signal.demandIndex * 0.45 + signal.marginEstimatePct * 0.55);

  if (signal.trendDirection === "rising") {
    score = clampScore(score + 10);
    reasons.push(positiveReason("Rising trend boosts ad ROI"));
  } else if (signal.trendDirection === "falling") {
    score = clampScore(score - 12);
    reasons.push(negativeReason("Falling trend reduces ad appeal"));
  }

  if (signal.marginEstimatePct >= 40) {
    reasons.push(positiveReason("Margin supports paid acquisition"));
  } else if (signal.marginEstimatePct < 20) {
    score = clampScore(score - 8);
    reasons.push(negativeReason("Thin margin limits ad spend"));
  }

  if (hasField(signal.monthlyOrdersEstimate) && signal.monthlyOrdersEstimate >= 1000) {
    score = clampScore(score + 5);
    reasons.push(positiveReason("Proven conversion volume"));
  }

  if (score >= 70) {
    reasons.unshift(positiveReason("Strong advertisement potential"));
  } else if (score < 45) {
    reasons.unshift(negativeReason("Limited ad scalability"));
  }

  return { dimension: "advertisementPotential", score: clampScore(score), weight, reasons };
}
