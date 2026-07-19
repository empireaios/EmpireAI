/** R2-19 — Procurement Analytics Engine. */

import type { ProcurementRecord } from "../procurement-engine/types.js";
import type { SupplierPricingRecord } from "../supplier-pricing-engine/types.js";

export class ProcurementAnalyticsEngine {
  analyzeHistory(procurements: ProcurementRecord[]): {
    totalOrders: number;
    averageQuantity: number;
    averageUnitCost: number;
    topSupplier: string | null;
  } {
    if (!procurements.length) {
      return { totalOrders: 0, averageQuantity: 0, averageUnitCost: 0, topSupplier: null };
    }
    const totalQty = procurements.reduce((s, p) => s + p.requestedQuantity, 0);
    const totalCost = procurements.reduce((s, p) => s + p.unitCost * p.requestedQuantity, 0);
    const supplierCounts = new Map<string, number>();
    for (const p of procurements) {
      supplierCounts.set(p.supplierId, (supplierCounts.get(p.supplierId) ?? 0) + 1);
    }
    const topSupplier = [...supplierCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    return {
      totalOrders: procurements.length,
      averageQuantity: Math.round(totalQty / procurements.length),
      averageUnitCost: Math.round((totalCost / totalQty) * 100) / 100,
      topSupplier,
    };
  }

  evaluatePricingTrend(pricing: SupplierPricingRecord[], supplierId: string): {
    trend: "rising" | "falling" | "stable";
    averagePrice: number;
  } {
    const supplierPricing = pricing.filter((p) => p.supplierId === supplierId);
    if (!supplierPricing.length) return { trend: "stable", averagePrice: 0 };
    const avg = supplierPricing.reduce((s, p) => s + p.currentSupplierPrice, 0) / supplierPricing.length;
    const rising = supplierPricing.filter((p) => (p.priceChangePercentage ?? 0) > 5).length;
    const falling = supplierPricing.filter((p) => (p.priceChangePercentage ?? 0) < -5).length;
    const trend = rising > falling ? "rising" : falling > rising ? "falling" : "stable";
    return { trend, averagePrice: Math.round(avg * 100) / 100 };
  }
}
