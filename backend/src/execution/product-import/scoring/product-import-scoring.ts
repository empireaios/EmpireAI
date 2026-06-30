import { randomUUID } from "node:crypto";

import type { SupplierInventory } from "../../../suppliers/supplier-product-synchronization/models/supplier-inventory.js";
import type { SupplierPricing } from "../../../suppliers/supplier-product-synchronization/models/supplier-pricing.js";
import type { SupplierProduct } from "../../../suppliers/supplier-product-synchronization/models/supplier-product.js";
import type { CatalogStatus } from "../models/catalog-status.js";
import type { ImportedProduct } from "../models/imported-product.js";
import type { MappedProduct } from "../models/mapped-product.js";
import type { ProductImportRecordCreateInput } from "../models/product-import-record.js";
import type { ProductImportSignal, ProductImportSignalType } from "../models/product-import-signal.js";

export const PRODUCT_IMPORT_SIGNAL_WEIGHTS: Record<ProductImportSignalType, number> = {
  supplier_alignment: 0.22,
  import_coverage: 0.2,
  mapping_coverage: 0.2,
  pricing_markup: 0.14,
  inventory_readiness: 0.14,
  catalog_composite: 0.1,
};

export type ProductImportStoreInput = {
  storeId: string;
  brandId: string;
  generatedStorefrontId?: string;
  defaultCollectionHandle?: string;
};

export type ProductImportSupplierItemInput = {
  supplierProduct: SupplierProduct;
  supplierInventory: SupplierInventory;
  supplierPricing: SupplierPricing;
};

export type ProductImportInput = {
  store: ProductImportStoreInput;
  supplierItems: ProductImportSupplierItemInput[];
  retailMarkupMultiplier?: number;
};

export type ProductImportBreakdown = ProductImportRecordCreateInput;

const DEFAULT_MARKUP = 2.2;
const DEFAULT_COLLECTION = "featured";

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function buildSignal(
  signalType: ProductImportSignalType,
  score: number,
  detail: string,
): ProductImportSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: PRODUCT_IMPORT_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function buildImportedProduct(
  store: ProductImportStoreInput,
  item: ProductImportSupplierItemInput,
  markup: number,
): ImportedProduct {
  const { supplierProduct, supplierInventory, supplierPricing } = item;
  const canImport =
    supplierProduct.title.length > 0 &&
    supplierPricing.unitPrice > 0 &&
    supplierInventory.quantity >= 0;

  const retailPrice = roundCurrency(supplierPricing.unitPrice * markup);
  const compareAtPrice =
    supplierPricing.compareAtPrice !== null
      ? roundCurrency(supplierPricing.compareAtPrice * markup)
      : roundCurrency(retailPrice * 1.25);

  return {
    importId: randomUUID(),
    storeId: store.storeId,
    brandId: store.brandId,
    connectorId: supplierProduct.connectorId,
    platform: supplierProduct.platform,
    supplierSku: supplierProduct.supplierSku,
    productEntityId: supplierProduct.productEntityId,
    title: supplierProduct.title,
    description: supplierProduct.description,
    retailPrice,
    compareAtPrice,
    currency: supplierPricing.currency,
    inventoryQuantity: supplierInventory.quantity,
    status: canImport ? "IMPORTED" : "FAILED",
  };
}

function buildMappedProduct(
  store: ProductImportStoreInput,
  imported: ImportedProduct,
): MappedProduct {
  const handle =
    imported.productEntityId !== null
      ? slugify(imported.title).slice(0, 48) || slugify(imported.supplierSku)
      : slugify(imported.supplierSku);
  const collectionHandle = store.defaultCollectionHandle ?? DEFAULT_COLLECTION;
  const canMap = imported.status === "IMPORTED" && handle.length > 0;

  return {
    mappingId: randomUUID(),
    storeId: store.storeId,
    importId: imported.importId,
    supplierSku: imported.supplierSku,
    productEntityId: imported.productEntityId,
    storeProductHandle: handle,
    collectionHandle,
    pageRoute: `/products/${handle}`,
    status: canMap ? "MAPPED" : "FAILED",
  };
}

function resolveCatalogStatus(
  importedProducts: ImportedProduct[],
  mappedProducts: MappedProduct[],
): CatalogStatus {
  const importedCount = importedProducts.filter((product) => product.status === "IMPORTED").length;
  const mappedCount = mappedProducts.filter((product) => product.status === "MAPPED").length;
  const total = importedProducts.length;

  if (total === 0 || importedCount === 0) return "CATALOG_FAILED";
  if (mappedCount === importedCount && importedCount === total) return "CATALOG_MAPPED";
  if (mappedCount > 0) return "CATALOG_PARTIAL";
  return "CATALOG_IMPORTED";
}

function computeConfidence(
  importedProducts: ImportedProduct[],
  mappedProducts: MappedProduct[],
  signals: ProductImportSignal[],
): number {
  const importedCount = importedProducts.filter((product) => product.status === "IMPORTED").length;
  const mappedCount = mappedProducts.filter((product) => product.status === "MAPPED").length;
  const total = Math.max(importedProducts.length, 1);

  return clampScore(
    (importedCount / total) * 100 * 0.35 +
      (mappedCount / total) * 100 * 0.35 +
      average(signals.map((signal) => signal.score)) * 0.3,
  );
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function buildSignals(
  store: ProductImportStoreInput,
  importedProducts: ImportedProduct[],
  mappedProducts: MappedProduct[],
  markup: number,
  confidence: number,
): ProductImportSignal[] {
  const importedCount = importedProducts.filter((product) => product.status === "IMPORTED").length;
  const mappedCount = mappedProducts.filter((product) => product.status === "MAPPED").length;
  const inStockCount = importedProducts.filter((product) => product.inventoryQuantity > 0).length;

  return [
    buildSignal(
      "supplier_alignment",
      importedProducts.every((product) => product.connectorId.length > 0) ? 88 : 52,
      `Importing into store ${store.storeId}`,
    ),
    buildSignal(
      "import_coverage",
      importedProducts.length === 0 ? 0 : clampScore((importedCount / importedProducts.length) * 100),
      `${importedCount}/${importedProducts.length} products imported`,
    ),
    buildSignal(
      "mapping_coverage",
      importedProducts.length === 0 ? 0 : clampScore((mappedCount / importedProducts.length) * 100),
      `${mappedCount}/${importedProducts.length} products mapped to store catalog`,
    ),
    buildSignal(
      "pricing_markup",
      markup >= 1.5 ? 86 : 58,
      `Retail markup multiplier ${markup}`,
    ),
    buildSignal(
      "inventory_readiness",
      importedProducts.length === 0 ? 0 : clampScore((inStockCount / importedProducts.length) * 100),
      `${inStockCount} imported products in stock`,
    ),
    buildSignal("catalog_composite", confidence, `Catalog import confidence ${confidence}`),
  ];
}

/** Imports supplier products into a generated store catalog without publishing. */
export function importSupplierProducts(input: ProductImportInput): ProductImportBreakdown {
  const { store, supplierItems } = input;
  const markup = input.retailMarkupMultiplier ?? DEFAULT_MARKUP;

  const importedProducts = supplierItems.map((item) =>
    buildImportedProduct(store, item, markup),
  );
  const mappedProducts = importedProducts.map((imported) =>
    buildMappedProduct(store, imported),
  );
  const catalogStatus = resolveCatalogStatus(importedProducts, mappedProducts);

  const provisionalSignals = buildSignals(store, importedProducts, mappedProducts, markup, 0);
  const confidence = computeConfidence(importedProducts, mappedProducts, provisionalSignals);
  const signals = buildSignals(store, importedProducts, mappedProducts, markup, confidence);

  return {
    storeId: store.storeId,
    brandId: store.brandId,
    generatedStorefrontId: store.generatedStorefrontId ?? null,
    importedProducts,
    mappedProducts,
    catalogStatus,
    confidence,
    signals,
  };
}

export const productImportScoring = {
  importSupplierProducts,
  weights: PRODUCT_IMPORT_SIGNAL_WEIGHTS,
};
