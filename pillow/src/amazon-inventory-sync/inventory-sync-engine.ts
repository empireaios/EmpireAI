/** R1-05 — Inventory sync engine. */

import { appendInventoryLog } from "./amzinv-logging.js";
import type { AmazonStockFetcher } from "./amazon-stock-fetcher.js";
import type { AmazonInventoryMapper } from "./amazon-inventory-mapper.js";
import type { InventoryChangeDetector } from "./inventory-change-detector.js";
import type { InventoryDiscrepancyDetector } from "./inventory-discrepancy-detector.js";
import type { AmazonInventorySyncConfiguration } from "./configuration.js";
import type {
  AmazonInventoryChangeSet,
  AmazonInventoryRecord,
  SyncAmazonInventoryInput,
} from "./types.js";

export class InventorySyncEngine {
  constructor(
    private readonly fetcher: AmazonStockFetcher,
    private readonly mapper: AmazonInventoryMapper,
    private readonly changeDetector: InventoryChangeDetector,
    private readonly discrepancyDetector: InventoryDiscrepancyDetector,
  ) {}

  async sync(
    previousInventory: AmazonInventoryRecord[],
    internalInventory: Map<string, number>,
    config: AmazonInventorySyncConfiguration,
    input: SyncAmazonInventoryInput = {},
    fixtureOptions?: Parameters<AmazonStockFetcher["fetchAll"]>[2],
  ): Promise<{
    inventory: AmazonInventoryRecord[];
    changes: AmazonInventoryChangeSet;
  }> {
    appendInventoryLog({
      event: "inventory_sync_start",
      level: "info",
      details: "Amazon inventory sync started",
    });

    const raw = await this.fetcher.fetchAll(input, config, fixtureOptions);
    const mapped = this.mapper.mapBatch(raw, config);
    const detected = this.changeDetector.detect(
      input.forceFullSync ? [] : previousInventory,
      mapped,
    );
    const discrepancies = this.discrepancyDetector.detect(mapped, internalInventory, config);

    const changes: AmazonInventoryChangeSet = {
      ...detected,
      discrepancies,
    };

    appendInventoryLog({
      event: "inventory_sync_complete",
      level: "info",
      details: `${detected.stockChanges.length} stock changes, ${detected.lowStockItems.length} low-stock, ${detected.outOfStockItems.length} out-of-stock, ${discrepancies.length} discrepancies`,
    });

    return { inventory: mapped, changes };
  }
}
