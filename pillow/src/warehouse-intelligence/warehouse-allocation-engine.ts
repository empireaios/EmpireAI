/** R2-14 — Warehouse Allocation Engine. */

import type { WarehouseIntelligenceConfiguration } from "./configuration.js";
import type { AllocateWarehouseInput, WarehouseIdentifier, WarehouseRecord } from "./types.js";
import { WAREHOUSE_LOCATIONS } from "./warehouse-fixtures.js";

export type AllocationResult = {
  warehouseId: WarehouseIdentifier;
  warehouseLocation: string;
  selectionReason: string;
};

export class WarehouseAllocationEngine {
  selectOptimalWarehouse(
    records: WarehouseRecord[],
    input: AllocateWarehouseInput,
    config: WarehouseIntelligenceConfiguration,
  ): AllocationResult | null {
    if (!config.warehouseAllocationRulesEnabled) return null;

    const candidates = records.filter(
      (r) => r.warehouseStatus === "optimal" || r.warehouseStatus === "degraded",
    );
    if (!candidates.length) return null;

    const sorted = [...candidates].sort((a, b) => {
      const scoreA = a.availableCapacity - a.fulfilmentWorkload;
      const scoreB = b.availableCapacity - b.fulfilmentWorkload;
      return scoreB - scoreA;
    });

    const selected = sorted[0]!;
    const reason = input.orderReference
      ? `Allocated for order ${input.orderReference} — highest available capacity`
      : "Highest available capacity warehouse selected";

    return {
      warehouseId: selected.warehouseId,
      warehouseLocation: WAREHOUSE_LOCATIONS[selected.warehouseId],
      selectionReason: reason,
    };
  }
}
