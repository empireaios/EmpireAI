/** R1-13 — Order duplicate detector. */

import type { MarketplaceOrderNormalizationConfiguration } from "./configuration.js";
import type { DuplicateOrderGroup, NormalizedOrderRecord } from "./types.js";

export class OrderDuplicateDetector {
  detect(
    orders: NormalizedOrderRecord[],
    config: MarketplaceOrderNormalizationConfiguration,
  ): DuplicateOrderGroup[] {
    if (!config.duplicateDetectionRulesEnabled || orders.length === 0) {
      return [];
    }

    const groups: DuplicateOrderGroup[] = [];
    const marketplaceIdMap = new Map<string, NormalizedOrderRecord[]>();
    const customerRefMap = new Map<string, NormalizedOrderRecord[]>();
    const totalMap = new Map<string, NormalizedOrderRecord[]>();

    for (const order of orders) {
      const mpKey = `${order.marketplaceIdentifier}::${order.marketplaceOrderId}`;
      const mpExisting = marketplaceIdMap.get(mpKey) ?? [];
      mpExisting.push(order);
      marketplaceIdMap.set(mpKey, mpExisting);

      if (order.customerReference) {
        const refKey = order.customerReference.toLowerCase();
        const refExisting = customerRefMap.get(refKey) ?? [];
        refExisting.push(order);
        customerRefMap.set(refKey, refExisting);
      }

      const totalKey = `${order.pricingSummary.total}::${order.currency}`;
      const totalExisting = totalMap.get(totalKey) ?? [];
      totalExisting.push(order);
      totalMap.set(totalKey, totalExisting);
    }

    for (const [matchKey, items] of marketplaceIdMap) {
      if (items.length > 1) {
        groups.push({
          groupId: `mon-dup-mpid-${matchKey.replace(/[^a-z0-9]/gi, "-")}`,
          matchKey,
          matchType: "marketplace_order_id",
          orders: items,
        });
      }
    }

    for (const [matchKey, items] of customerRefMap) {
      if (items.length > 1) {
        const alreadyGrouped = groups.some(
          (g) => g.matchType === "marketplace_order_id" && items.every((o) => g.orders.includes(o)),
        );
        if (!alreadyGrouped) {
          groups.push({
            groupId: `mon-dup-cust-${matchKey.replace(/[^a-z0-9@.]/gi, "-")}`,
            matchKey,
            matchType: "customer_reference",
            orders: items,
          });
        }
      }
    }

    for (const [matchKey, items] of totalMap) {
      if (items.length > 1 && items.some((a) => items.filter((b) => b !== a).length > 0)) {
        const uniqueCustomers = new Set(items.map((o) => o.customerReference));
        if (uniqueCustomers.size > 1) {
          groups.push({
            groupId: `mon-dup-total-${matchKey.replace(/[^a-z0-9.]/gi, "-")}`,
            matchKey,
            matchType: "order_total",
            orders: items,
          });
        }
      }
    }

    return groups;
  }
}
