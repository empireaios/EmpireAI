/** R2-17 — Warehouse Selection Optimizer. */

import type { WarehouseNetworkRecord } from "../multi-warehouse-support/types.js";
import type { LogisticsOptimizationConfiguration } from "./configuration.js";

export class WarehouseSelectionOptimizer {
  selectWarehouse(
    warehouses: WarehouseNetworkRecord[],
    config: LogisticsOptimizationConfiguration,
    orderReference: string,
  ): { warehouseId: string; score: number } {
    if (!config.warehouseSelectionRulesEnabled || !warehouses.length) {
      return { warehouseId: "wh-central", score: 50 };
    }

    const healthy = warehouses.filter(
      (w) => w.warehouseHealthStatus === "healthy" && w.availableCapacity > 0,
    );
    const pool = healthy.length ? healthy : warehouses;

    const ranked = [...pool].sort((a, b) => {
      const scoreA = a.availableCapacity - a.assignedFulfilmentWorkload;
      const scoreB = b.availableCapacity - b.assignedFulfilmentWorkload;
      return scoreB - scoreA;
    });

    const pick = ranked[orderReference.length % ranked.length] ?? ranked[0]!;
    const score = Math.min(
      100,
      Math.round(
        ((pick.availableCapacity - pick.assignedFulfilmentWorkload) / Math.max(1, pick.availableCapacity)) *
          100,
      ),
    );
    return { warehouseId: pick.warehouseId, score };
  }

  hasWarehouseCapacityIssue(warehouses: WarehouseNetworkRecord[]): boolean {
    return warehouses.some(
      (w) => w.warehouseHealthStatus === "capacity_issue" || w.warehouseHealthStatus === "imbalanced",
    );
  }
}
