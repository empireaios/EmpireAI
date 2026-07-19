/** R1-12 — Unified product schema engine. */

import {
  MPN_METADATA_VERSION,
  SUPPORTED_MARKETPLACE_IDENTIFIERS,
  UNIFIED_PRODUCT_SCHEMA_VERSION,
} from "./paths.js";
import type { MarketplaceProductNormalizationConfiguration } from "./configuration.js";
import type { NormalizedProductRecord } from "./types.js";

export class UnifiedProductSchemaEngine {
  getSchemaVersion(): string {
    return UNIFIED_PRODUCT_SCHEMA_VERSION;
  }

  isSupportedMarketplace(marketplaceIdentifier: string): boolean {
    return (SUPPORTED_MARKETPLACE_IDENTIFIERS as readonly string[]).includes(
      marketplaceIdentifier,
    );
  }

  buildProductId(marketplaceIdentifier: string, marketplaceProductId: string): string {
    const safeId = marketplaceProductId.replace(/[^a-zA-Z0-9_-]/g, "-");
    return `mpn-${marketplaceIdentifier}-${safeId}`;
  }

  applySchema(
    draft: Omit<NormalizedProductRecord, "schemaVersion" | "metadataVersion" | "normalizedAt">,
    config: MarketplaceProductNormalizationConfiguration,
  ): NormalizedProductRecord {
    const now = new Date().toISOString();

    if (!config.productSchemaRulesEnabled) {
      return {
        ...draft,
        schemaVersion: UNIFIED_PRODUCT_SCHEMA_VERSION,
        metadataVersion: MPN_METADATA_VERSION,
        normalizedAt: now,
      };
    }

    return {
      productId: draft.productId,
      marketplaceIdentifier: draft.marketplaceIdentifier,
      marketplaceProductId: config.preserveSourceIdentifiers
        ? draft.marketplaceProductId
        : draft.marketplaceProductId.trim(),
      sku: draft.sku?.trim() || null,
      productTitle: draft.productTitle.trim(),
      productDescription: draft.productDescription?.trim() ?? null,
      productCategory: draft.productCategory?.trim() ?? null,
      productBrand: draft.productBrand?.trim() ?? null,
      productImages: draft.productImages?.length ? [...draft.productImages] : null,
      productAttributes: draft.productAttributes ? { ...draft.productAttributes } : null,
      productVariants: draft.productVariants?.length
        ? draft.productVariants.map((v) => ({ ...v }))
        : null,
      price: draft.price,
      currency: draft.currency?.toUpperCase() ?? null,
      inventoryReference: draft.inventoryReference,
      marketplaceMetadata: { ...draft.marketplaceMetadata },
      normalizationStatus: draft.normalizationStatus,
      schemaVersion: UNIFIED_PRODUCT_SCHEMA_VERSION,
      metadataVersion: MPN_METADATA_VERSION,
      normalizedAt: now,
    };
  }
}
