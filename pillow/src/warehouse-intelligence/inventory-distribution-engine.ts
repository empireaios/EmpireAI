/** R2-14 — Inventory Distribution Engine. */

import type { WarehouseIntelligenceConfiguration } from "./configuration.js";
import type { WarehouseRecord } from "./types.js";

export class InventoryDistributionEngine {
  optimizeDistribution(
    records: WarehouseRecord[],
    config: WarehouseIntelligenceConfiguration,
  ): WarehouseRecord[] {
    if (!config.inventoryDistributionRulesEnabled) return records;

    const totalInventory = records.reduce((sum, r) => sum + r.inventoryLevel, 0);
    const targetPerWarehouse = Math.round(totalInventory / Math.max(records.length, 1));

    return records.map((record) => {
      const delta = targetPerWarehouse - record.inventoryLevel;
      const adjustedInventory = Math.max(0, record.inventoryLevel + Math.round(delta * 0.25));
      const assignedInventory = Math.min(
        record.assignedInventory + Math.round(delta * 0.1),
        adjustedInventory + 2000,
      );
      const capacityUtilization = Math.round(
        (assignedInventory / (assignedInventory + record.availableCapacity)) * 100,
      );
      return {
        ...record,
        timestamp: new Date().toISOString(),
        inventoryLevel: adjustedInventory,
        assignedInventory,
        capacityUtilization,
        availableCapacity: Math.max(0, 10000 - assignedInventory),
      };
    });
  }
}
