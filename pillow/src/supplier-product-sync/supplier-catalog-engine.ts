/** R2-05 — Supplier catalog engine. */

import {
  SPS_METADATA_VERSION,
  SUPPORTED_SUPPLIER_IDENTIFIERS,
  SUPPLIER_PRODUCT_CATALOG_VERSION,
} from "./paths.js";
import type { SupplierProductSyncConfiguration } from "./configuration.js";
import type { SupplierProductRecord } from "./types.js";

export class SupplierCatalogEngine {
  getCatalogVersion(): string {
    return SUPPLIER_PRODUCT_CATALOG_VERSION;
  }

  isSupportedSupplier(supplierId: string): boolean {
    return (SUPPORTED_SUPPLIER_IDENTIFIERS as readonly string[]).includes(supplierId);
  }

  buildProductId(supplierId: string, supplierProductId: string): string {
    const safeId = supplierProductId.replace(/[^a-zA-Z0-9_-]/g, "-");
    return `sps-${supplierId}-${safeId}`;
  }

  applyCatalogSchema(
    draft: Omit<SupplierProductRecord, "metadataVersion" | "synchronizedAt">,
    config: SupplierProductSyncConfiguration,
  ): SupplierProductRecord {
    const now = new Date().toISOString();

    if (!config.productMappingRulesEnabled) {
      return {
        ...draft,
        metadataVersion: SPS_METADATA_VERSION,
        synchronizedAt: now,
      };
    }

    return {
      productId: draft.productId,
      supplierId: draft.supplierId,
      supplierProductId: config.preserveSupplierProductIdentifiers
        ? draft.supplierProductId
        : draft.supplierProductId.trim(),
      sku: draft.sku?.trim() || null,
      productTitle: draft.productTitle.trim(),
      productDescription: draft.productDescription?.trim() ?? null,
      productCategory: draft.productCategory?.trim() ?? null,
      productImages: draft.productImages?.length ? [...draft.productImages] : null,
      productAttributes: draft.productAttributes ? { ...draft.productAttributes } : null,
      productStatus: draft.productStatus,
      synchronizationStatus: draft.synchronizationStatus,
      supplierMetadata: { ...draft.supplierMetadata },
      metadataVersion: SPS_METADATA_VERSION,
      synchronizedAt: now,
    };
  }
}
