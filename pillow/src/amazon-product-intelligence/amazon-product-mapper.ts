/** R1-03 — Amazon product mapper. */

import {
  AMAZON_PRODUCT_MARKETPLACE_ID,
  AMAZON_PRODUCT_METADATA_VERSION,
  AMAZON_CATALOG_API_PATHS,
} from "./paths.js";
import type { AmazonProductIntelligenceConfiguration } from "./configuration.js";
import type { AmazonProductRecord, RawAmazonProductPayload } from "./types.js";

export function buildProductId(asin: string): string {
  return `amzprod-${asin}`;
}

export class AmazonProductMapper {
  map(
    payload: RawAmazonProductPayload,
    config: AmazonProductIntelligenceConfiguration,
    syncStatus: AmazonProductRecord["synchronizationStatus"] = "synced",
  ): AmazonProductRecord {
    const now = new Date().toISOString();

    if (!config.productMappingRulesEnabled) {
      return {
        productId: buildProductId(payload.asin),
        amazonAsin: payload.asin,
        amazonSku: payload.sku ?? null,
        marketplaceId: AMAZON_PRODUCT_MARKETPLACE_ID,
        productTitle: payload.title,
        productDescription: payload.description ?? null,
        productCategory: payload.category ?? null,
        productImages: payload.images ?? null,
        productAttributes: payload.attributes ?? null,
        productStatus: payload.status ?? "unknown",
        synchronizationStatus: syncStatus,
        sourceApiReference: AMAZON_CATALOG_API_PATHS.listItems,
        metadataVersion: AMAZON_PRODUCT_METADATA_VERSION,
        lastSyncedAt: now,
      };
    }

    return {
      productId: buildProductId(payload.asin),
      amazonAsin: payload.asin,
      amazonSku: payload.sku?.trim() || null,
      marketplaceId: AMAZON_PRODUCT_MARKETPLACE_ID,
      productTitle: payload.title.trim(),
      productDescription: payload.description?.trim() ?? null,
      productCategory: payload.category?.trim() ?? null,
      productImages: payload.images?.length ? [...payload.images] : null,
      productAttributes: payload.attributes ? { ...payload.attributes } : null,
      productStatus: payload.status ?? "active",
      synchronizationStatus: syncStatus,
      sourceApiReference: `${AMAZON_CATALOG_API_PATHS.listItems}#${payload.asin}`,
      metadataVersion: AMAZON_PRODUCT_METADATA_VERSION,
      lastSyncedAt: now,
    };
  }

  mapBatch(
    payloads: RawAmazonProductPayload[],
    config: AmazonProductIntelligenceConfiguration,
    syncStatus: AmazonProductRecord["synchronizationStatus"] = "synced",
  ): AmazonProductRecord[] {
    return payloads.map((p) => this.map(p, config, syncStatus));
  }
}
