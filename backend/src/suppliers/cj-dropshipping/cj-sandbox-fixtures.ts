import type { CjProduct } from "./cj-types.js";

/** Deterministic CJ sandbox catalog fixtures for integration testing without credentials. */
export const CJ_SANDBOX_PRODUCTS: CjProduct[] = [
  {
    pid: "cj-sandbox-blender-001",
    productName: "CJ Sandbox Kitchen Blender",
    productNameEn: "CJ Sandbox Kitchen Blender",
    productSku: "CJ-BLENDER-001",
    productImage: "https://cdn.example.com/cj/blender-main.jpg",
    productImageSet: [
      "https://cdn.example.com/cj/blender-main.jpg",
      "https://cdn.example.com/cj/blender-side.jpg",
    ],
    categoryId: "kitchen-appliances",
    categoryName: "Kitchen Appliances",
    sellPrice: 24.99,
    suggestSellPrice: 39.99,
    description: "High-performance kitchen blender sourced from CJ sandbox catalog.",
    tags: ["kitchen", "blender", "cj", "sandbox"],
    variants: [
      {
        vid: "cj-sandbox-blender-v1",
        sku: "CJ-BLENDER-001-BLK",
        variantName: "Black",
        sellPrice: 24.99,
        suggestSellPrice: 39.99,
        inventory: 240,
        warehouseInventory: [
          { warehouseCode: "US-WH-01", warehouseName: "US Warehouse", region: "US", inventory: 180 },
          { warehouseCode: "EU-WH-01", warehouseName: "EU Warehouse", region: "EU", inventory: 60 },
        ],
      },
    ],
  },
  {
    pid: "cj-sandbox-pitcher-002",
    productName: "CJ Sandbox Replacement Pitcher",
    productNameEn: "CJ Sandbox Replacement Pitcher",
    productSku: "CJ-PITCHER-002",
    productImage: "https://cdn.example.com/cj/pitcher-main.jpg",
    categoryId: "kitchen-accessories",
    categoryName: "Kitchen Accessories",
    sellPrice: 12.5,
    suggestSellPrice: 19.99,
    description: "Replacement pitcher accessory from CJ sandbox catalog.",
    tags: ["accessory", "pitcher", "cj", "sandbox"],
    variants: [
      {
        vid: "cj-sandbox-pitcher-v1",
        sku: "CJ-PITCHER-002-CLR",
        variantName: "Clear",
        sellPrice: 12.5,
        suggestSellPrice: 19.99,
        inventory: 120,
        warehouseInventory: [
          { warehouseCode: "US-WH-01", warehouseName: "US Warehouse", region: "US", inventory: 120 },
        ],
      },
    ],
  },
];

/** Returns CJ sandbox products optionally filtered by keyword. */
export function getCjSandboxProducts(keyword?: string): CjProduct[] {
  if (!keyword?.trim()) {
    return CJ_SANDBOX_PRODUCTS.map((product) => structuredClone(product));
  }

  const normalized = keyword.trim().toLowerCase();
  return CJ_SANDBOX_PRODUCTS.filter((product) =>
    [product.productName, product.productNameEn, product.productSku]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(normalized)),
  ).map((product) => structuredClone(product));
}
