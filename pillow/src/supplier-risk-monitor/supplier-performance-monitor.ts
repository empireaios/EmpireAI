/** R2-16 — Supplier Performance Monitor. */

import type { SupplierRankingRecord } from "../supplier-ranking-engine/types.js";
import type { ProcurementRecord } from "../procurement-engine/types.js";
import type { FulfilmentReliabilityStatus, StabilityStatus } from "./types.js";

export class SupplierPerformanceMonitor {
  assessInventoryStability(ranking: SupplierRankingRecord | null): StabilityStatus {
    if (!ranking) return "volatile";
    if (ranking.inventoryReliabilityScore >= 75) return "stable";
    if (ranking.inventoryReliabilityScore >= 45) return "volatile";
    return "critical";
  }

  assessPricingStability(ranking: SupplierRankingRecord | null): StabilityStatus {
    if (!ranking) return "volatile";
    if (ranking.pricingScore >= 75) return "stable";
    if (ranking.pricingScore >= 45) return "volatile";
    return "critical";
  }

  assessFulfilmentReliability(
    ranking: SupplierRankingRecord | null,
    procurements: ProcurementRecord[],
  ): FulfilmentReliabilityStatus {
    if (!ranking) return "moderate";
    const failed = procurements.filter((p) => p.procurementStatus === "failed").length;
    if (failed > 2) return "failed";
    if (ranking.fulfilmentReliabilityScore >= 80) return "high";
    if (ranking.fulfilmentReliabilityScore >= 50) return "moderate";
    return "low";
  }
}
