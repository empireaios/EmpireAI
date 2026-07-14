/** R1-05 — Amazon inventory mapper. */

import {
  AMAZON_INVENTORY_MARKETPLACE_ID,
  AMAZON_INVENTORY_METADATA_VERSION,
  AMAZON_INVENTORY_API_PATHS,
} from "./paths.js";
import type { AmazonInventorySyncConfiguration } from "./configuration.js";
import type { AmazonInventoryRecord, RawAmazonInventoryPayload, StockStatus } from "./types.js";

export function buildInventoryId(sku: string): string {
  return `amzinv-${sku.replace(/[^a-zA-Z0-9]/g, "")}`;
}

export class AmazonInventoryMapper {
  map(
    payload: RawAmazonInventoryPayload,
    config: AmazonInventorySyncConfiguration,
  ): AmazonInventoryRecord {
    const now = new Date().toISOString();
    const available = payload.availableQuantity;
    const lowStock = available > 0 && available <= config.lowStockThreshold;
    const outOfStock = available <= 0;

    let stockStatus: StockStatus = "in_stock";
    if (outOfStock) stockStatus = "out_of_stock";
    else if (lowStock) stockStatus = "low_stock";

    return {
      inventoryId: buildInventoryId(payload.amazonSku),
      amazonSku: payload.amazonSku,
      marketplaceId: AMAZON_INVENTORY_MARKETPLACE_ID,
      productId: payload.productId ?? null,
      availableQuantity: available,
      reservedQuantity: payload.reservedQuantity ?? null,
      fulfillableQuantity: payload.fulfillableQuantity ?? null,
      stockStatus,
      lowStockStatus: lowStock,
      outOfStockStatus: outOfStock,
      lastSynchronizedTimestamp: now,
      sourceApiReference: `${AMAZON_INVENTORY_API_PATHS.listInventory}#${payload.amazonSku}`,
      metadataVersion: AMAZON_INVENTORY_METADATA_VERSION,
    };
  }

  mapBatch(
    payloads: RawAmazonInventoryPayload[],
    config: AmazonInventorySyncConfiguration,
  ): AmazonInventoryRecord[] {
    return payloads.map((p) => this.map(p, config));
  }
}
