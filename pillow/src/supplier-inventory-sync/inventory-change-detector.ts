/** R2-06 — Inventory change detector. */

import type { SupplierInventorySyncConfiguration } from "./configuration.js";
import type { InventoryChangeFinding, SupplierInventoryRecord } from "./types.js";

export class InventoryChangeDetector {
  detect(
    previousInventory: SupplierInventoryRecord[],
    nextInventory: SupplierInventoryRecord[],
    config: SupplierInventorySyncConfiguration,
  ): InventoryChangeFinding[] {
    if (!config.changeDetectionRulesEnabled) return [];

    const changes: InventoryChangeFinding[] = [];
    const previousMap = new Map(
      previousInventory.map((r) => [`${r.supplierId}::${r.supplierProductId}`, r]),
    );
    const nextMap = new Map(
      nextInventory.map((r) => [`${r.supplierId}::${r.supplierProductId}`, r]),
    );

    for (const [key, record] of nextMap) {
      const previous = previousMap.get(key);
      if (!previous) continue;

      if (record.currentStockQuantity > previous.currentStockQuantity) {
        changes.push(this.buildChange("increase", previous, record));
      } else if (
        record.currentStockQuantity < previous.currentStockQuantity &&
        record.currentStockQuantity > 0
      ) {
        changes.push(this.buildChange("decrease", previous, record));
      } else if (record.stockAvailabilityStatus === "out_of_stock" && previous.currentStockQuantity > 0) {
        changes.push(this.buildChange("out_of_stock", previous, record));
      }
    }

    for (const [key, record] of previousMap) {
      if (!nextMap.has(key)) {
        changes.push({
          changeId: `sis-chg-disc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          changeType: "discontinued",
          supplierId: record.supplierId,
          supplierProductId: record.supplierProductId,
          inventoryRecordId: record.inventoryRecordId,
          previousQuantity: record.currentStockQuantity,
          currentQuantity: 0,
          details: `Inventory discontinued for ${record.supplierProductId}`,
        });
      }
    }

    return changes;
  }

  mergeDiscontinued(
    previousInventory: SupplierInventoryRecord[],
    nextInventory: SupplierInventoryRecord[],
  ): SupplierInventoryRecord[] {
    const nextKeys = new Set(nextInventory.map((r) => `${r.supplierId}::${r.supplierProductId}`));
    const discontinued = previousInventory
      .filter((r) => !nextKeys.has(`${r.supplierId}::${r.supplierProductId}`))
      .map((r) => ({
        ...r,
        currentStockQuantity: 0,
        stockAvailabilityStatus: "discontinued" as const,
        synchronizationStatus: "synchronized" as const,
        lastSynchronizationTimestamp: new Date().toISOString(),
      }));

    return [...nextInventory, ...discontinued];
  }

  private buildChange(
    changeType: InventoryChangeFinding["changeType"],
    previous: SupplierInventoryRecord,
    current: SupplierInventoryRecord,
  ): InventoryChangeFinding {
    return {
      changeId: `sis-chg-${changeType}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      changeType,
      supplierId: current.supplierId,
      supplierProductId: current.supplierProductId,
      inventoryRecordId: current.inventoryRecordId,
      previousQuantity: previous.currentStockQuantity,
      currentQuantity: current.currentStockQuantity,
      details: `Stock ${changeType}: ${previous.currentStockQuantity} → ${current.currentStockQuantity}`,
    };
  }
}
