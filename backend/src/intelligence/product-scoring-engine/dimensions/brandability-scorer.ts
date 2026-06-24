import type { ProductSignal } from "../../../eye/contract/product-signal.js";
import type { DimensionScoreResult } from "../types/scoring-dimensions.js";
import { clampScore, hasField, negativeReason, positiveReason } from "./scoring-utils.js";

const GENERIC_TERMS = /\b(generic|basic|standard|universal|multi-purpose)\b/i;
const BRANDABLE_CATEGORIES =
  /beauty|wellness|fitness|kitchen|home decor|pet|outdoor|accessories|jewelry/i;

export function scoreBrandability(signal: ProductSignal, weight: number): DimensionScoreResult {
  const reasons: string[] = [];
  let score = 55;

  const titleWords = signal.productTitle.split(/\s+/).filter(Boolean);
  if (titleWords.length <= 4) {
    score += 8;
    reasons.push(positiveReason("Concise, brandable product name"));
  } else if (titleWords.length >= 10) {
    score -= 8;
    reasons.push(negativeReason("Long generic product title"));
  }

  if (GENERIC_TERMS.test(signal.productTitle)) {
    score -= 12;
    reasons.push(negativeReason("Generic positioning"));
  } else {
    score += 6;
    reasons.push(positiveReason("Distinct product positioning"));
  }

  if (BRANDABLE_CATEGORIES.test(signal.category)) {
    score += 10;
    reasons.push(positiveReason("Brand-friendly category"));
  }

  if (hasField(signal.avgRating) && signal.avgRating >= 4.2) {
    score += 5;
    reasons.push(positiveReason("Strong customer perception"));
  }

  return {
    dimension: "brandability",
    score: clampScore(score),
    weight,
    reasons,
  };
}
