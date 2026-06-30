import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type {
  CatalogPublishRecord,
  PublishedStoreProduct,
} from "../models/catalog-publish-record.js";
import type { ProductPublishingRepository } from "./product-publishing-repository.js";

function nowIso(): string {
  return new Date().toISOString();
}

function mapPublishRow(row: Record<string, unknown>): CatalogPublishRecord {
  return {
    publishId: String(row.publish_id),
    workspaceId: String(row.workspace_id),
    companyId: String(row.company_id),
    storeId: String(row.store_id),
    storeSlug: String(row.store_slug),
    deployPath: String(row.deploy_path),
    status: row.status as CatalogPublishRecord["status"],
    productCount: Number(row.product_count),
    publishedProductCount: Number(row.published_product_count),
    lastErrorMessage: row.last_error_message ? String(row.last_error_message) : null,
    lastPublishedAt: row.last_published_at ? String(row.last_published_at) : null,
    lastSyncedAt: row.last_synced_at ? String(row.last_synced_at) : null,
    mock: Boolean(row.mock),
    metadata: JSON.parse(String(row.metadata_json)),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapProductRow(row: Record<string, unknown>): PublishedStoreProduct {
  return {
    publishedProductId: String(row.published_product_id),
    publishId: String(row.publish_id),
    storeId: String(row.store_id),
    workspaceId: String(row.workspace_id),
    companyId: String(row.company_id),
    importId: String(row.import_id),
    supplierSku: String(row.supplier_sku),
    storeProductHandle: String(row.store_product_handle),
    pageRoute: String(row.page_route),
    title: String(row.title),
    description: String(row.description),
    priceCents: Number(row.price_cents),
    compareAtPriceCents: row.compare_at_price_cents
      ? Number(row.compare_at_price_cents)
      : null,
    currency: String(row.currency),
    inventoryQuantity: Number(row.inventory_quantity),
    availability: row.availability as PublishedStoreProduct["availability"],
    status: row.status as PublishedStoreProduct["status"],
    lastSyncedAt: row.last_synced_at ? String(row.last_synced_at) : null,
    mock: Boolean(row.mock),
    metadata: JSON.parse(String(row.metadata_json)),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

let repositoryInstance: SqliteProductPublishingRepository | null = null;

export function getProductPublishingRepository(): SqliteProductPublishingRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteProductPublishingRepository();
  }
  return repositoryInstance;
}

export function resetProductPublishingRepository(): void {
  repositoryInstance = null;
}

export function createPublishRecord(
  input: Omit<CatalogPublishRecord, "publishId" | "createdAt" | "updatedAt"> & {
    publishId?: string;
  },
): CatalogPublishRecord {
  const timestamp = nowIso();
  return {
    publishId: input.publishId ?? randomUUID(),
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    storeId: input.storeId,
    storeSlug: input.storeSlug,
    deployPath: input.deployPath,
    status: input.status,
    productCount: input.productCount,
    publishedProductCount: input.publishedProductCount,
    lastErrorMessage: input.lastErrorMessage,
    lastPublishedAt: input.lastPublishedAt,
    lastSyncedAt: input.lastSyncedAt,
    mock: input.mock,
    metadata: input.metadata,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function createPublishedProductRecord(
  input: Omit<PublishedStoreProduct, "publishedProductId" | "createdAt" | "updatedAt"> & {
    publishedProductId?: string;
  },
): PublishedStoreProduct {
  const timestamp = nowIso();
  return {
    publishedProductId: input.publishedProductId ?? randomUUID(),
    publishId: input.publishId,
    storeId: input.storeId,
    workspaceId: input.workspaceId,
    companyId: input.companyId,
    importId: input.importId,
    supplierSku: input.supplierSku,
    storeProductHandle: input.storeProductHandle,
    pageRoute: input.pageRoute,
    title: input.title,
    description: input.description,
    priceCents: input.priceCents,
    compareAtPriceCents: input.compareAtPriceCents,
    currency: input.currency,
    inventoryQuantity: input.inventoryQuantity,
    availability: input.availability,
    status: input.status,
    lastSyncedAt: input.lastSyncedAt,
    mock: input.mock,
    metadata: input.metadata,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** SQLite persistence for catalog publishes and storefront products. */
export class SqliteProductPublishingRepository implements ProductPublishingRepository {
  savePublish(record: CatalogPublishRecord): CatalogPublishRecord {
    const db = getDatabase();
    const payload = { ...record, updatedAt: nowIso() };

    db.prepare(
      `INSERT INTO product_catalog_publishes
        (publish_id, workspace_id, company_id, store_id, store_slug, deploy_path, status,
         product_count, published_product_count, last_error_message, last_published_at,
         last_synced_at, mock, metadata_json, created_at, updated_at)
       VALUES
        (@publishId, @workspaceId, @companyId, @storeId, @storeSlug, @deployPath, @status,
         @productCount, @publishedProductCount, @lastErrorMessage, @lastPublishedAt,
         @lastSyncedAt, @mock, @metadataJson, @createdAt, @updatedAt)
       ON CONFLICT(publish_id) DO UPDATE SET
         status = excluded.status,
         product_count = excluded.product_count,
         published_product_count = excluded.published_product_count,
         last_error_message = excluded.last_error_message,
         last_published_at = excluded.last_published_at,
         last_synced_at = excluded.last_synced_at,
         mock = excluded.mock,
         metadata_json = excluded.metadata_json,
         updated_at = excluded.updated_at`,
    ).run({
      publishId: payload.publishId,
      workspaceId: payload.workspaceId,
      companyId: payload.companyId,
      storeId: payload.storeId,
      storeSlug: payload.storeSlug,
      deployPath: payload.deployPath,
      status: payload.status,
      productCount: payload.productCount,
      publishedProductCount: payload.publishedProductCount,
      lastErrorMessage: payload.lastErrorMessage,
      lastPublishedAt: payload.lastPublishedAt,
      lastSyncedAt: payload.lastSyncedAt,
      mock: payload.mock ? 1 : 0,
      metadataJson: JSON.stringify(payload.metadata),
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
    });

    return payload;
  }

  getPublishById(publishId: string): CatalogPublishRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT * FROM product_catalog_publishes WHERE publish_id = @publishId`)
      .get({ publishId });
    return row ? mapPublishRow(row as Record<string, unknown>) : null;
  }

  getPublishByStoreId(storeId: string): CatalogPublishRecord | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT * FROM product_catalog_publishes
         WHERE store_id = @storeId ORDER BY updated_at DESC LIMIT 1`,
      )
      .get({ storeId });
    return row ? mapPublishRow(row as Record<string, unknown>) : null;
  }

  listPublishes(workspaceId: string, companyId?: string): CatalogPublishRecord[] {
    const db = getDatabase();
    const rows = companyId
      ? db
          .prepare(
            `SELECT * FROM product_catalog_publishes
             WHERE workspace_id = @workspaceId AND company_id = @companyId
             ORDER BY created_at DESC`,
          )
          .all({ workspaceId, companyId })
      : db
          .prepare(
            `SELECT * FROM product_catalog_publishes
             WHERE workspace_id = @workspaceId ORDER BY created_at DESC`,
          )
          .all({ workspaceId });

    return (rows as Record<string, unknown>[]).map(mapPublishRow);
  }

  saveProduct(record: PublishedStoreProduct): PublishedStoreProduct {
    const db = getDatabase();
    const payload = { ...record, updatedAt: nowIso() };

    db.prepare(
      `INSERT INTO published_store_products
        (published_product_id, publish_id, store_id, workspace_id, company_id, import_id,
         supplier_sku, store_product_handle, page_route, title, description, price_cents,
         compare_at_price_cents, currency, inventory_quantity, availability, status,
         last_synced_at, mock, metadata_json, created_at, updated_at)
       VALUES
        (@publishedProductId, @publishId, @storeId, @workspaceId, @companyId, @importId,
         @supplierSku, @storeProductHandle, @pageRoute, @title, @description, @priceCents,
         @compareAtPriceCents, @currency, @inventoryQuantity, @availability, @status,
         @lastSyncedAt, @mock, @metadataJson, @createdAt, @updatedAt)
       ON CONFLICT(published_product_id) DO UPDATE SET
         title = excluded.title,
         description = excluded.description,
         price_cents = excluded.price_cents,
         compare_at_price_cents = excluded.compare_at_price_cents,
         inventory_quantity = excluded.inventory_quantity,
         availability = excluded.availability,
         status = excluded.status,
         last_synced_at = excluded.last_synced_at,
         mock = excluded.mock,
         metadata_json = excluded.metadata_json,
         updated_at = excluded.updated_at`,
    ).run({
      publishedProductId: payload.publishedProductId,
      publishId: payload.publishId,
      storeId: payload.storeId,
      workspaceId: payload.workspaceId,
      companyId: payload.companyId,
      importId: payload.importId,
      supplierSku: payload.supplierSku,
      storeProductHandle: payload.storeProductHandle,
      pageRoute: payload.pageRoute,
      title: payload.title,
      description: payload.description,
      priceCents: payload.priceCents,
      compareAtPriceCents: payload.compareAtPriceCents,
      currency: payload.currency,
      inventoryQuantity: payload.inventoryQuantity,
      availability: payload.availability,
      status: payload.status,
      lastSyncedAt: payload.lastSyncedAt,
      mock: payload.mock ? 1 : 0,
      metadataJson: JSON.stringify(payload.metadata),
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
    });

    return payload;
  }

  getProductById(publishedProductId: string): PublishedStoreProduct | null {
    const db = getDatabase();
    const row = db
      .prepare(
        `SELECT * FROM published_store_products WHERE published_product_id = @publishedProductId`,
      )
      .get({ publishedProductId });
    return row ? mapProductRow(row as Record<string, unknown>) : null;
  }

  listProductsByPublishId(publishId: string): PublishedStoreProduct[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM published_store_products
         WHERE publish_id = @publishId ORDER BY created_at ASC`,
      )
      .all({ publishId });
    return (rows as Record<string, unknown>[]).map(mapProductRow);
  }

  listProductsByStoreId(storeId: string): PublishedStoreProduct[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM published_store_products
         WHERE store_id = @storeId ORDER BY created_at ASC`,
      )
      .all({ storeId });
    return (rows as Record<string, unknown>[]).map(mapProductRow);
  }
}
