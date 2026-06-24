import type { ProductSignal } from "../../../eye/contract/product-signal.js";
import type { DimensionScoreResult } from "../types/scoring-dimensions.js";
import {
  clampScore,
  hasField,
  negativeReason,
  positiveReason,
  providerTrustHint,
} from "./scoring-utils.js";

export function scoreSupplierTrust(signal: ProductSignal, weight: number): DimensionScoreResult {
  const reasons: string[] = [];
  let score = 50 + providerTrustHint(signal);

  if (signal.confidence >= 70) {
    score = clampScore(score + 15);
    reasons.push(positiveReason("High signal confidence"));
  } else if (signal.confidence >= 45) {
    score = clampScore(score + 5);
  } else {
    score = clampScore(score - 10);
    reasons.push(negativeReason("Limited supplier signal confidence"));
  }

  if (signal.mock) {
    score = clampScore(score - 12);
    reasons.push(negativeReason("Mock supplier data"));
  } else {
    score = clampScore(score + 8);
    reasons.push(positiveReason("Live supplier feed"));
  }

  if (hasField(signal.avgRating)) {
    if (signal.avgRating >= 4.3) {
      score = clampScore(score + 8);
      reasons.push(positiveReason("Trusted supplier quality signals"));
    } else if (signal.avgRating < 3.5) {
      score = clampScore(score - 8);
      reasons.push(negativeReason("Below-average quality signals"));
    }
  }

  if (score >= 70) {
    reasons.unshift(positiveReason("Trusted supplier"));
  } else if (score < 45) {
    reasons.unshift(negativeReason("Supplier trust concerns"));
  }

  return { dimension: "supplierTrust", score: clampScore(score), weight, reasons };
}
