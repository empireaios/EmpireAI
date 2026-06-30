import { randomUUID } from "node:crypto";

import type { SupplierDashboard } from "../models/supplier-dashboard.js";
import { compareSuppliersForProduct } from "./supplier-comparison-service.js";
import { listSupplierProducts } from "./supplier-opportunity-service.js";

export type SupplierWatcherAlert = {
  alertId: string;
  alertType: "new_opportunity" | "inventory_risk" | "shipping_degradation" | "better_supplier_alternative";
  severity: "LOW" | "MEDIUM" | "HIGH";
  message: string;
  providerId?: string;
  supplierProductId?: string;
  detectedAt: string;
};

/** SUP-013 — Supplier Watcher for Executive Surveillance. */
export function runSupplierWatcher(
  workspaceId: string,
  dashboard: SupplierDashboard,
): SupplierWatcherAlert[] {
  const alerts: SupplierWatcherAlert[] = [];
  const now = new Date().toISOString();

  for (const opp of dashboard.bestOpportunities.filter((o) => o.score.recommendation === "LAUNCH")) {
    alerts.push({
      alertId: randomUUID(),
      alertType: "new_opportunity",
      severity: "MEDIUM",
      message: `Launch opportunity: ${opp.title} (${opp.providerId}, score ${opp.score.overallScore})`,
      providerId: opp.providerId,
      supplierProductId: opp.supplierProductId,
      detectedAt: now,
    });
  }

  for (const risk of dashboard.supplierRisks.filter((r) => r.riskType === "unstable_stock")) {
    alerts.push({
      alertId: randomUUID(),
      alertType: "inventory_risk",
      severity: risk.severity === "CRITICAL" ? "HIGH" : "MEDIUM",
      message: risk.message,
      providerId: risk.providerId,
      supplierProductId: risk.supplierProductId,
      detectedAt: now,
    });
  }

  for (const risk of dashboard.supplierRisks.filter((r) => r.riskType === "slow_shipping")) {
    alerts.push({
      alertId: randomUUID(),
      alertType: "shipping_degradation",
      severity: "LOW",
      message: risk.message,
      providerId: risk.providerId,
      supplierProductId: risk.supplierProductId,
      detectedAt: now,
    });
  }

  const products = listSupplierProducts(workspaceId);
  if (products.length >= 2) {
    const comparison = compareSuppliersForProduct(
      products[0]!.title,
      "US",
      products.slice(0, 3),
    );
    if (comparison.entries.length >= 2 && comparison.entries[0]!.providerId !== comparison.entries[1]!.providerId) {
      const alt = comparison.entries[1]!;
      alerts.push({
        alertId: randomUUID(),
        alertType: "better_supplier_alternative",
        severity: "LOW",
        message: `Alternative supplier ${alt.displayName} available for "${comparison.productIdea}" (rank #2)`,
        providerId: alt.providerId,
        supplierProductId: alt.supplierProductId,
        detectedAt: now,
      });
    }
  }

  return alerts.slice(0, 10);
}
