import { z } from "zod";

export const PUBLISH_CATALOG_STATUSES = [
  "DRAFT",
  "READY",
  "PUBLISHED",
  "PARTIAL",
  "SYNCED",
  "FAILED",
] as const;

export type PublishCatalogStatus = (typeof PUBLISH_CATALOG_STATUSES)[number];

export const PUBLISHED_PRODUCT_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "SYNCED",
  "UNAVAILABLE",
  "FAILED",
] as const;

export type PublishedProductStatus = (typeof PUBLISHED_PRODUCT_STATUSES)[number];

export const PRODUCT_AVAILABILITY = [
  "IN_STOCK",
  "LOW_STOCK",
  "OUT_OF_STOCK",
  "UNAVAILABLE",
] as const;

export type ProductAvailability = (typeof PRODUCT_AVAILABILITY)[number];

/** Published product on a deployed storefront. */
export type PublishedStoreProduct = {
  publishedProductId: string;
  publishId: string;
  storeId: string;
  workspaceId: string;
  companyId: string;
  importId: string;
  supplierSku: string;
  storeProductHandle: string;
  pageRoute: string;
  title: string;
  description: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  currency: string;
  inventoryQuantity: number;
  availability: ProductAvailability;
  status: PublishedProductStatus;
  lastSyncedAt: string | null;
  mock: boolean;
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

/** Catalog publish job linking imported products to a deployed store. */
export type CatalogPublishRecord = {
  publishId: string;
  workspaceId: string;
  companyId: string;
  storeId: string;
  storeSlug: string;
  deployPath: string;
  status: PublishCatalogStatus;
  productCount: number;
  publishedProductCount: number;
  lastErrorMessage: string | null;
  lastPublishedAt: string | null;
  lastSyncedAt: string | null;
  mock: boolean;
  metadata: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export const publishedStoreProductSchema = z.object({
  publishedProductId: z.string().min(1),
  publishId: z.string().min(1),
  storeId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  importId: z.string().min(1),
  supplierSku: z.string().min(1),
  storeProductHandle: z.string().min(1),
  pageRoute: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  priceCents: z.number().int().min(0),
  compareAtPriceCents: z.number().int().min(0).nullable(),
  currency: z.string().length(3),
  inventoryQuantity: z.number().int().min(0),
  availability: z.enum(PRODUCT_AVAILABILITY),
  status: z.enum(PUBLISHED_PRODUCT_STATUSES),
  lastSyncedAt: z.string().datetime({ offset: true }).nullable(),
  mock: z.boolean(),
  metadata: z.record(z.string()),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export const catalogPublishRecordSchema = z.object({
  publishId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  storeId: z.string().min(1),
  storeSlug: z.string().min(1),
  deployPath: z.string().min(1),
  status: z.enum(PUBLISH_CATALOG_STATUSES),
  productCount: z.number().int().min(0),
  publishedProductCount: z.number().int().min(0),
  lastErrorMessage: z.string().nullable(),
  lastPublishedAt: z.string().datetime({ offset: true }).nullable(),
  lastSyncedAt: z.string().datetime({ offset: true }).nullable(),
  mock: z.boolean(),
  metadata: z.record(z.string()),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export function validateCatalogPublishRecord(value: unknown): CatalogPublishRecord {
  return catalogPublishRecordSchema.parse(value);
}
