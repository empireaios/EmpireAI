/** R2-05 — Supplier product mapper. */

import type { SupplierProductSyncConfiguration } from "./configuration.js";
import type { RawSupplierProductPayload, SupplierProductRecord } from "./types.js";
import { SupplierCatalogEngine } from "./supplier-catalog-engine.js";

export class SupplierProductMapper {
  private readonly catalogEngine = new SupplierCatalogEngine();

  map(
    payload: RawSupplierProductPayload,
    config: SupplierProductSyncConfiguration,
  ): SupplierProductRecord | null {
    if (!this.catalogEngine.isSupportedSupplier(payload.supplierId)) {
      return null;
    }

    const source = payload.sourceData;
    const images = this.extractImages(source);
    const attributes = this.extractAttributes(source);

    const draft: Omit<SupplierProductRecord, "metadataVersion" | "synchronizedAt"> = {
      productId: this.catalogEngine.buildProductId(payload.supplierId, payload.supplierProductId),
      supplierId: payload.supplierId,
      supplierProductId: payload.supplierProductId,
      sku: (source.sku as string) ?? null,
      productTitle: String(source.title ?? source.name ?? source.product_name ?? ""),
      productDescription: (source.description as string) ?? null,
      productCategory: (source.category as string) ?? null,
      productImages: images,
      productAttributes: attributes,
      productStatus: "active",
      synchronizationStatus: "synchronized",
      supplierMetadata: { supplier_product_id: payload.supplierProductId, ...source },
    };

    return this.catalogEngine.applyCatalogSchema(draft, config);
  }

  mapBatch(
    payloads: RawSupplierProductPayload[],
    config: SupplierProductSyncConfiguration,
  ): SupplierProductRecord[] {
    return payloads
      .map((p) => this.map(p, config))
      .filter((p): p is SupplierProductRecord => p !== null);
  }

  private extractImages(source: Record<string, unknown>): string[] | null {
    const images = source.images;
    if (!images) return null;
    if (Array.isArray(images)) {
      return images.map((img) =>
        typeof img === "string" ? img : String((img as { src?: string }).src ?? ""),
      );
    }
    return null;
  }

  private extractAttributes(source: Record<string, unknown>): Record<string, string> | null {
    const attrs = source.attributes;
    if (!attrs || typeof attrs !== "object") return null;
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(attrs as Record<string, unknown>)) {
      result[key] = String(value);
    }
    return Object.keys(result).length > 0 ? result : null;
  }
}
