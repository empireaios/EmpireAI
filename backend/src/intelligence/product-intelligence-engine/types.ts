/** Raw competition intensity supplied by upstream signals (higher = more crowded market). */
export type RawCompetitionScore = number;

export type ProductSupplierData = {
  supplierId?: string;
  name: string;
  region: string;
  reliabilityScore: number;
  avgShipDays: number;
  defectRatePct?: number;
};

export type HistoricalDemand = {
  searchVolumeIndex: number;
  trendDirection: "rising" | "stable" | "falling";
  monthlyOrdersEstimate?: number;
  seasonalityIndex?: number;
};

export type ProductIntelligenceInput = {
  productTitle: string;
  category: string;
  supplierData: ProductSupplierData;
  purchasePriceCents: number;
  estimatedSellingPriceCents: number;
  shippingCostCents: number;
  historicalDemand: HistoricalDemand;
  /** Raw competition intensity 0–100 (higher = more competition). */
  competitionScore: RawCompetitionScore;
  workspaceId?: string;
  productId?: string;
};

export type ProductIntelligenceRecommendation = "SELL" | "DO_NOT_SELL" | "REVIEW";

export type ProductIntelligenceScores = {
  demandScore: number;
  /** Empire-friendly competition score (higher = less competition / better opportunity). */
  competitionScore: number;
  marginScore: number;
  shippingScore: number;
  supplierReliability: number;
};

export type ProductIntelligenceEvaluation = ProductIntelligenceScores & {
  overallScore: number;
  recommendation: ProductIntelligenceRecommendation;
  explanation: string;
  confidence: number;
  productTitle: string;
  category: string;
  evaluatedAt: string;
};

export const PIE_EVALUATION_WEIGHTS: Record<keyof ProductIntelligenceScores, number> = {
  demandScore: 0.25,
  competitionScore: 0.15,
  marginScore: 0.25,
  shippingScore: 0.15,
  supplierReliability: 0.2,
};
