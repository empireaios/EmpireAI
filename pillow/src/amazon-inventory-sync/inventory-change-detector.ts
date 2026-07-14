/** R1-05 — Inventory change detector. */

import type { AmazonInventoryRecord } from "./types.js";

export class InventoryChangeDetector {
  detect(
    previous: AmazonInventoryRecord[],
    current: AmazonInventoryRecord[],
  ): {
    stockChanges: AmazonInventoryRecord[];
    lowStockItems: AmazonInventoryRecord[];
    outOfStockItems: AmazonInventoryRecord[];
    unchangedCount: number;
  } {
    const prevBySku = new Map(previous.map((i) => [i.amazonSku, i]));
    const stockChanges: AmazonInventoryRecord[] = [];
    const lowStockItems: AmazonInventoryRecord[] = [];
    const outOfStockItems: AmazonInventoryRecord[] = [];
    let unchangedCount = 0;

    for (const item of current) {
      const prev = prevBySku.get(item.amazonSku);
      if (!prev) {
        stockChanges.push(item);
      } else if (prev.availableQuantity !== item.availableQuantity) {
        stockChanges.push(item);
      } else {
        unchangedCount += 1;
      }

      if (item.lowStockStatus) lowStockItems.push(item);
      if (item.outOfStockStatus) outOfStockItems.push(item);
    }

    return { stockChanges, lowStockItems, outOfStockItems, unchangedCount };
  }
}
