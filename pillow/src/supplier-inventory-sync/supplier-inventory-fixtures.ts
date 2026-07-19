/** R2-06 — Supplier inventory fixtures (structural — no live HTTP). */

import type { RawSupplierInventoryPayload } from "./types.js";

export function getFixtureInventory(): RawSupplierInventoryPayload[] {
  return [
    {
      supplierId: "cj-dropshipping",
      supplierProductId: "cj-prod-1001",
      quantity: 250,
      sourceData: { warehouse: "CJ-US-01", last_updated: "2026-01-01" },
    },
    {
      supplierId: "aliexpress",
      supplierProductId: "aex-prod-2002",
      quantity: 45,
      sourceData: { warehouse: "AEX-CN-01", last_updated: "2026-01-02" },
    },
    {
      supplierId: "1688",
      supplierProductId: "oss-prod-3003",
      quantity: 1200,
      sourceData: { warehouse: "OSS-CN-01", last_updated: "2026-01-03" },
    },
  ];
}

export function getFixtureForSupplier(supplierId: string): RawSupplierInventoryPayload[] {
  return getFixtureInventory().filter((p) => p.supplierId === supplierId);
}

export function getChangeFixtures(
  mode: "increase" | "decrease" | "out_of_stock" | "discontinued",
): RawSupplierInventoryPayload[] {
  const base = getFixtureInventory();
  if (mode === "increase") {
    return base.map((p) =>
      p.supplierId === "cj-dropshipping" ? { ...p, quantity: p.quantity + 100 } : p,
    );
  }
  if (mode === "decrease") {
    return base.map((p) =>
      p.supplierId === "aliexpress" ? { ...p, quantity: Math.max(0, p.quantity - 30) } : p,
    );
  }
  if (mode === "out_of_stock") {
    return base.map((p) =>
      p.supplierId === "aliexpress" ? { ...p, quantity: 0 } : p,
    );
  }
  return base.filter((p) => p.supplierId !== "1688");
}

export function getInvalidFixture(): RawSupplierInventoryPayload {
  return {
    supplierId: "cj-dropshipping",
    supplierProductId: "",
    quantity: -5,
  };
}
