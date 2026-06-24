import type { ProductSignal } from "../../../eye/contract/product-signal.js";
import type { DimensionScoreResult } from "../types/scoring-dimensions.js";
import { clampScore, hasField, negativeReason, positiveReason } from "./scoring-utils.js";

/** Inverts raw competition index — lower market crowding yields a higher score. */
export function scoreCompetition(signal: ProductSignal, weight: number): DimensionScoreResult {
  const reasons: string[] = [];
  const score = clampScore(100 - signal.competitionIndex);

  if (signal.competitionIndex <= 25) {
    reasons.push(positiveReason("Low competition"));
  } else if (signal.competitionIndex <= 45) {
    reasons.push(positiveReason("Manageable competition"));
  } else if (signal.competitionIndex <= 65) {
    reasons.push(negativeReason("Moderate competition"));
  } else {
    reasons.push(negativeReason("High competition"));
  }

  if (hasField(signal.listingCount)) {
    if (signal.listingCount <= 50) {
      reasons.push(positiveReason("Few competing listings"));
    } else if (signal.listingCount >= 500) {
      reasons.push(negativeReason("Crowded listing landscape"));
    }
  }

  return { dimension: "competition", score, weight, reasons };
}
