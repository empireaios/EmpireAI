/** R2-19 — Procurement intelligence fixtures (structural — no live HTTP). */

import type { PurchaseTimingRecommendation, SupportedSupplierIdentifier } from "./types.js";
import { SUPPORTED_SUPPLIER_IDENTIFIERS } from "./paths.js";

export function buildProcurementIntelligenceId(productReference: string): string {
  const slug = productReference.replace(/[^a-z0-9]/gi, "").slice(0, 24) || "product";
  return `pi-${slug}`;
}

export function listFixtureProductReferences(): string[] {
  return ["cj-prod-1001", "ali-prod-2001", "1688-prod-3001"];
}

export function getFixtureIntelligenceProfile(
  productReference: string,
  mode?: "optimal" | "elevated_cost" | "anomaly" | "high_risk",
): {
  supplierReference: SupportedSupplierIdentifier;
  procurementReference: string;
  recommendedSupplier: SupportedSupplierIdentifier;
  recommendedPurchaseQuantity: number;
  recommendedPurchaseTiming: PurchaseTimingRecommendation;
  estimatedProcurementCost: number;
  procurementConfidenceScore: number;
} {
  const supplier = SUPPORTED_SUPPLIER_IDENTIFIERS[productReference.length % SUPPORTED_SUPPLIER_IDENTIFIERS.length]!;

  if (mode === "elevated_cost") {
    return {
      supplierReference: supplier,
      procurementReference: `pce-${productReference}-cost`,
      recommendedSupplier: supplier,
      recommendedPurchaseQuantity: 10,
      recommendedPurchaseTiming: "delayed",
      estimatedProcurementCost: 245.5,
      procurementConfidenceScore: 55,
    };
  }
  if (mode === "anomaly") {
    return {
      supplierReference: supplier,
      procurementReference: `pce-${productReference}-anom`,
      recommendedSupplier: SUPPORTED_SUPPLIER_IDENTIFIERS[0]!,
      recommendedPurchaseQuantity: 50,
      recommendedPurchaseTiming: "immediate",
      estimatedProcurementCost: 180.0,
      procurementConfidenceScore: 48,
    };
  }
  if (mode === "high_risk") {
    return {
      supplierReference: supplier,
      procurementReference: `pce-${productReference}-risk`,
      recommendedSupplier: "cj-dropshipping",
      recommendedPurchaseQuantity: 5,
      recommendedPurchaseTiming: "standard",
      estimatedProcurementCost: 95.0,
      procurementConfidenceScore: 42,
    };
  }

  const recommended =
    supplier === "cj-dropshipping" ? "cj-dropshipping" : supplier === "aliexpress" ? "aliexpress" : "1688";
  return {
    supplierReference: supplier,
    procurementReference: `pce-${productReference}-opt`,
    recommendedSupplier: recommended,
    recommendedPurchaseQuantity: 25,
    recommendedPurchaseTiming: "opportunistic",
    estimatedProcurementCost: 72.5,
    procurementConfidenceScore: 88,
  };
}
