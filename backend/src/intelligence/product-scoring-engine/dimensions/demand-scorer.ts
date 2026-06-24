import type { ProductSignal } from "../../../eye/contract/product-signal.js";
import type { DimensionScoreResult } from "../types/scoring-dimensions.js";
import { clampScore, hasField, negativeReason, positiveReason } from "./scoring-utils.js";

export function scoreDemand(signal: ProductSignal, weight: number): DimensionScoreResult {
  const reasons: string[] = [];
  let score = clampScore(signal.demandIndex);

  if (signal.demandIndex >= 75) {
    reasons.push(positiveReason("High demand"));
  } else if (signal.demandIndex >= 55) {
    reasons.push(positiveReason("Solid demand"));
  } else if (signal.demandIndex >= 35) {
    reasons.push(negativeReason("Moderate demand"));
  } else {
    reasons.push(negativeReason("Weak demand"));
  }

  if (hasField(signal.monthlyOrdersEstimate)) {
    if (signal.monthlyOrdersEstimate >= 2000) {
      score = clampScore(score + 8);
      reasons.push(positiveReason("Strong monthly order volume"));
    } else if (signal.monthlyOrdersEstimate >= 500) {
      score = clampScore(score + 3);
    } else if (signal.monthlyOrdersEstimate < 100) {
      score = clampScore(score - 5);
      reasons.push(negativeReason("Low monthly order volume"));
    }
  }

  return { dimension: "demand", score, weight, reasons };
}
