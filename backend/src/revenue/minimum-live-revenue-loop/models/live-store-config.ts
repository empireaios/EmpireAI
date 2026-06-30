import { z } from "zod";

export const LIVE_STORE_STATUSES = [
  "DRAFT",
  "DEPLOYED",
  "CHECKOUT_ENABLED",
  "SUSPENDED",
] as const;

export type LiveStoreStatus = (typeof LIVE_STORE_STATUSES)[number];

export type LiveStoreAnalytics = {
  ga4MeasurementId: string;
  metaPixelId: string;
  tiktokPixelId?: string;
};

export type LiveStoreConfig = {
  storeId: string;
  workspaceId: string;
  companyId: string;
  brandId: string;
  slug: string;
  productName: string;
  productDescription: string;
  priceCents: number;
  currency: string;
  cjSupplierSku: string;
  cjSupplierProductId: string;
  unitCostCents: number;
  domain: string | null;
  deployPath: string;
  status: LiveStoreStatus;
  analytics: LiveStoreAnalytics;
};

export const liveStoreAnalyticsSchema = z.object({
  ga4MeasurementId: z.string().min(1),
  metaPixelId: z.string().min(1),
  tiktokPixelId: z.string().optional(),
});

export const liveStoreConfigSchema = z.object({
  storeId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  brandId: z.string().min(1),
  slug: z.string().min(1),
  productName: z.string().min(1),
  productDescription: z.string().min(1),
  priceCents: z.number().int().min(1),
  currency: z.string().length(3),
  cjSupplierSku: z.string().min(1),
  cjSupplierProductId: z.string().min(1),
  unitCostCents: z.number().int().min(0),
  domain: z.string().nullable(),
  deployPath: z.string().min(1),
  status: z.enum(LIVE_STORE_STATUSES),
  analytics: liveStoreAnalyticsSchema,
});

export function validateLiveStoreConfig(value: unknown): LiveStoreConfig {
  return liveStoreConfigSchema.parse(value);
}
