import type {
  SupplierEvaluationScores,
  SupplierGuardVerdict,
  SupplierOverallRecommendation,
} from "./types.js";

export type SupplierRecommendationThresholds = {
  sellTrustMin: number;
  sellReliabilityMin: number;
  sellMarginMin: number;
  rejectTrustMax: number;
  rejectFakeRiskMin: number;
  rejectReliabilityMax: number;
  rejectMarginMax: number;
};

export const DEFAULT_SUPPLIER_RECOMMENDATION_THRESHOLDS: SupplierRecommendationThresholds = {
  sellTrustMin: 72,
  sellReliabilityMin: 70,
  sellMarginMin: 35,
  rejectTrustMax: 38,
  rejectFakeRiskMin: 65,
  rejectReliabilityMax: 45,
  rejectMarginMax: 15,
};

export type SupplierRecommendationInput = {
  supplierName: string;
  scores: SupplierEvaluationScores;
  guardianVerdict: SupplierGuardVerdict;
  thresholds?: SupplierRecommendationThresholds;
};

export type SupplierRecommendationResult = {
  overallRecommendation: SupplierOverallRecommendation;
  explanation: string;
};

function buildSellExplanation(scores: SupplierEvaluationScores): string {
  const highlights: string[] = [];
  if (scores.trustScore >= 75) highlights.push(`trust ${scores.trustScore}/100`);
  if (scores.reliabilityScore >= 75) highlights.push(`reliability ${scores.reliabilityScore}/100`);
  if (scores.profitMarginEstimate >= 40) highlights.push(`margin ~${scores.profitMarginEstimate}%`);
  if (scores.shippingScore >= 70) highlights.push(`shipping ${scores.shippingScore}/100`);

  const detail = highlights.length > 0 ? highlights.join(", ") : "balanced supplier profile";
  return `SELL — supplier meets sourcing thresholds with ${detail}.`;
}

function buildRejectExplanation(scores: SupplierEvaluationScores, blockers: string[]): string {
  const detail = blockers.length > 0 ? blockers.join("; ") : "multiple risk signals";
  return `REJECT — ${detail}. Fake risk ${scores.fakeSupplierRisk}/100; trust ${scores.trustScore}/100.`;
}

function buildReviewExplanation(scores: SupplierEvaluationScores): string {
  return `REVIEW — mixed supplier signals: trust ${scores.trustScore}, quality ${scores.qualityScore}, shipping ${scores.shippingScore}, reliability ${scores.reliabilityScore}, pricing ${scores.pricingScore}, margin ~${scores.profitMarginEstimate}%. Manual validation recommended before onboarding.`;
}

/**
 * Modular recommendation engine — reusable by Brain Contract and Guardian adapters.
 * Consumes pre-computed scores and Guardian verdict; does not recalculate dimensions.
 */
export function deriveSupplierRecommendation(
  input: SupplierRecommendationInput,
): SupplierRecommendationResult {
  const thresholds = input.thresholds ?? DEFAULT_SUPPLIER_RECOMMENDATION_THRESHOLDS;
  const { scores, supplierName, guardianVerdict } = input;

  if (!guardianVerdict.allowed || guardianVerdict.recommendation === "REJECT") {
    return {
      overallRecommendation: "REJECT",
      explanation: `${supplierName}: ${guardianVerdict.reasons.join("; ") || "Guardian blocked supplier"}.`,
    };
  }

  const blockers: string[] = [];
  if (scores.fakeSupplierRisk >= thresholds.rejectFakeRiskMin) {
    blockers.push(`fake supplier risk ${scores.fakeSupplierRisk}/100`);
  }
  if (scores.trustScore <= thresholds.rejectTrustMax) {
    blockers.push(`low trust ${scores.trustScore}/100`);
  }
  if (scores.reliabilityScore <= thresholds.rejectReliabilityMax) {
    blockers.push(`poor reliability ${scores.reliabilityScore}/100`);
  }
  if (scores.profitMarginEstimate <= thresholds.rejectMarginMax) {
    blockers.push(`insufficient margin ~${scores.profitMarginEstimate}%`);
  }

  if (blockers.length > 0) {
    return {
      overallRecommendation: "REJECT",
      explanation: `${supplierName}: ${buildRejectExplanation(scores, blockers)}`,
    };
  }

  const meetsSell =
    scores.trustScore >= thresholds.sellTrustMin &&
    scores.reliabilityScore >= thresholds.sellReliabilityMin &&
    scores.profitMarginEstimate >= thresholds.sellMarginMin &&
    scores.fakeSupplierRisk < thresholds.rejectFakeRiskMin;

  if (meetsSell && guardianVerdict.flags.length === 0) {
    return {
      overallRecommendation: "SELL",
      explanation: `${supplierName}: ${buildSellExplanation(scores)}`,
    };
  }

  return {
    overallRecommendation: "REVIEW",
    explanation: `${supplierName}: ${buildReviewExplanation(scores)}`,
  };
}
