import type { ProductOpportunity } from "../../product-opportunity/models/product-opportunity.js";
import type { SupplierProfile } from "../../supplier-intelligence/models/supplier-profile.js";
import {
  resolveSupplierMatchTier,
  type SupplierMatchTier,
} from "../models/supplier-opportunity-match.js";
import type { SupplierMatchSignal, SupplierMatchSignalType } from "../models/supplier-match-signal.js";

export const SUPPLIER_OPPORTUNITY_SIGNAL_WEIGHTS: Record<SupplierMatchSignalType, number> = {
  supplier_trust: 0.2,
  supplier_risk: 0.15,
  category_alignment: 0.15,
  dropshipping_support: 0.1,
  branding_support: 0.1,
  fulfillment_capability: 0.1,
  opportunity_fit: 0.1,
  confidence: 0.1,
};

export type SupplierOpportunityScoreBreakdown = {
  matchScore: number;
  matchTier: SupplierMatchTier;
  confidence: number;
  strengths: string[];
  weaknesses: string[];
  recommendedUse: string;
  signals: SupplierMatchSignal[];
};

export type SupplierOpportunityMatchInput = {
  opportunity: ProductOpportunity;
  supplier: SupplierProfile;
  productCategories?: string[];
};

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function tokenize(value: string): string[] {
  return normalizeToken(value)
    .split(" ")
    .filter((token) => token.length > 1);
}

function uniqueTokens(values: string[]): string[] {
  return [...new Set(values.flatMap((value) => tokenize(value)))];
}

function overlapRatio(left: string[], right: string[]): number {
  if (left.length === 0 || right.length === 0) return 0;
  const rightSet = new Set(right);
  const overlap = left.filter((token) => rightSet.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return union === 0 ? 0 : overlap / union;
}

function buildSignal(
  signalType: SupplierMatchSignalType,
  score: number,
  detail: string,
): SupplierMatchSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: SUPPLIER_OPPORTUNITY_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function averageRisk(supplier: SupplierProfile): number {
  const risk = supplier.riskProfile;
  return (risk.disputeRisk + risk.shippingRisk + risk.qualityRisk + risk.fraudRisk) / 4;
}

function scoreCategoryAlignment(
  supplier: SupplierProfile,
  opportunity: ProductOpportunity,
  productCategories: string[] = [],
): SupplierMatchSignal {
  const supplierTokens = uniqueTokens(supplier.categories);
  const opportunityTokens = uniqueTokens([
    ...opportunity.strengths,
    ...opportunity.weaknesses,
    ...opportunity.recommendedChannels,
    ...productCategories,
  ]);
  const ratio = overlapRatio(supplierTokens, opportunityTokens);
  const score = clampScore(ratio * 100);
  return buildSignal(
    "category_alignment",
    score,
    `Category overlap ${Math.round(ratio * 100)}% between supplier and opportunity context`,
  );
}

function buildStrengthsAndWeaknesses(signals: SupplierMatchSignal[]): {
  strengths: string[];
  weaknesses: string[];
} {
  const sorted = [...signals].sort((left, right) => right.score - left.score);
  const strengths = sorted
    .filter((signal) => signal.score >= 60)
    .slice(0, 3)
    .map((signal) => `${signal.signalType.replace(/_/g, " ")}: ${signal.detail}`);
  const weaknesses = sorted
    .filter((signal) => signal.score < 50)
    .slice(-2)
    .map((signal) => `${signal.signalType.replace(/_/g, " ")}: ${signal.detail}`);

  return {
    strengths: strengths.length > 0 ? strengths : ["Balanced supplier fit for this opportunity"],
    weaknesses: weaknesses.length > 0 ? weaknesses : ["No major supplier gaps detected"],
  };
}

function resolveRecommendedUse(matchScore: number, supplier: SupplierProfile): string {
  if (matchScore >= 75 && supplier.trustScore >= 70) {
    return "primary fulfillment partner";
  }
  if (matchScore >= 45) {
    return "secondary or test-order supplier";
  }
  return "avoid for this opportunity";
}

/** Scores supplier fit for a product opportunity using M027 and M028 intelligence. */
export function scoreSupplierOpportunityMatch(
  input: SupplierOpportunityMatchInput,
): SupplierOpportunityScoreBreakdown {
  const { opportunity, supplier, productCategories = [] } = input;
  const riskAverage = averageRisk(supplier);
  const supplierRiskScore = clampScore(100 - riskAverage);

  const confidenceScore = clampScore(
    supplier.trustScore * 0.35 +
      supplierRiskScore * 0.25 +
      opportunity.confidence * 0.25 +
      opportunity.opportunityScore * 0.15,
  );

  const signals = [
    buildSignal(
      "supplier_trust",
      supplier.trustScore,
      `Supplier trust score ${supplier.trustScore}`,
    ),
    buildSignal(
      "supplier_risk",
      supplierRiskScore,
      `Inverse risk score ${supplierRiskScore} (${supplier.riskProfile.riskLevel} risk)`,
    ),
    scoreCategoryAlignment(supplier, opportunity, productCategories),
    buildSignal(
      "dropshipping_support",
      supplier.capability.supportsDropshipping ? 95 : 20,
      supplier.capability.supportsDropshipping
        ? "Supports dropshipping"
        : "Does not support dropshipping",
    ),
    buildSignal(
      "branding_support",
      supplier.capability.supportsBranding ? 90 : 25,
      supplier.capability.supportsBranding ? "Supports branding" : "No branding support",
    ),
    buildSignal(
      "fulfillment_capability",
      supplier.fulfillmentScore,
      `Fulfillment capability score ${supplier.fulfillmentScore}`,
    ),
    buildSignal(
      "opportunity_fit",
      opportunity.opportunityScore,
      `Opportunity score ${opportunity.opportunityScore} (${opportunity.opportunityTier})`,
    ),
    buildSignal("confidence", confidenceScore, `Blended confidence score ${confidenceScore}`),
  ];

  const matchScore = clampScore(
    signals.reduce((total, signal) => total + signal.score * signal.weight, 0),
  );
  const matchTier = resolveSupplierMatchTier(matchScore);
  const { strengths, weaknesses } = buildStrengthsAndWeaknesses(signals);

  return {
    matchScore,
    matchTier,
    confidence: confidenceScore,
    strengths,
    weaknesses,
    recommendedUse: resolveRecommendedUse(matchScore, supplier),
    signals,
  };
}

export const supplierOpportunityScoring = {
  scoreSupplierOpportunityMatch,
  weights: SUPPLIER_OPPORTUNITY_SIGNAL_WEIGHTS,
};
