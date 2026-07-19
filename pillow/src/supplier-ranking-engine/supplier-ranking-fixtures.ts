/** R2-08 — Supplier ranking fixtures (structural — no live HTTP). */

import type { SupplierMetricsSnapshot } from "./types.js";

export function getFixtureMetrics(): SupplierMetricsSnapshot[] {
  return [
    {
      supplierId: "cj-dropshipping",
      productCount: 1,
      activeProductCount: 1,
      inStockCount: 1,
      outOfStockCount: 0,
      averagePrice: 12.5,
      priceAnomalyCount: 0,
      priceStabilityScore: 92,
      responseTimeMs: 800,
    },
    {
      supplierId: "aliexpress",
      productCount: 1,
      activeProductCount: 1,
      inStockCount: 1,
      outOfStockCount: 0,
      averagePrice: 3.99,
      priceAnomalyCount: 0,
      priceStabilityScore: 88,
      responseTimeMs: 1200,
    },
    {
      supplierId: "1688",
      productCount: 1,
      activeProductCount: 1,
      inStockCount: 1,
      outOfStockCount: 0,
      averagePrice: 1.2,
      priceAnomalyCount: 0,
      priceStabilityScore: 85,
      responseTimeMs: 1500,
    },
  ];
}

export function getFixtureForSupplier(supplierId: string): SupplierMetricsSnapshot[] {
  return getFixtureMetrics().filter((m) => m.supplierId === supplierId);
}

export function getPerformanceFixtures(
  mode: "declining" | "high_performing",
): SupplierMetricsSnapshot[] {
  const base = getFixtureMetrics();
  if (mode === "high_performing") {
    return base.map((m) =>
      m.supplierId === "cj-dropshipping"
        ? {
            ...m,
            priceStabilityScore: 98,
            responseTimeMs: 400,
            inStockCount: 2,
            outOfStockCount: 0,
          }
        : m,
    );
  }
  return base.map((m) =>
    m.supplierId === "aliexpress"
      ? {
          ...m,
          priceStabilityScore: 45,
          priceAnomalyCount: 3,
          outOfStockCount: 1,
          inStockCount: 0,
          responseTimeMs: 5000,
        }
      : m,
  );
}
