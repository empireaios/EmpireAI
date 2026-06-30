import { randomUUID } from "node:crypto";

import type { SupplierProduct } from "../models/supplier-product.js";
import type { SupplierRiskSignal } from "../models/supplier-risk.js";

/** SUP-007 — Detect supplier risks from product data. */
export function detectSupplierRisks(product: SupplierProduct): SupplierRiskSignal[] {
  const risks: SupplierRiskSignal[] = [];
  const now = new Date().toISOString();

  const maxShip = product.shippingDaysMax ?? product.shippingDaysMin ?? 0;
  if (maxShip > 20) {
    risks.push({
      riskId: randomUUID(),
      riskType: "slow_shipping",
      severity: maxShip > 30 ? "HIGH" : "MEDIUM",
      providerId: product.providerId,
      supplierProductId: product.supplierProductId,
      message: `Shipping up to ${maxShip} days — review acceptability by country/category`,
      mitigation: "Run shipping acceptability engine before launch",
      detectedAt: now,
    });
  }

  if (product.inventory < 20) {
    risks.push({
      riskId: randomUUID(),
      riskType: "unstable_stock",
      severity: product.inventory === 0 ? "CRITICAL" : "HIGH",
      providerId: product.providerId,
      supplierProductId: product.supplierProductId,
      message: `Low inventory (${product.inventory} units)`,
      mitigation: "Monitor stock or select alternate supplier",
      detectedAt: now,
    });
  }

  if ((product.supplierRating ?? 4) < 3.5) {
    risks.push({
      riskId: randomUUID(),
      riskType: "high_refund_risk",
      severity: "MEDIUM",
      providerId: product.providerId,
      supplierProductId: product.supplierProductId,
      message: `Supplier rating ${product.supplierRating ?? "unknown"} below threshold`,
      detectedAt: now,
    });
  }

  if (product.shippingCountries.length < 2) {
    risks.push({
      riskId: randomUUID(),
      riskType: "poor_country_coverage",
      severity: "LOW",
      providerId: product.providerId,
      supplierProductId: product.supplierProductId,
      message: "Limited shipping country coverage",
      detectedAt: now,
    });
  }

  const margin = product.suggestedRetailPrice
    ? ((product.suggestedRetailPrice - product.costPrice) / product.suggestedRetailPrice) * 100
    : 0;
  if (margin > 0 && margin < 25) {
    risks.push({
      riskId: randomUUID(),
      riskType: "bad_margin",
      severity: "HIGH",
      providerId: product.providerId,
      supplierProductId: product.supplierProductId,
      message: `Margin ${Math.round(margin)}% below launch threshold`,
      detectedAt: now,
    });
  }

  if (product.category.toLowerCase().includes("electronics") && !product.specs.ce) {
    risks.push({
      riskId: randomUUID(),
      riskType: "compliance_risk",
      severity: "MEDIUM",
      providerId: product.providerId,
      supplierProductId: product.supplierProductId,
      message: "Electronics category missing compliance specs",
      mitigation: "Verify CE/FCC before marketplace listing",
      detectedAt: now,
    });
  }

  return risks;
}
