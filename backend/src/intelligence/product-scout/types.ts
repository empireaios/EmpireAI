import type { PieScoreDimension } from "../types.js";

export type ProductScoutRecommendation = "APPROVE" | "REVIEW" | "REJECT";

export type ProductScoutGuardFlag =
  | "extreme_refund_risk"
  | "poor_supplier_reliability"
  | "low_margin"
  | "high_ad_difficulty";

export type ProductScoutGuardVerdict = {
  allowed: boolean;
  recommendation: ProductScoutRecommendation;
  flags: ProductScoutGuardFlag[];
  reasons: string[];
  auditedAt: string;
};

export type ProductScoutScoreInput = {
  workspaceId: string;
  productId?: string;
  productName: string;
  signals?: Partial<
    Record<
      PieScoreDimension | "trend" | "brandability",
      { score: number; evidence?: string[] }
    >
  >;
};

export type ProductScoutEvaluation = {
  productId?: string;
  productName: string;
  workspaceId: string;
  demandScore: number;
  competitionScore: number;
  marginScore: number;
  shippingScore: number;
  supplierReliabilityScore: number;
  adDifficultyScore: number;
  refundRiskScore: number;
  trendScore: number;
  brandabilityScore: number;
  confidenceScore: number;
  finalEmpireScore: number;
  recommendation: ProductScoutRecommendation;
  explanation: string;
  why: string[];
  guardianVerdict: ProductScoutGuardVerdict;
  evaluatedAt: string;
};

export type ProductScoutPortfolioScan = {
  workspaceId: string;
  scannedCount: number;
  topPick?: ProductScoutEvaluation;
  evaluations: ProductScoutEvaluation[];
  scannedAt: string;
};

export const SCOUT_EMPIRE_WEIGHTS = {
  demand: 0.16,
  competition: 0.1,
  margin: 0.18,
  shipping: 0.1,
  supplierReliability: 0.14,
  adDifficulty: 0.08,
  refundRisk: 0.1,
  trend: 0.08,
  brandability: 0.06,
} as const;
