import type { ProductCandidate, SupplierIntelligence } from "../models/commerce-intelligence-core.js";

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

/** PILLOW-020 — Supplier intelligence subsystem under Pillow ownership. */
export function analyzeSupplierIntelligence(candidate: ProductCandidate): SupplierIntelligence {
  const inventoryFactor = candidate.inventoryTotal > 100 ? 20 : candidate.inventoryTotal > 30 ? 10 : -10;
  const deliveryFactor =
    candidate.estimatedDeliveryDays.max <= 14 ? 10 : candidate.estimatedDeliveryDays.max <= 21 ? 0 : -15;
  const reliabilityFactor = candidate.supplierReliabilityScore >= 70 ? 10 : -5;

  const viabilityScore = clampScore(
    candidate.supplierReliabilityScore * 0.5 + inventoryFactor + deliveryFactor + reliabilityFactor,
  );

  let supplyRisk: SupplierIntelligence["supplyRisk"] = "low";
  if (candidate.inventoryTotal < 30 || candidate.estimatedDeliveryDays.max > 18) supplyRisk = "medium";
  if (candidate.inventoryTotal <= 0) supplyRisk = "high";

  const fulfilmentReadiness =
    candidate.fulfilmentReadiness &&
    candidate.inventoryTotal > 0 &&
    candidate.shippingCountries.includes("US");

  let candidateStatus: SupplierIntelligence["candidateStatus"] = "viable";
  if (!fulfilmentReadiness || viabilityScore < 55) candidateStatus = "not_ready";
  else if (supplyRisk !== "low" || viabilityScore < 70) candidateStatus = "at_risk";

  return {
    viabilityScore,
    supplyRisk,
    fulfilmentReadiness,
    candidateStatus,
  };
}
