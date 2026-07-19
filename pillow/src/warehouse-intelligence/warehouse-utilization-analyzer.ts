/** R2-14 — Warehouse Utilization Analyzer. */

import type { WarehouseIntelligenceConfiguration } from "./configuration.js";
import type { WarehouseRecord, WarehouseStatus } from "./types.js";
import { WAREHOUSE_CAPACITY, computeUtilization } from "./warehouse-fixtures.js";

export class WarehouseUtilizationAnalyzer {
  analyzeStatus(
    record: Omit<WarehouseRecord, "warehouseStatus" | "capacityUtilization" | "availableCapacity">,
    config: WarehouseIntelligenceConfiguration,
  ): {
    capacityUtilization: number;
    availableCapacity: number;
    warehouseStatus: WarehouseStatus;
  } {
    const capacityUtilization = computeUtilization(record.assignedInventory, WAREHOUSE_CAPACITY);
    const availableCapacity = Math.max(0, WAREHOUSE_CAPACITY - record.assignedInventory);

    let warehouseStatus: WarehouseStatus = "optimal";
    if (record.inventoryLevel <= config.shortageThresholdPercent * 100) {
      warehouseStatus = "shortage";
    } else if (capacityUtilization >= config.overstockThresholdPercent) {
      warehouseStatus = "overstock";
    } else if (capacityUtilization >= config.capacityThresholdPercent) {
      warehouseStatus = "bottleneck";
    } else if (record.fulfilmentWorkload >= 90) {
      warehouseStatus = "degraded";
    }

    return { capacityUtilization, availableCapacity, warehouseStatus };
  }

  detectBottleneck(record: WarehouseRecord): boolean {
    return record.warehouseStatus === "bottleneck";
  }

  detectShortage(record: WarehouseRecord): boolean {
    return record.warehouseStatus === "shortage";
  }

  detectOverstock(record: WarehouseRecord): boolean {
    return record.warehouseStatus === "overstock";
  }
}
