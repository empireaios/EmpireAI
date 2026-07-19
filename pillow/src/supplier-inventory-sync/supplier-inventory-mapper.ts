/** R2-06 — Supplier inventory mapper. */

import { SIS_METADATA_VERSION } from "./paths.js";
import type { SupplierProductRecord } from "../supplier-product-sync/types.js";
import type { SupplierInventorySyncConfiguration } from "./configuration.js";
import type { RawSupplierInventoryPayload, SupplierInventoryRecord } from "./types.js";

export class SupplierInventoryMapper {
  buildInventoryRecordId(supplierId: string, supplierProductId: string): string {
    const safeId = supplierProductId.replace(/[^a-zA-Z0-9_-]/g, "-");
    return `sis-${supplierId}-${safeId}`;
  }

  map(
    payload: RawSupplierInventoryPayload,
    catalog: SupplierProductRecord[],
    config: SupplierInventorySyncConfiguration,
  ): SupplierInventoryRecord | null {
    const product = catalog.find(
      (p) =>
        p.supplierId === payload.supplierId &&
        p.supplierProductId === payload.supplierProductId &&
        p.productStatus === "active",
    );

    const stockAvailabilityStatus = this.resolveStockStatus(payload.quantity, config);
    const now = new Date().toISOString();

    return {
      inventoryRecordId: this.buildInventoryRecordId(payload.supplierId, payload.supplierProductId),
      supplierId: payload.supplierId,
      supplierProductId: payload.supplierProductId,
      internalProductId: product?.productId ?? null,
      currentStockQuantity: payload.quantity,
      stockAvailabilityStatus,
      lastSynchronizationTimestamp: now,
      inventorySource: `supplier:${payload.supplierId}`,
      synchronizationStatus: "synchronized",
      validationStatus: "passed",
      metadataVersion: SIS_METADATA_VERSION,
    };
  }

  mapBatch(
    payloads: RawSupplierInventoryPayload[],
    catalog: SupplierProductRecord[],
    config: SupplierInventorySyncConfiguration,
  ): SupplierInventoryRecord[] {
    if (!config.inventoryMappingRulesEnabled) {
      return payloads.map((p) => this.map(p, catalog, config)).filter((r): r is SupplierInventoryRecord => r !== null);
    }
    return payloads
      .map((p) => this.map(p, catalog, config))
      .filter((r): r is SupplierInventoryRecord => r !== null);
  }

  private resolveStockStatus(
    quantity: number,
    config: SupplierInventorySyncConfiguration,
  ): SupplierInventoryRecord["stockAvailabilityStatus"] {
    if (quantity <= 0) return "out_of_stock";
    if (quantity <= config.lowStockThreshold) return "low_stock";
    return "in_stock";
  }
}
