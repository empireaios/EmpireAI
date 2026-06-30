import type { ProductScoutEvaluation } from "../../../intelligence/product-scout/types.js";
import { discoverSuppliers, evaluateSupplier } from "../../../intelligence/supplier-intelligence-engine/index.js";
import type { ProductRecommendation } from "../models/ecommerce-os-workflow.js";

function invertScore(value: number): number {
  return Math.max(0, Math.min(100, 100 - value));
}

/** Maps Product Scout evaluation dimensions to Grand King ranking criteria. */
export function mapScoutToRecommendation(
  evaluation: ProductScoutEvaluation,
  category: string,
): ProductRecommendation {
  const expectedRoi = Math.round(
    evaluation.marginScore * 0.45 +
      evaluation.demandScore * 0.35 +
      invertScore(evaluation.adDifficultyScore) * 0.2,
  );
  const repeatPurchasePotential = Math.round(
    evaluation.demandScore * 0.4 +
      invertScore(evaluation.refundRiskScore) * 0.35 +
      evaluation.trendScore * 0.25,
  );
  const compositeRank = Math.round(
    evaluation.finalEmpireScore * 0.35 +
      expectedRoi * 0.2 +
      evaluation.marginScore * 0.15 +
      evaluation.supplierReliabilityScore * 0.1 +
      evaluation.shippingScore * 0.1 +
      repeatPurchasePotential * 0.05 +
      evaluation.brandabilityScore * 0.05,
  );

  const suppliers = discoverSuppliers(evaluation.workspaceId, { minReliability: 70 });
  const preferredSupplier =
    suppliers.suppliers.find((s) => s.name.toLowerCase().includes("cj")) ??
    suppliers.suppliers[0];

  return {
    productId: evaluation.productId ?? `prod-${evaluation.productName}`,
    productName: evaluation.productName,
    category,
    dominationScore: evaluation.finalEmpireScore,
    expectedRoi,
    margin: evaluation.marginScore,
    supplierConfidence: evaluation.supplierReliabilityScore,
    shippingConfidence: evaluation.shippingScore,
    repeatPurchasePotential,
    brandingPotential: evaluation.brandabilityScore,
    compositeRank,
    recommendation: evaluation.recommendation,
    rationale: evaluation.why,
    supplierId: preferredSupplier?.id ?? "cj-dropshipping",
  };
}

export function rankRecommendations(recommendations: ProductRecommendation[]): ProductRecommendation[] {
  return [...recommendations].sort((a, b) => b.compositeRank - a.compositeRank);
}

export function resolveSupplierConfidence(workspaceId: string, supplierId: string): number {
  try {
    const evaluation = evaluateSupplier({ workspaceId, supplierId });
    return Math.round(evaluation.reliabilityScore ?? evaluation.trustScore ?? 70);
  } catch {
    return 0;
  }
}
