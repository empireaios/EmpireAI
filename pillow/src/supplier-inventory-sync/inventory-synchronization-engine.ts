/** R2-06 — Inventory synchronization engine. */

import { appendSisLog } from "./sis-logging.js";
import type { SupplierProductRecord } from "../supplier-product-sync/types.js";
import type { SupplierInventorySyncConfiguration } from "./configuration.js";
import type {
  InventoryChangeFinding,
  RawSupplierInventoryPayload,
  SupplierInventoryRecord,
} from "./types.js";
import { InventoryChangeDetector } from "./inventory-change-detector.js";
import { SupplierInventoryMapper } from "./supplier-inventory-mapper.js";

export class InventorySynchronizationEngine {
  private readonly mapper = new SupplierInventoryMapper();
  private readonly changeDetector = new InventoryChangeDetector();

  synchronizeInventory(input: {
    previousInventory: SupplierInventoryRecord[];
    rawInventory: RawSupplierInventoryPayload[];
    catalog: SupplierProductRecord[];
    config: SupplierInventorySyncConfiguration;
  }): {
    inventory: SupplierInventoryRecord[];
    changes: InventoryChangeFinding[];
  } {
    appendSisLog({
      event: "synchronization_start",
      level: "info",
      details: `Synchronizing ${input.rawInventory.length} inventory record(s)`,
    });

    const mapped = this.mapper.mapBatch(input.rawInventory, input.catalog, input.config);
    const changes = this.changeDetector.detect(input.previousInventory, mapped, input.config);
    const inventory = this.changeDetector.mergeDiscontinued(input.previousInventory, mapped);

    appendSisLog({
      event: "inventory_updates",
      level: "info",
      details: `Stock changes: ${changes.filter((c) => c.changeType === "increase").length} increases, ${changes.filter((c) => c.changeType === "decrease").length} decreases, ${changes.filter((c) => c.changeType === "out_of_stock").length} out-of-stock, ${changes.filter((c) => c.changeType === "discontinued").length} discontinued`,
    });

    return { inventory, changes };
  }
}
