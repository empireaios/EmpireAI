import { z } from "zod";

export const ANALYTICS_PLATFORMS = ["GA4", "META", "TIKTOK"] as const;
export type AnalyticsPlatform = (typeof ANALYTICS_PLATFORMS)[number];

export const CONVERSION_EVENT_NAMES = [
  "page_view",
  "begin_checkout",
  "add_to_cart",
  "purchase",
  "lead",
] as const;

export type ConversionEventName = (typeof CONVERSION_EVENT_NAMES)[number];

export type PixelConfig = {
  configId: string;
  workspaceId: string;
  companyId: string;
  storeId: string | null;
  ga4MeasurementId: string | null;
  ga4ApiSecret: string | null;
  metaPixelId: string | null;
  metaAccessToken: string | null;
  tiktokPixelId: string | null;
  tiktokAccessToken: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ServerSideEventRecord = {
  eventId: string;
  workspaceId: string;
  companyId: string;
  eventName: ConversionEventName;
  platforms: AnalyticsPlatform[];
  correlationId: string;
  valueCents: number;
  currency: string;
  customerEmail: string | null;
  payload: Record<string, string>;
  dispatchResults: Record<string, "sent" | "mock" | "failed">;
  mock: boolean;
  createdAt: string;
};

export type ConversionRecord = {
  conversionId: string;
  workspaceId: string;
  companyId: string;
  storeId: string | null;
  paymentId: string | null;
  pipelineId: string | null;
  eventName: ConversionEventName;
  valueCents: number;
  currency: string;
  correlationId: string;
  platforms: AnalyticsPlatform[];
  serverEventId: string;
  attributed: boolean;
  createdAt: string;
};

export type RoasSnapshot = {
  snapshotId: string;
  workspaceId: string;
  companyId: string;
  period: string;
  revenueCents: number;
  adSpendCents: number;
  roas: number;
  conversionCount: number;
  currency: string;
  computedAt: string;
};

export const pixelConfigSchema = z.object({
  configId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  storeId: z.string().nullable(),
  ga4MeasurementId: z.string().nullable(),
  ga4ApiSecret: z.string().nullable(),
  metaPixelId: z.string().nullable(),
  metaAccessToken: z.string().nullable(),
  tiktokPixelId: z.string().nullable(),
  tiktokAccessToken: z.string().nullable(),
  enabled: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export const serverSideEventRecordSchema = z.object({
  eventId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  eventName: z.enum(CONVERSION_EVENT_NAMES),
  platforms: z.array(z.enum(ANALYTICS_PLATFORMS)).min(1),
  correlationId: z.string().min(1),
  valueCents: z.number().int().min(0),
  currency: z.string().length(3),
  customerEmail: z.string().nullable(),
  payload: z.record(z.string()),
  dispatchResults: z.record(z.enum(["sent", "mock", "failed"])),
  mock: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
});

export const conversionRecordSchema = z.object({
  conversionId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  storeId: z.string().nullable(),
  paymentId: z.string().nullable(),
  pipelineId: z.string().nullable(),
  eventName: z.enum(CONVERSION_EVENT_NAMES),
  valueCents: z.number().int().min(0),
  currency: z.string().length(3),
  correlationId: z.string().min(1),
  platforms: z.array(z.enum(ANALYTICS_PLATFORMS)).min(1),
  serverEventId: z.string().min(1),
  attributed: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
});

export const roasSnapshotSchema = z.object({
  snapshotId: z.string().min(1),
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  period: z.string().min(1),
  revenueCents: z.number().int().min(0),
  adSpendCents: z.number().int().min(0),
  roas: z.number().min(0),
  conversionCount: z.number().int().min(0),
  currency: z.string().length(3),
  computedAt: z.string().datetime({ offset: true }),
});

export function validateConversionRecord(value: unknown): ConversionRecord {
  return conversionRecordSchema.parse(value);
}

export function validateRoasSnapshot(value: unknown): RoasSnapshot {
  return roasSnapshotSchema.parse(value);
}
