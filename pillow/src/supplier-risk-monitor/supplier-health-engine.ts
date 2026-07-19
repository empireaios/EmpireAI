/** R2-16 — Supplier Health Engine. */

import type { SupplierRankingRecord } from "../supplier-ranking-engine/types.js";
import type { SupplierInventoryRecord } from "../supplier-inventory-sync/types.js";
import type { ProcurementRecord } from "../procurement-engine/types.js";

export class SupplierHealthEngine {
  computeHealthScore(input: {
    ranking: SupplierRankingRecord | null;
    inventoryItems: SupplierInventoryRecord[];
    procurements: ProcurementRecord[];
  }): number {
    if (!input.ranking) return 50;
    const stockRatio =
      input.inventoryItems.length > 0
        ? input.inventoryItems.filter((i) => i.currentStockQuantity > 0).length /
          input.inventoryItems.length
        : 0.5;
    const procurementSuccess =
      input.procurements.length > 0
        ? input.procurements.filter((p) => p.procurementStatus !== "failed").length /
          input.procurements.length
        : 0.8;
    return Math.round(
      input.ranking.overallSupplierScore * 0.5 +
        stockRatio * 100 * 0.25 +
        procurementSuccess * 100 * 0.25,
    );
  }
}
