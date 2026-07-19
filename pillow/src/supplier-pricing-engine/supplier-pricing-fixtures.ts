/** R2-07 — Supplier pricing fixtures (structural — no live HTTP). */

import type { RawSupplierPricingPayload } from "./types.js";

export function getFixturePricing(): RawSupplierPricingPayload[] {
  return [
    {
      supplierId: "cj-dropshipping",
      supplierProductId: "cj-prod-1001",
      price: 12.5,
      currency: "USD",
      sourceData: { price_type: "wholesale", region: "US" },
    },
    {
      supplierId: "aliexpress",
      supplierProductId: "aex-prod-2002",
      price: 3.99,
      currency: "USD",
      sourceData: { price_type: "retail", region: "GLOBAL" },
    },
    {
      supplierId: "1688",
      supplierProductId: "oss-prod-3003",
      price: 1.2,
      currency: "USD",
      sourceData: { price_type: "bulk", moq: 100 },
    },
  ];
}

export function getFixtureForSupplier(supplierId: string): RawSupplierPricingPayload[] {
  return getFixturePricing().filter((p) => p.supplierId === supplierId);
}

export function getChangeFixtures(
  mode: "increase" | "decrease" | "anomaly",
): RawSupplierPricingPayload[] {
  const base = getFixturePricing();
  if (mode === "increase") {
    return base.map((p) =>
      p.supplierId === "cj-dropshipping" ? { ...p, price: p.price + 2.0 } : p,
    );
  }
  if (mode === "decrease") {
    return base.map((p) =>
      p.supplierId === "aliexpress" ? { ...p, price: Math.max(0.01, p.price - 0.5) } : p,
    );
  }
  return base.map((p) =>
    p.supplierId === "1688" ? { ...p, price: p.price * 10 } : p,
  );
}

export function getInvalidFixture(): RawSupplierPricingPayload {
  return {
    supplierId: "cj-dropshipping",
    supplierProductId: "",
    price: -1,
    currency: "USD",
  };
}
