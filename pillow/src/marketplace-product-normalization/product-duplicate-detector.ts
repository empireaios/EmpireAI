/** R1-12 — Product duplicate detector. */

import type { MarketplaceProductNormalizationConfiguration } from "./configuration.js";
import type { DuplicateProductGroup, NormalizedProductRecord } from "./types.js";

export class ProductDuplicateDetector {
  detect(
    products: NormalizedProductRecord[],
    config: MarketplaceProductNormalizationConfiguration,
  ): DuplicateProductGroup[] {
    if (!config.duplicateDetectionRulesEnabled || products.length === 0) {
      return [];
    }

    const groups: DuplicateProductGroup[] = [];
    const skuMap = new Map<string, NormalizedProductRecord[]>();
    const titleBrandMap = new Map<string, NormalizedProductRecord[]>();
    const marketplaceIdMap = new Map<string, NormalizedProductRecord[]>();

    for (const product of products) {
      if (product.sku) {
        const key = product.sku.toLowerCase();
        const existing = skuMap.get(key) ?? [];
        existing.push(product);
        skuMap.set(key, existing);
      }

      const titleBrandKey = `${product.productTitle.toLowerCase()}::${(product.productBrand ?? "").toLowerCase()}`;
      const titleExisting = titleBrandMap.get(titleBrandKey) ?? [];
      titleExisting.push(product);
      titleBrandMap.set(titleBrandKey, titleExisting);

      const mpKey = `${product.marketplaceIdentifier}::${product.marketplaceProductId}`;
      const mpExisting = marketplaceIdMap.get(mpKey) ?? [];
      mpExisting.push(product);
      marketplaceIdMap.set(mpKey, mpExisting);
    }

    for (const [matchKey, items] of skuMap) {
      if (items.length > 1) {
        groups.push({
          groupId: `mpn-dup-sku-${matchKey.replace(/[^a-z0-9]/gi, "-")}`,
          matchKey,
          matchType: "sku",
          products: items,
        });
      }
    }

    for (const [matchKey, items] of titleBrandMap) {
      if (items.length > 1 && !items.every((p) => p.sku && skuMap.get(p.sku.toLowerCase())?.length === 1)) {
        const alreadyGrouped = groups.some(
          (g) => g.matchType === "sku" && items.every((p) => g.products.includes(p)),
        );
        if (!alreadyGrouped) {
          groups.push({
            groupId: `mpn-dup-title-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            matchKey,
            matchType: "title_brand",
            products: items,
          });
        }
      }
    }

    for (const [matchKey, items] of marketplaceIdMap) {
      if (items.length > 1) {
        groups.push({
          groupId: `mpn-dup-mpid-${matchKey.replace(/[^a-z0-9]/gi, "-")}`,
          matchKey,
          matchType: "marketplace_product_id",
          products: items,
        });
      }
    }

    return groups;
  }
}
