import type { SupplierProduct } from "../models/supplier-product.js";
import type { SupplierScoreResult, SupplierScoreDimension } from "../models/supplier-scoring.js";
import { SUPPLIER_SCORE_WEIGHTS } from "../models/supplier-scoring.js";

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scoreShippingTime(product: SupplierProduct): number {
  const max = product.shippingDaysMax ?? product.shippingDaysMin ?? 14;
  if (max <= 7) return 95;
  if (max <= 12) return 80;
  if (max <= 18) return 65;
  if (max <= 25) return 50;
  return 35;
}

function scoreProcessingTime(product: SupplierProduct): number {
  const days = product.processingDays ?? 3;
  if (days <= 2) return 90;
  if (days <= 5) return 75;
  if (days <= 8) return 55;
  return 40;
}

function scoreCost(product: SupplierProduct): number {
  if (product.costPrice <= 15) return 85;
  if (product.costPrice <= 35) return 75;
  if (product.costPrice <= 60) return 60;
  return 45;
}

function scoreMargin(product: SupplierProduct): number {
  const retail = product.suggestedRetailPrice ?? product.costPrice * 2.5;
  const margin = ((retail - product.costPrice) / retail) * 100;
  if (margin >= 55) return 95;
  if (margin >= 40) return 80;
  if (margin >= 25) return 60;
  return 35;
}

function scoreInventory(product: SupplierProduct): number {
  if (product.inventory >= 500) return 90;
  if (product.inventory >= 100) return 75;
  if (product.inventory >= 20) return 55;
  if (product.inventory > 0) return 40;
  return 20;
}

function scoreCountryCoverage(product: SupplierProduct): number {
  const count = product.shippingCountries.length;
  if (count >= 8) return 95;
  if (count >= 4) return 75;
  if (count >= 2) return 55;
  if (count === 1) return 40;
  return 25;
}

function scoreQualityRisk(product: SupplierProduct): number {
  const rating = product.supplierRating ?? 3.5;
  return clamp(rating * 20);
}

function scoreRefundRisk(product: SupplierProduct): number {
  const rating = product.supplierRating ?? 3.5;
  const shipping = product.shippingDaysMax ?? 14;
  return clamp(100 - (shipping > 20 ? 25 : 0) - (rating < 3 ? 30 : rating < 4 ? 10 : 0));
}

function scoreReliability(product: SupplierProduct): number {
  const rating = product.supplierRating ?? 3.5;
  const inv = product.inventory > 50 ? 10 : 0;
  return clamp(rating * 18 + inv);
}

function scoreScale(product: SupplierProduct): number {
  const inv = product.inventory;
  const variants = product.variants.length;
  return clamp(40 + Math.min(inv / 10, 40) + variants * 5);
}

const SCORERS: Record<SupplierScoreDimension, (p: SupplierProduct) => number> = {
  shippingTime: scoreShippingTime,
  processingTime: scoreProcessingTime,
  cost: scoreCost,
  marginPotential: scoreMargin,
  inventoryStability: scoreInventory,
  countryCoverage: scoreCountryCoverage,
  qualityRisk: scoreQualityRisk,
  refundRisk: scoreRefundRisk,
  supplierReliability: scoreReliability,
  scalePotential: scoreScale,
};

/** SUP-004 — Supplier scoring engine. */
export function scoreSupplierProduct(product: SupplierProduct): SupplierScoreResult {
  const breakdown = (Object.keys(SCORERS) as SupplierScoreDimension[]).map((dimension) => {
    const score = SCORERS[dimension](product);
    const weight = SUPPLIER_SCORE_WEIGHTS[dimension];
    return {
      dimension,
      score,
      weight,
      rationale: `${dimension}: ${score}/100 (weight ${Math.round(weight * 100)}%)`,
    };
  });

  const overallScore = clamp(
    breakdown.reduce((sum, b) => sum + b.score * b.weight, 0) / breakdown.reduce((s, b) => s + b.weight, 0),
  );

  let recommendation: SupplierScoreResult["recommendation"] = "REVIEW";
  if (overallScore >= 75) recommendation = "LAUNCH";
  else if (overallScore >= 55) recommendation = "REVIEW";
  else if (overallScore >= 40) recommendation = "HOLD";
  else recommendation = "REJECT";

  return {
    providerId: product.providerId,
    supplierProductId: product.supplierProductId,
    overallScore,
    recommendation,
    breakdown,
    computedAt: new Date().toISOString(),
  };
}
