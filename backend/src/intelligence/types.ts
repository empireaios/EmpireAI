export type PieScoreDimension =
  | "demand"
  | "competition"
  | "margin"
  | "shipping"
  | "supplierReliability"
  | "adDifficulty"
  | "refundRisk";

export type PieRecommendation = "strong_buy" | "buy" | "watch" | "avoid" | "reject";

export type PieDimensionScore = {
  dimension: PieScoreDimension;
  score: number;
  weight: number;
  rationale: string;
  evidence: string[];
};

export type ProductIntelligenceScore = {
  productId?: string;
  productName: string;
  workspaceId: string;
  dimensions: PieDimensionScore[];
  compositeScore: number;
  confidence: number;
  recommendation: PieRecommendation;
  summary: string;
  why: string[];
  scoredAt: string;
};

export const PIE_DIMENSION_WEIGHTS: Record<PieScoreDimension, number> = {
  demand: 0.2,
  competition: 0.12,
  margin: 0.2,
  shipping: 0.12,
  supplierReliability: 0.14,
  adDifficulty: 0.1,
  refundRisk: 0.12,
};

export const PIE_DIMENSION_LABELS: Record<PieScoreDimension, string> = {
  demand: "Demand",
  competition: "Competition",
  margin: "Margin",
  shipping: "Shipping",
  supplierReliability: "Supplier Reliability",
  adDifficulty: "Ad Difficulty",
  refundRisk: "Refund Risk",
};
