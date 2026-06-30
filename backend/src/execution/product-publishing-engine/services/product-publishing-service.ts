import fs from "node:fs";
import path from "node:path";

import type { ImportedProduct } from "../../product-import/models/imported-product.js";
import type { MappedProduct } from "../../product-import/models/mapped-product.js";
import { loadRevenueLoopEnv } from "../../../revenue/minimum-live-revenue-loop/config/revenue-loop-env.js";
import { getRevenueLoopRepository } from "../../../revenue/minimum-live-revenue-loop/repositories/sqlite-revenue-loop-repository.js";
import {
  isProductPublishingEnabled,
  loadProductPublishingEnv,
} from "../config/product-publishing-env.js";
import type {
  CatalogPublishRecord,
  ProductAvailability,
  PublishedStoreProduct,
} from "../models/catalog-publish-record.js";
import {
  createPublishRecord,
  createPublishedProductRecord,
  getProductPublishingRepository,
} from "../repositories/sqlite-product-publishing-repository.js";
import {
  buildCatalogJson,
  buildCatalogStorefrontHtml,
} from "./storefront-catalog-builder.js";
import { fetchSupplierProductSnapshots } from "./supplier-snapshot-service.js";

export class ProductPublishingBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductPublishingBlockedError";
  }
}

export type PrepareCatalogPublishInput = {
  workspaceId: string;
  companyId: string;
  storeId: string;
  importedProducts: ImportedProduct[];
  mappedProducts: MappedProduct[];
  metadata?: Record<string, string>;
};

export type ProductUpdateInput = {
  publishedProductId: string;
  title?: string;
  description?: string;
  priceCents?: number;
  compareAtPriceCents?: number | null;
  inventoryQuantity?: number;
};

function resolveAvailability(
  inventoryQuantity: number,
  lowStockThreshold: number,
): ProductAvailability {
  if (inventoryQuantity <= 0) return "OUT_OF_STOCK";
  if (inventoryQuantity <= lowStockThreshold) return "LOW_STOCK";
  return "IN_STOCK";
}

function dollarsToCents(value: number): number {
  return Math.round(value * 100);
}

function savePublish(
  record: CatalogPublishRecord,
  updates: Partial<CatalogPublishRecord>,
): CatalogPublishRecord {
  return getProductPublishingRepository().savePublish({
    ...record,
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

function saveProduct(
  record: PublishedStoreProduct,
  updates: Partial<PublishedStoreProduct>,
): PublishedStoreProduct {
  return getProductPublishingRepository().saveProduct({
    ...record,
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

function writeStorefrontArtifacts(
  publish: CatalogPublishRecord,
  products: PublishedStoreProduct[],
): void {
  const store = getRevenueLoopRepository().getStoreById(publish.storeId);
  if (!store) {
    throw new Error(`Store ${publish.storeId} not found`);
  }

  const revenueConfig = loadRevenueLoopEnv();
  fs.mkdirSync(publish.deployPath, { recursive: true });
  fs.writeFileSync(
    path.join(publish.deployPath, "catalog.json"),
    buildCatalogJson(products),
    "utf8",
  );
  fs.writeFileSync(
    path.join(publish.deployPath, "index.html"),
    buildCatalogStorefrontHtml({
      storeSlug: publish.storeSlug,
      storeBaseUrl: revenueConfig.REVENUE_LOOP_STORE_BASE_URL,
      checkoutPath: `/store/${publish.storeSlug}/checkout`,
      analytics: store.analytics,
      products,
    }),
    "utf8",
  );
}

/** Prepares a catalog publish job from imported supplier products. */
export function prepareCatalogPublish(input: PrepareCatalogPublishInput): CatalogPublishRecord {
  const env = loadProductPublishingEnv();
  if (!isProductPublishingEnabled(env)) {
    throw new ProductPublishingBlockedError("Product publishing is disabled");
  }

  const store = getRevenueLoopRepository().getStoreById(input.storeId);
  if (!store) {
    throw new Error(`Deployed store ${input.storeId} not found`);
  }
  if (store.workspaceId !== input.workspaceId) {
    throw new Error("Store workspace mismatch");
  }

  const repository = getProductPublishingRepository();
  const existing = repository.getPublishByStoreId(input.storeId);
  if (existing && existing.status !== "FAILED") {
    return existing;
  }

  const mappedByImportId = new Map(
    input.mappedProducts.map((mapped) => [mapped.importId, mapped]),
  );
  const importable = input.importedProducts.filter((product) => product.status === "IMPORTED");

  const publish = repository.savePublish(
    createPublishRecord({
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      storeId: input.storeId,
      storeSlug: store.slug,
      deployPath: store.deployPath,
      status: "READY",
      productCount: importable.length,
      publishedProductCount: 0,
      lastErrorMessage: null,
      lastPublishedAt: null,
      lastSyncedAt: null,
      mock: env.PRODUCT_PUBLISHING_MOCK,
      metadata: input.metadata ?? {},
    }),
  );

  for (const imported of importable) {
    const mapped = mappedByImportId.get(imported.importId);
    if (!mapped || mapped.status !== "MAPPED") continue;

    repository.saveProduct(
      createPublishedProductRecord({
        publishId: publish.publishId,
        storeId: input.storeId,
        workspaceId: input.workspaceId,
        companyId: input.companyId,
        importId: imported.importId,
        supplierSku: imported.supplierSku,
        storeProductHandle: mapped.storeProductHandle,
        pageRoute: mapped.pageRoute,
        title: imported.title,
        description: imported.description,
        priceCents: dollarsToCents(imported.retailPrice),
        compareAtPriceCents:
          imported.compareAtPrice !== null ? dollarsToCents(imported.compareAtPrice) : null,
        currency: imported.currency,
        inventoryQuantity: imported.inventoryQuantity,
        availability: resolveAvailability(
          imported.inventoryQuantity,
          env.PRODUCT_PUBLISHING_LOW_STOCK_THRESHOLD,
        ),
        status: "DRAFT",
        lastSyncedAt: null,
        mock: env.PRODUCT_PUBLISHING_MOCK,
        metadata: {},
      }),
    );
  }

  return publish;
}

/** Publishes prepared catalog to the deployed storefront filesystem. */
export function publishCatalogToStorefront(publishId: string): CatalogPublishRecord {
  const env = loadProductPublishingEnv();
  if (!isProductPublishingEnabled(env)) {
    throw new ProductPublishingBlockedError("Product publishing is disabled");
  }

  const repository = getProductPublishingRepository();
  const publish = repository.getPublishById(publishId);
  if (!publish) {
    throw new Error(`Publish job ${publishId} not found`);
  }

  const products = repository.listProductsByPublishId(publishId);
  if (products.length === 0) {
    return savePublish(publish, {
      status: "FAILED",
      lastErrorMessage: "No publishable products found",
    });
  }

  try {
    const publishedProducts = products.map((product) =>
      saveProduct(product, { status: "PUBLISHED" }),
    );
    writeStorefrontArtifacts(publish, publishedProducts);

    const publishedCount = publishedProducts.length;
    const status =
      publishedCount === publish.productCount
        ? "PUBLISHED"
        : publishedCount > 0
          ? "PARTIAL"
          : "FAILED";

    return savePublish(publish, {
      status,
      publishedProductCount: publishedCount,
      lastPublishedAt: new Date().toISOString(),
      lastErrorMessage: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Catalog publish failed";
    return savePublish(publish, {
      status: "FAILED",
      lastErrorMessage: message,
    });
  }
}

/** Syncs inventory from supplier snapshots onto published products. */
export async function syncPublishedInventory(publishId: string): Promise<CatalogPublishRecord> {
  const repository = getProductPublishingRepository();
  const publish = repository.getPublishById(publishId);
  if (!publish) {
    throw new Error(`Publish job ${publishId} not found`);
  }

  const products = repository.listProductsByPublishId(publishId);
  const snapshots = await fetchSupplierProductSnapshots(products.map((p) => p.supplierSku));
  const env = loadProductPublishingEnv();
  const syncedAt = new Date().toISOString();

  const updatedProducts = products.map((product) => {
    const snapshot = snapshots.get(product.supplierSku);
    if (!snapshot) {
      return saveProduct(product, {
        availability: "UNAVAILABLE",
        status: "UNAVAILABLE",
        lastSyncedAt: syncedAt,
      });
    }

    return saveProduct(product, {
      inventoryQuantity: snapshot.inventoryQuantity,
      availability: resolveAvailability(
        snapshot.inventoryQuantity,
        env.PRODUCT_PUBLISHING_LOW_STOCK_THRESHOLD,
      ),
      status: product.status === "DRAFT" ? product.status : "SYNCED",
      lastSyncedAt: syncedAt,
    });
  });

  if (publish.status === "PUBLISHED" || publish.status === "PARTIAL" || publish.status === "SYNCED") {
    writeStorefrontArtifacts(publish, updatedProducts);
  }

  return savePublish(publish, {
    status: publish.status === "PUBLISHED" ? "SYNCED" : publish.status,
    lastSyncedAt: syncedAt,
  });
}

/** Recalculates retail prices from supplier cost snapshots. */
export async function syncPublishedPrices(publishId: string): Promise<CatalogPublishRecord> {
  const env = loadProductPublishingEnv();
  const repository = getProductPublishingRepository();
  const publish = repository.getPublishById(publishId);
  if (!publish) {
    throw new Error(`Publish job ${publishId} not found`);
  }

  const products = repository.listProductsByPublishId(publishId);
  const snapshots = await fetchSupplierProductSnapshots(products.map((p) => p.supplierSku));
  const markup = env.PRODUCT_PUBLISHING_DEFAULT_MARKUP;
  const syncedAt = new Date().toISOString();

  const updatedProducts = products.map((product) => {
    const snapshot = snapshots.get(product.supplierSku);
    if (!snapshot || snapshot.unitCostCents <= 0) {
      return product;
    }

    const priceCents = Math.round(snapshot.unitCostCents * markup);
    const compareAtPriceCents =
      snapshot.compareAtCostCents !== null
        ? Math.round(snapshot.compareAtCostCents * markup)
        : Math.round(priceCents * 1.25);

    return saveProduct(product, {
      priceCents,
      compareAtPriceCents,
      currency: snapshot.currency,
      lastSyncedAt: syncedAt,
    });
  });

  if (publish.status === "PUBLISHED" || publish.status === "PARTIAL" || publish.status === "SYNCED") {
    writeStorefrontArtifacts(publish, updatedProducts);
  }

  return savePublish(publish, { lastSyncedAt: syncedAt });
}

/** Recomputes availability flags from current inventory levels. */
export function syncPublishedAvailability(publishId: string): CatalogPublishRecord {
  const env = loadProductPublishingEnv();
  const repository = getProductPublishingRepository();
  const publish = repository.getPublishById(publishId);
  if (!publish) {
    throw new Error(`Publish job ${publishId} not found`);
  }

  const products = repository.listProductsByPublishId(publishId);
  const syncedAt = new Date().toISOString();

  const updatedProducts = products.map((product) =>
    saveProduct(product, {
      availability: resolveAvailability(
        product.inventoryQuantity,
        env.PRODUCT_PUBLISHING_LOW_STOCK_THRESHOLD,
      ),
      lastSyncedAt: syncedAt,
    }),
  );

  if (publish.status === "PUBLISHED" || publish.status === "PARTIAL" || publish.status === "SYNCED") {
    writeStorefrontArtifacts(publish, updatedProducts);
  }

  return savePublish(publish, { lastSyncedAt: syncedAt });
}

/** Applies explicit product updates and republishes storefront artifacts. */
export function applyProductUpdates(
  publishId: string,
  updates: ProductUpdateInput[],
): CatalogPublishRecord {
  const env = loadProductPublishingEnv();
  const repository = getProductPublishingRepository();
  const publish = repository.getPublishById(publishId);
  if (!publish) {
    throw new Error(`Publish job ${publishId} not found`);
  }

  const updateMap = new Map(updates.map((entry) => [entry.publishedProductId, entry]));
  const products = repository.listProductsByPublishId(publishId);
  const syncedAt = new Date().toISOString();

  const updatedProducts = products.map((product) => {
    const patch = updateMap.get(product.publishedProductId);
    if (!patch) return product;

    const inventoryQuantity = patch.inventoryQuantity ?? product.inventoryQuantity;
    return saveProduct(product, {
      title: patch.title ?? product.title,
      description: patch.description ?? product.description,
      priceCents: patch.priceCents ?? product.priceCents,
      compareAtPriceCents:
        patch.compareAtPriceCents !== undefined
          ? patch.compareAtPriceCents
          : product.compareAtPriceCents,
      inventoryQuantity,
      availability: resolveAvailability(
        inventoryQuantity,
        env.PRODUCT_PUBLISHING_LOW_STOCK_THRESHOLD,
      ),
      status: product.status === "DRAFT" ? "DRAFT" : "SYNCED",
      lastSyncedAt: syncedAt,
    });
  });

  if (publish.status === "PUBLISHED" || publish.status === "PARTIAL" || publish.status === "SYNCED") {
    writeStorefrontArtifacts(publish, updatedProducts);
  }

  return savePublish(publish, { lastSyncedAt: syncedAt });
}

export function getCatalogPublishById(publishId: string): CatalogPublishRecord | null {
  return getProductPublishingRepository().getPublishById(publishId);
}

export function getCatalogPublishByStoreId(storeId: string): CatalogPublishRecord | null {
  return getProductPublishingRepository().getPublishByStoreId(storeId);
}

export function listCatalogPublishes(
  workspaceId: string,
  companyId?: string,
): CatalogPublishRecord[] {
  return getProductPublishingRepository().listPublishes(workspaceId, companyId);
}

export function listPublishedProducts(storeId: string): PublishedStoreProduct[] {
  return getProductPublishingRepository().listProductsByStoreId(storeId);
}

export function getPublishedProductById(
  publishedProductId: string,
): PublishedStoreProduct | null {
  return getProductPublishingRepository().getProductById(publishedProductId);
}
