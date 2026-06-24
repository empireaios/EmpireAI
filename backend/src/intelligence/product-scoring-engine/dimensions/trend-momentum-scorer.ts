import type { ProductSignal } from "../../../eye/contract/product-signal.js";
import type { DimensionScoreResult } from "../types/scoring-dimensions.js";
import { clampScore, negativeReason, positiveReason } from "./scoring-utils.js";

export function scoreTrendMomentum(signal: ProductSignal, weight: number): DimensionScoreResult {
  const reasons: string[] = [];
  let score = 50;

  if (signal.trendDirection === "rising") {
    score = clampScore(78 + signal.demandIndex * 0.15);
    reasons.push(positiveReason("Upward trend momentum"));
  } else if (signal.trendDirection === "stable") {
    score = clampScore(55 + signal.demandIndex * 0.2);
    reasons.push(positiveReason("Stable trend"));
  } else {
    score = clampScore(35 - (100 - signal.demandIndex) * 0.1);
    reasons.push(negativeReason("Declining trend momentum"));
  }

  if (signal.demandIndex >= 70 && signal.trendDirection !== "falling") {
    reasons.push(positiveReason("Demand supports momentum"));
  }

  return { dimension: "trendMomentum", score: clampScore(score), weight, reasons };
}
