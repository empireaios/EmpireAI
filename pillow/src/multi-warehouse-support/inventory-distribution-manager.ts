/** R2-15 — Inventory Distribution Manager. */

import type { MultiWarehouseSupportConfiguration } from "./configuration.js";
import type { WarehouseNetworkRecord } from "./types.js";

export class InventoryDistributionManager {
  rebalance(records: WarehouseNetworkRecord[], config: MultiWarehouseSupportConfiguration): WarehouseNetworkRecord[] {
    if (!config.inventoryTransferRulesEnabled) return records;
    const total = records.reduce((sum, r) => sum + r.inventoryAllocation, 0);
    const target = Math.round(total / Math.max(records.length, 1));
    return records.map((record) => {
      const delta = target - record.inventoryAllocation;
      const adjusted = Math.max(0, record.inventoryAllocation + Math.round(delta * 0.2));
      return {
        ...record,
        timestamp: new Date().toISOString(),
        inventoryAllocation: adjusted,
        availableCapacity: Math.max(0, 10000 - adjusted),
        warehouseHealthStatus:
          Math.abs(adjusted - target) > config.imbalanceThresholdPercent * 100
            ? "imbalanced"
            : "healthy",
      };
    });
  }
}
