/** R2-08 — Reliability Calculator. */

import type { SupplierMetricsSnapshot } from "./types.js";

export class ReliabilityCalculator {
  calculateInventoryReliability(metrics: SupplierMetricsSnapshot): number {
    const total = metrics.inStockCount + metrics.outOfStockCount;
    if (total === 0) return 50;
    const ratio = metrics.inStockCount / total;
    return Math.round(ratio * 100);
  }

  calculateFulfilmentReliability(metrics: SupplierMetricsSnapshot): number {
    let score = 80;
    if (metrics.outOfStockCount > 0) score -= metrics.outOfStockCount * 15;
    if (metrics.activeProductCount < metrics.productCount) score -= 10;
    return Math.max(0, Math.min(100, score));
  }

  calculateResponsiveness(metrics: SupplierMetricsSnapshot): number {
    if (metrics.responseTimeMs <= 500) return 95;
    if (metrics.responseTimeMs <= 1000) return 85;
    if (metrics.responseTimeMs <= 2000) return 70;
    if (metrics.responseTimeMs <= 4000) return 50;
    return 30;
  }
}
