/** R2-14 — Warehouse Optimization Engine. */

import type { WarehouseRecord } from "./types.js";
import { InventoryDistributionEngine } from "./inventory-distribution-engine.js";
import type { WarehouseIntelligenceConfiguration } from "./configuration.js";

export class WarehouseOptimizationEngine {
  private readonly distributionEngine = new InventoryDistributionEngine();

  optimize(
    records: WarehouseRecord[],
    config: WarehouseIntelligenceConfiguration,
  ): WarehouseRecord[] {
    const distributed = this.distributionEngine.optimizeDistribution(records, config);
    return distributed.map((record) => {
      if (record.warehouseStatus === "bottleneck" && record.availableCapacity > 500) {
        return {
          ...record,
          fulfilmentWorkload: Math.max(0, record.fulfilmentWorkload - 10),
          warehouseStatus: "optimal" as const,
        };
      }
      if (record.warehouseStatus === "overstock" && record.inventoryLevel > 8000) {
        return {
          ...record,
          inventoryLevel: Math.round(record.inventoryLevel * 0.9),
          warehouseStatus: "optimal" as const,
        };
      }
      return record;
    });
  }
}
