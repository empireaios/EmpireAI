/** R1-05 — Inventory discrepancy detector. */

import { randomUUID } from "node:crypto";
import type { AmazonInventorySyncConfiguration } from "./configuration.js";
import type { AmazonInventoryDiscrepancy, AmazonInventoryRecord } from "./types.js";

export class InventoryDiscrepancyDetector {
  detect(
    amazonInventory: AmazonInventoryRecord[],
    internalInventory: Map<string, number>,
    config: AmazonInventorySyncConfiguration,
  ): AmazonInventoryDiscrepancy[] {
    if (!config.discrepancyRulesEnabled) return [];

    const discrepancies: AmazonInventoryDiscrepancy[] = [];

    for (const item of amazonInventory) {
      const internalQty = internalInventory.get(item.amazonSku);
      if (internalQty === undefined) continue;

      const delta = item.availableQuantity - internalQty;
      if (delta !== 0) {
        discrepancies.push({
          discrepancyId: `amzinv-disc-${randomUUID()}`,
          amazonSku: item.amazonSku,
          amazonQuantity: item.availableQuantity,
          internalQuantity: internalQty,
          delta,
          details: `Quantity mismatch: Amazon=${item.availableQuantity}, internal=${internalQty}`,
        });
      }
    }

    return discrepancies;
  }
}
