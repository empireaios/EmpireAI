import type {
  ProductIntelligenceRecommendation,
  ProductIntelligenceScores,
} from "./types.js";

export type RecommendationThresholds = {
  sellOverallMin: number;
  sellDemandMin: number;
  sellMarginMin: number;
  sellSupplierMin: number;
  rejectOverallMax: number;
  rejectDemandMax: number;
  rejectMarginMax: number;
  rejectSupplierMax: number;
};

export const DEFAULT_RECOMMENDATION_THRESHOLDS: RecommendationThresholds = {
  sellOverallMin: 72,
  sellDemandMin: 62,
  sellMarginMin: 55,
  sellSupplierMin: 60,
  rejectOverallMax: 42,
  rejectDemandMax: 28,
  rejectMarginMax: 28,
  rejectSupplierMax: 35,
};

export type RecommendationInput = {
  scores: ProductIntelligenceScores;
  overallScore: number;
  confidence: number;
  productTitle: string;
  thresholds?: RecommendationThresholds;
};

export type RecommendationResult = {
  recommendation: ProductIntelligenceRecommendation;
  explanation: string;
};

function buildSellExplanation(scores: ProductIntelligenceScores, overallScore: number): string {
  const highlights: string[] = [];
  if (scores.demandScore >= 70) highlights.push(`strong demand (${scores.demandScore}/100)`);
  if (scores.marginScore >= 65) highlights.push(`healthy margin (${scores.marginScore}/100)`);
  if (scores.competitionScore >= 60) highlights.push(`favorable competition (${scores.competitionScore}/100)`);
  if (scores.supplierReliability >= 75) highlights.push(`reliable supplier (${scores.supplierReliability}/100)`);

  const detail = highlights.length > 0 ? highlights.join(", ") : "balanced dimension scores";
  return `SELL — overall ${overallScore}/100 with ${detail}. Product meets sell thresholds across demand, margin, and supplier reliability.`;
}

function buildRejectExplanation(scores: ProductIntelligenceScores, overallScore: number): string {
  const blockers: string[] = [];
  if (scores.demandScore < DEFAULT_RECOMMENDATION_THRESHOLDS.rejectDemandMax) {
    blockers.push(`weak demand (${scores.demandScore}/100)`);
  }
  if (scores.marginScore < DEFAULT_RECOMMENDATION_THRESHOLDS.rejectMarginMax) {
    blockers.push(`insufficient margin (${scores.marginScore}/100)`);
  }
  if (scores.supplierReliability < DEFAULT_RECOMMENDATION_THRESHOLDS.rejectSupplierMax) {
    blockers.push(`unreliable supplier (${scores.supplierReliability}/100)`);
  }
  if (overallScore < DEFAULT_RECOMMENDATION_THRESHOLDS.rejectOverallMax) {
    blockers.push(`low composite score (${overallScore}/100)`);
  }

  const detail = blockers.length > 0 ? blockers.join("; ") : "multiple risk signals";
  return `DO_NOT_SELL — ${detail}. Risk profile exceeds acceptable thresholds for listing.`;
}

function buildReviewExplanation(scores: ProductIntelligenceScores, overallScore: number): string {
  return `REVIEW — overall ${overallScore}/100 with mixed signals: demand ${scores.demandScore}, margin ${scores.marginScore}, competition ${scores.competitionScore}, shipping ${scores.shippingScore}, supplier ${scores.supplierReliability}. Manual validation recommended before committing inventory or ad spend.`;
}

/**
 * Modular recommendation engine — reusable by future AI employees.
 * Consumes pre-computed dimension scores; does not recalculate them.
 */
export function deriveRecommendation(input: RecommendationInput): RecommendationResult {
  const thresholds = input.thresholds ?? DEFAULT_RECOMMENDATION_THRESHOLDS;
  const { scores, overallScore, productTitle } = input;

  const meetsSell =
    overallScore >= thresholds.sellOverallMin &&
    scores.demandScore >= thresholds.sellDemandMin &&
    scores.marginScore >= thresholds.sellMarginMin &&
    scores.supplierReliability >= thresholds.sellSupplierMin;

  const meetsReject =
    overallScore <= thresholds.rejectOverallMax ||
    scores.demandScore <= thresholds.rejectDemandMax ||
    scores.marginScore <= thresholds.rejectMarginMax ||
    scores.supplierReliability <= thresholds.rejectSupplierMax;

  if (meetsSell && !meetsReject) {
    return {
      recommendation: "SELL",
      explanation: `${productTitle}: ${buildSellExplanation(scores, overallScore)}`,
    };
  }

  if (meetsReject) {
    return {
      recommendation: "DO_NOT_SELL",
      explanation: `${productTitle}: ${buildRejectExplanation(scores, overallScore)}`,
    };
  }

  return {
    recommendation: "REVIEW",
    explanation: `${productTitle}: ${buildReviewExplanation(scores, overallScore)}`,
  };
}
