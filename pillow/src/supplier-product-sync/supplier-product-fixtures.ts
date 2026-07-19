/** R2-05 — Supplier product fixtures (structural — no live HTTP). */

import type { RawSupplierProductPayload } from "./types.js";

export function getFixtureCatalog(): RawSupplierProductPayload[] {
  return [
    {
      supplierId: "cj-dropshipping",
      supplierProductId: "cj-prod-1001",
      sourceData: {
        title: "Wireless Bluetooth Earbuds",
        sku: "CJ-EAR-001",
        description: "Noise cancelling wireless earbuds",
        category: "Electronics",
        price: 12.5,
        currency: "USD",
        images: ["https://images.cj.example/earbuds.jpg"],
        attributes: { color: "Black", connectivity: "Bluetooth" },
      },
    },
    {
      supplierId: "aliexpress",
      supplierProductId: "aex-prod-2002",
      sourceData: {
        title: "Magnetic Phone Mount",
        sku: "AEX-MNT-002",
        description: "Dashboard magnetic phone holder",
        category: "Automotive",
        price: 3.99,
        currency: "USD",
        images: ["https://images.aliexpress.example/mount.jpg"],
        attributes: { material: "Aluminum" },
      },
    },
    {
      supplierId: "1688",
      supplierProductId: "oss-prod-3003",
      sourceData: {
        title: "Wholesale Canvas Tote Bag",
        sku: "OSS-BAG-003",
        description: "Bulk canvas tote bags for retail",
        category: "Bags",
        price: 1.2,
        currency: "USD",
        images: ["https://images.1688.example/tote.jpg"],
        attributes: { material: "Canvas", moq: "100" },
      },
    },
  ];
}

export function getFixtureForSupplier(supplierId: string): RawSupplierProductPayload[] {
  return getFixtureCatalog().filter((p) => p.supplierId === supplierId);
}

export function getDuplicateSkuFixtures(): RawSupplierProductPayload[] {
  return [
    {
      supplierId: "aliexpress",
      supplierProductId: "aex-prod-dup-001",
      sourceData: {
        title: "Duplicate SKU Product",
        sku: "CJ-EAR-001",
        description: "Same SKU as CJ product",
        category: "Electronics",
        price: 11.0,
        currency: "USD",
        images: [],
        attributes: {},
      },
    },
  ];
}

export function getChangeFixtures(mode: "updated" | "discontinued" | "new"): RawSupplierProductPayload[] {
  const base = getFixtureCatalog();
  if (mode === "updated") {
    return base.map((p) =>
      p.supplierId === "cj-dropshipping"
        ? {
            ...p,
            sourceData: {
              ...p.sourceData,
              title: "Wireless Bluetooth Earbuds Pro",
              price: 13.5,
            },
          }
        : p,
    );
  }
  if (mode === "discontinued") {
    return base.filter((p) => p.supplierId !== "aliexpress");
  }
  return [
    ...base,
    {
      supplierId: "1688",
      supplierProductId: "oss-prod-4004",
      sourceData: {
        title: "Wholesale LED Desk Lamp",
        sku: "OSS-LMP-004",
        description: "Bulk LED desk lamps",
        category: "Lighting",
        price: 4.5,
        currency: "USD",
        images: ["https://images.1688.example/lamp.jpg"],
        attributes: { wattage: "5W" },
      },
    },
  ];
}

export function getInvalidFixture(): RawSupplierProductPayload {
  return {
    supplierId: "cj-dropshipping",
    supplierProductId: "",
    sourceData: {},
  };
}
