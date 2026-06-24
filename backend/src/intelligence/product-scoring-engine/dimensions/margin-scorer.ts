import type { ProductSignal } from "../../../eye/contract/product-signal.js";
import type { DimensionScoreResult } from "../types/scoring-dimensions.js";
import { clampScore, negativeReason, positiveReason } from "./scoring-utils.js";

export function scoreMargin(signal: ProductSignal, weight: number): DimensionScoreResult {
  const reasons: string[] = [];
  const margin = signal.marginEstimatePct;
  let score: number;

  if (margin >= 55) {
    score = clampScore(88 + (margin - 55) * 0.4);
    reasons.push(positiveReason("Excellent gross margin"));
  } else if (margin >= 40) {
    score = clampScore(70 + (margin - 40) * 1.2);
    reasons.push(positiveReason("Strong gross margin"));
  } else if (margin >= 25) {
    score = clampScore(50 + (margin - 25) * 1.3);
    reasons.push(positiveReason("Acceptable margin"));
  } else if (margin >= 15) {
    score = clampScore(30 + (margin - 15) * 2);
    reasons.push(negativeReason("Thin margin"));
  } else {
    score = clampScore(Math.max(5, margin * 2));
    reasons.push(negativeReason("Very thin margin"));
  }

  return { dimension: "margin", score, weight, reasons };
}
