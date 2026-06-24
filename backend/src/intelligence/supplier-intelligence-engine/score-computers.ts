import type { SupplierCatalogRecord } from "./types.js";
import type { SupplierEvaluationInput, SupplierEvaluationScores } from "./types.js";

function clamp(score: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(score)));
}

/** Quality score from catalog depth, defect rate, and quality index — independent dimension. */
export function computeQualityScore(supplier: SupplierCatalogRecord): number {
  const catalogDepth = clamp(Math.min(100, supplier.productCount / 12));
  const defectPenalty = Math.min(35, supplier.defectRatePct * 2.5);
  const qualityComponent = clamp(supplier.qualityIndex);
  const verifiedBonus = supplier.verified ? 8 : -12;

  return clamp(catalogDepth * 0.25 + qualityComponent * 0.55 + verifiedBonus - defectPenalty);
}

/** Shipping speed score — lower ship days yield higher scores. */
export function computeShippingScore(supplier: SupplierCatalogRecord): number {
  const days = supplier.avgShipDays;
  if (days <= 5) return 95;
  if (days <= 8) return 85;
  if (days <= 12) return 72;
  if (days <= 18) return 55;
  if (days <= 25) return 38;
  return 20;
}

/** Reliability score from historical fulfillment signals. */
export function computeReliabilityScore(supplier: SupplierCatalogRecord): number {
  const tenureBonus = clamp(supplier.yearsActive * 4, 0, 20);
  const verifiedBonus = supplier.verified ? 6 : -15;
  return clamp(supplier.reliabilityScore + tenureBonus + verifiedBonus);
}

/** Pricing competitiveness vs benchmark unit cost. */
export function computePricingScore(supplier: SupplierCatalogRecord): number {
  if (supplier.benchmarkUnitCostCents <= 0) return 50;

  const ratio = supplier.avgUnitCostCents / supplier.benchmarkUnitCostCents;
  if (ratio <= 0.75) return 92;
  if (ratio <= 0.9) return 82;
  if (ratio <= 1.05) return 70;
  if (ratio <= 1.2) return 52;
  if (ratio <= 1.4) return 35;
  return 18;
}

/** Expected profit margin percentage given selling price or category default. */
export function computeProfitMarginEstimate(
  supplier: SupplierCatalogRecord,
  sellingPriceCents?: number,
): number {
  const sellPrice = sellingPriceCents ?? Math.round(supplier.avgUnitCostCents * 3.2);
  if (sellPrice <= 0) return 0;

  const shippingPerOrderCents = Math.round(supplier.avgShipDays * 45);
  const totalCostCents = supplier.avgUnitCostCents + shippingPerOrderCents;
  const marginPct = ((sellPrice - totalCostCents) / sellPrice) * 100;

  return clamp(marginPct, -50, 95);
}

/** Fake supplier risk from verification, naming, connector, and cost anomalies. */
export function computeFakeSupplierRisk(supplier: SupplierCatalogRecord): number {
  let risk = 0;

  if (!supplier.verified) risk += 28;
  if (supplier.suspiciousNamePattern) risk += 22;
  if (!supplier.connectorId || supplier.connectorId === "unknown-marketplace") risk += 18;
  if (supplier.productCount < 20) risk += 15;
  if (supplier.yearsActive < 1) risk += 12;
  if (supplier.region === "XX") risk += 20;

  const costRatio = supplier.benchmarkUnitCostCents / Math.max(supplier.avgUnitCostCents, 1);
  if (costRatio >= 4) risk += 18;

  if (supplier.reliabilityScore < 50 && supplier.avgUnitCostCents < supplier.benchmarkUnitCostCents * 0.4) {
    risk += 12;
  }

  return clamp(risk);
}

/** Composite trust score — weighted dimension scores minus fake risk penalty. */
export function computeTrustScore(scores: {
  qualityScore: number;
  shippingScore: number;
  reliabilityScore: number;
  pricingScore: number;
  fakeSupplierRisk: number;
}): number {
  const weighted =
    scores.qualityScore * 0.25 +
    scores.shippingScore * 0.2 +
    scores.reliabilityScore * 0.3 +
    scores.pricingScore * 0.25;

  const fakePenalty = scores.fakeSupplierRisk * 0.45;
  return clamp(weighted - fakePenalty);
}

export function computeAllScores(
  supplier: SupplierCatalogRecord,
  input: SupplierEvaluationInput,
): SupplierEvaluationScores {
  const signals = input.signals ?? {};

  const qualityScore = signals.quality ?? computeQualityScore(supplier);
  const shippingScore = signals.shipping ?? computeShippingScore(supplier);
  const reliabilityScore = signals.reliability ?? computeReliabilityScore(supplier);
  const pricingScore = signals.pricing ?? computePricingScore(supplier);
  const fakeSupplierRisk = computeFakeSupplierRisk(supplier);
  const profitMarginEstimate = computeProfitMarginEstimate(supplier, input.sellingPriceCents);
  const trustScore = computeTrustScore({
    qualityScore,
    shippingScore,
    reliabilityScore,
    pricingScore,
    fakeSupplierRisk,
  });

  return {
    trustScore,
    qualityScore,
    shippingScore,
    reliabilityScore,
    pricingScore,
    profitMarginEstimate,
    fakeSupplierRisk,
  };
}

/** Confidence from input completeness and supplier verification status. */
export function computeConfidence(
  supplier: SupplierCatalogRecord,
  input: SupplierEvaluationInput,
): number {
  let present = 0;
  let total = 6;

  if (supplier.id) present += 1;
  if (supplier.verified) present += 1;
  if (supplier.productCount > 0) present += 1;
  if (supplier.reliabilityScore > 0) present += 1;
  if (input.sellingPriceCents !== undefined && input.sellingPriceCents > 0) present += 1;
  if (input.productCategory) present += 1;

  const completeness = present / total;
  const verificationBoost = supplier.verified ? 10 : 0;
  return clamp(Math.round(completeness * 75 + 20 + verificationBoost));
}
