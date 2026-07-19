/** R2-15 — Warehouse Network Engine. */

import type { WarehouseIntelligenceEngine } from "../warehouse-intelligence/engine.js";
import type { WarehouseRecord } from "../warehouse-intelligence/types.js";
import type { MultiWarehouseSupportConfiguration } from "./configuration.js";

export class WarehouseNetworkEngine {
  constructor(private readonly warehouseIntelligence: WarehouseIntelligenceEngine | null) {}

  getUpstreamRecords(): WarehouseRecord[] {
    return this.warehouseIntelligence?.getRecords() ?? [];
  }

  ensureUpstreamCoordination(config: MultiWarehouseSupportConfiguration): void {
    if (!this.warehouseIntelligence) return;
    if (!this.warehouseIntelligence.getRecords().length) {
      this.warehouseIntelligence.coordinateWarehouses({ includeFixtureWarehouses: true });
    }
  }

  mapUpstreamToAllocation(record: WarehouseRecord): number {
    return record.assignedInventory;
  }

  detectNetworkImbalance(allocations: number[], config: MultiWarehouseSupportConfiguration): boolean {
    if (allocations.length < 2) return false;
    const max = Math.max(...allocations);
    const min = Math.min(...allocations);
    const spread = max - min;
    return spread > config.imbalanceThresholdPercent * 100;
  }
}
