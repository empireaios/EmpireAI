/** R2-05 — Product change detector. */

import type { SupplierProductSyncConfiguration } from "./configuration.js";
import type { ProductChangeFinding, SupplierProductRecord } from "./types.js";

export class ProductChangeDetector {
  detect(
    previousCatalog: SupplierProductRecord[],
    nextCatalog: SupplierProductRecord[],
    config: SupplierProductSyncConfiguration,
  ): ProductChangeFinding[] {
    if (!config.changeDetectionRulesEnabled) return [];

    const changes: ProductChangeFinding[] = [];
    const previousMap = new Map(
      previousCatalog.map((p) => [`${p.supplierId}::${p.supplierProductId}`, p]),
    );
    const nextMap = new Map(
      nextCatalog.map((p) => [`${p.supplierId}::${p.supplierProductId}`, p]),
    );

    for (const [key, product] of nextMap) {
      const previous = previousMap.get(key);
      if (!previous) {
        changes.push({
          changeId: `sps-chg-new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          changeType: "new",
          supplierId: product.supplierId,
          supplierProductId: product.supplierProductId,
          productId: product.productId,
          details: `New supplier product discovered: ${product.productTitle}`,
        });
        continue;
      }

      if (this.hasMeaningfulChange(previous, product)) {
        changes.push({
          changeId: `sps-chg-upd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          changeType: "updated",
          supplierId: product.supplierId,
          supplierProductId: product.supplierProductId,
          productId: product.productId,
          details: `Supplier product updated: ${product.productTitle}`,
        });
      }
    }

    for (const [key, product] of previousMap) {
      if (!nextMap.has(key)) {
        changes.push({
          changeId: `sps-chg-disc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          changeType: "discontinued",
          supplierId: product.supplierId,
          supplierProductId: product.supplierProductId,
          productId: product.productId,
          details: `Supplier product discontinued: ${product.productTitle}`,
        });
      }
    }

    return changes;
  }

  applyDiscontinuedStatus(
    catalog: SupplierProductRecord[],
    changes: ProductChangeFinding[],
  ): SupplierProductRecord[] {
    const discontinuedIds = new Set(
      changes.filter((c) => c.changeType === "discontinued").map((c) => c.productId),
    );
    return catalog.map((product) =>
      discontinuedIds.has(product.productId)
        ? { ...product, productStatus: "discontinued", synchronizationStatus: "synchronized" }
        : product,
    );
  }

  private hasMeaningfulChange(
    previous: SupplierProductRecord,
    next: SupplierProductRecord,
  ): boolean {
    return (
      previous.productTitle !== next.productTitle ||
      previous.sku !== next.sku ||
      previous.productCategory !== next.productCategory ||
      previous.productDescription !== next.productDescription ||
      JSON.stringify(previous.supplierMetadata) !== JSON.stringify(next.supplierMetadata)
    );
  }
}
