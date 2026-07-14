/** R1-03 — Amazon product change detector. */

import type { AmazonProductChangeSet, AmazonProductRecord } from "./types.js";

export class AmazonProductChangeDetector {
  detect(
    previous: AmazonProductRecord[],
    current: AmazonProductRecord[],
  ): AmazonProductChangeSet {
    const prevByAsin = new Map(previous.map((p) => [p.amazonAsin, p]));
    const currByAsin = new Map(current.map((p) => [p.amazonAsin, p]));

    const newProducts: AmazonProductRecord[] = [];
    const updatedProducts: AmazonProductRecord[] = [];
    const inactiveProducts: AmazonProductRecord[] = [];
    let unchangedCount = 0;

    for (const product of current) {
      const prev = prevByAsin.get(product.amazonAsin);
      if (!prev) {
        newProducts.push({ ...product, synchronizationStatus: "new" });
      } else if (this.hasChanged(prev, product)) {
        updatedProducts.push({ ...product, synchronizationStatus: "updated" });
      } else {
        unchangedCount += 1;
      }
    }

    for (const product of previous) {
      if (!currByAsin.has(product.amazonAsin)) {
        inactiveProducts.push({
          ...product,
          productStatus: "inactive",
          synchronizationStatus: "inactive",
          lastSyncedAt: new Date().toISOString(),
        });
      }
    }

    return { newProducts, updatedProducts, inactiveProducts, unchangedCount };
  }

  private hasChanged(prev: AmazonProductRecord, curr: AmazonProductRecord): boolean {
    return (
      prev.productTitle !== curr.productTitle ||
      prev.productDescription !== curr.productDescription ||
      prev.productCategory !== curr.productCategory ||
      prev.productStatus !== curr.productStatus ||
      prev.amazonSku !== curr.amazonSku
    );
  }
}
