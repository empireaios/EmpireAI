import type { SupplierRecord } from "../supplier-types.js";

export type SupplierOverallRecommendation = "SELL" | "REVIEW" | "REJECT";

export type SupplierCatalogRecord = SupplierRecord & {
  qualityIndex: number;
  defectRatePct: number;
  verified: boolean;
  yearsActive: number;
  suspiciousNamePattern?: boolean;
  benchmarkUnitCostCents: number;
};

export type SupplierEvaluationInput = {
  supplierId: string;
  workspaceId?: string;
  sellingPriceCents?: number;
  productCategory?: string;
  signals?: {
    quality?: number;
    shipping?: number;
    reliability?: number;
    pricing?: number;
  };
};

export type SupplierEvaluationScores = {
  trustScore: number;
  qualityScore: number;
  shippingScore: number;
  reliabilityScore: number;
  pricingScore: number;
  profitMarginEstimate: number;
  fakeSupplierRisk: number;
};

export type SupplierGuardFlag =
  | "fake_supplier_risk"
  | "low_trust_score"
  | "unverified_supplier"
  | "poor_reliability";

export type SupplierGuardVerdict = {
  allowed: boolean;
  recommendation: SupplierOverallRecommendation;
  flags: SupplierGuardFlag[];
  reasons: string[];
  auditedAt: string;
};

export type SupplierEvaluation = SupplierEvaluationScores & {
  supplierId: string;
  supplierName: string;
  overallRecommendation: SupplierOverallRecommendation;
  explanation: string;
  confidence: number;
  guardianVerdict: SupplierGuardVerdict;
  evaluatedAt: string;
};

export type SupplierComparison = {
  workspaceId: string;
  supplierIds: string[];
  evaluations: SupplierEvaluation[];
  ranking: string[];
  bestSupplierId: string | null;
  explanation: string;
  comparedAt: string;
};

export type SupplierDiscoveryFilters = {
  region?: string;
  maxShipDays?: number;
  minReliability?: number;
  minProductCount?: number;
  excludeFakeRiskAbove?: number;
};

export type SupplierDiscoveryResult = {
  workspaceId: string;
  filters: SupplierDiscoveryFilters;
  suppliers: SupplierCatalogRecord[];
  count: number;
  discoveredAt: string;
};

export const SIE_EVALUATION_WEIGHTS: Record<
  keyof Pick<
    SupplierEvaluationScores,
    "qualityScore" | "shippingScore" | "reliabilityScore" | "pricingScore"
  >,
  number
> = {
  qualityScore: 0.25,
  shippingScore: 0.2,
  reliabilityScore: 0.3,
  pricingScore: 0.25,
};
