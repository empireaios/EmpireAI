import type { ProductSignal } from "../../../eye/contract/product-signal.js";
import type { DimensionScoreResult } from "../types/scoring-dimensions.js";
import {
  categoryShippingFactor,
  clampScore,
  hasField,
  negativeReason,
  positiveReason,
} from "./scoring-utils.js";

export function scoreShipping(signal: ProductSignal, weight: number): DimensionScoreResult {
  const reasons: string[] = [];
  let score = 65 + categoryShippingFactor(signal.category);

  if (hasField(signal.estimatedSellingPriceCents)) {
    const priceUsd = signal.estimatedSellingPriceCents / 100;
    if (priceUsd >= 75) {
      score = clampScore(score + 10);
      reasons.push(positiveReason("Price absorbs shipping costs well"));
    } else if (priceUsd < 20) {
      score = clampScore(score - 12);
      reasons.push(negativeReason("Low price limits shipping margin"));
    }
  }

  if (signal.marginEstimatePct >= 40) {
    score = clampScore(score + 5);
    reasons.push(positiveReason("Margin supports fulfillment"));
  }

  if (score >= 75) {
    reasons.unshift(positiveReason("Favorable shipping profile"));
  } else if (score >= 55) {
    reasons.unshift(positiveReason("Acceptable shipping economics"));
  } else if (score < 45) {
    reasons.unshift(negativeReason("Shipping cost pressure"));
  } else {
    reasons.unshift(negativeReason("Slight shipping delay"));
  }

  return { dimension: "shipping", score: clampScore(score), weight, reasons };
}
