/** R2-05 — Product duplicate detector. */

import type { SupplierProductSyncConfiguration } from "./configuration.js";
import type { DuplicateProductGroup, SupplierProductRecord } from "./types.js";

export class ProductDuplicateDetector {
  detect(
    products: SupplierProductRecord[],
    config: SupplierProductSyncConfiguration,
  ): DuplicateProductGroup[] {
    if (!config.duplicateDetectionRulesEnabled || products.length === 0) {
      return [];
    }

    const groups: DuplicateProductGroup[] = [];
    const skuMap = new Map<string, SupplierProductRecord[]>();
    const titleCategoryMap = new Map<string, SupplierProductRecord[]>();
    const supplierIdMap = new Map<string, SupplierProductRecord[]>();

    for (const product of products) {
      if (product.sku) {
        const key = product.sku.toLowerCase();
        const existing = skuMap.get(key) ?? [];
        existing.push(product);
        skuMap.set(key, existing);
      }

      const titleCategoryKey = `${product.productTitle.toLowerCase()}::${(product.productCategory ?? "").toLowerCase()}`;
      const titleExisting = titleCategoryMap.get(titleCategoryKey) ?? [];
      titleExisting.push(product);
      titleCategoryMap.set(titleCategoryKey, titleExisting);

      const supplierKey = `${product.supplierId}::${product.supplierProductId}`;
      const supplierExisting = supplierIdMap.get(supplierKey) ?? [];
      supplierExisting.push(product);
      supplierIdMap.set(supplierKey, supplierExisting);
    }

    for (const [matchKey, items] of skuMap) {
      if (items.length > 1) {
        groups.push({
          groupId: `sps-dup-sku-${matchKey.replace(/[^a-z0-9]/gi, "-")}`,
          matchKey,
          matchType: "sku",
          products: items,
        });
      }
    }

    for (const [matchKey, items] of supplierIdMap) {
      if (items.length > 1) {
        groups.push({
          groupId: `sps-dup-spid-${matchKey.replace(/[^a-z0-9]/gi, "-")}`,
          matchKey,
          matchType: "supplier_product_id",
          products: items,
        });
      }
    }

    return groups;
  }
}
