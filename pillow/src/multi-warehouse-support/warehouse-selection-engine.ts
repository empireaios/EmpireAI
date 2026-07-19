/** R2-15 — Warehouse Selection Engine. */

import { appendMwsLog } from "./mws-logging.js";
import type { MultiWarehouseSupportConfiguration } from "./configuration.js";
import type { SelectWarehouseInput, WarehouseNetworkRecord } from "./types.js";
import { WAREHOUSE_LOCATIONS } from "./network-fixtures.js";

export type SelectionResult = {
  record: WarehouseNetworkRecord | null;
  selectionReason: string;
};

export class WarehouseSelectionEngine {
  selectOptimal(
    records: WarehouseNetworkRecord[],
    input: SelectWarehouseInput,
    config: MultiWarehouseSupportConfiguration,
  ): SelectionResult {
    if (!config.warehouseSelectionRulesEnabled) {
      return { record: null, selectionReason: "Warehouse selection rules disabled" };
    }

    const candidates = records.filter(
      (r) => r.warehouseHealthStatus === "healthy" && r.availableCapacity > 0,
    );
    if (!candidates.length) {
      return { record: null, selectionReason: "No healthy warehouses available" };
    }

    if (input.preferredWarehouseId) {
      const preferred = candidates.find((r) => r.warehouseId === input.preferredWarehouseId);
      if (preferred) {
        appendMwsLog({
          event: "warehouse_selection",
          level: "info",
          details: `Selected preferred warehouse ${preferred.warehouseId}`,
        });
        return { record: preferred, selectionReason: `Preferred warehouse ${preferred.warehouseId}` };
      }
    }

    const sorted = [...candidates].sort(
      (a, b) => b.availableCapacity - a.assignedFulfilmentWorkload - (a.availableCapacity - a.assignedFulfilmentWorkload),
    );
    const selected = sorted[0]!;
    const reason = input.orderReference
      ? `Optimal warehouse for order ${input.orderReference} at ${WAREHOUSE_LOCATIONS[selected.warehouseId]}`
      : `Highest available capacity at ${WAREHOUSE_LOCATIONS[selected.warehouseId]}`;

    appendMwsLog({
      event: "warehouse_selection",
      level: "info",
      details: reason,
    });

    return { record: selected, selectionReason: reason };
  }
}
