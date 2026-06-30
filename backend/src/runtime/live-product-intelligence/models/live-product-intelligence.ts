import { z } from "zod";

/** REAL-013 — Live product lifecycle classifications. */
export const PRODUCT_LIFECYCLE_LABELS = [
  "WINNER",
  "WEAK",
  "DECLINING",
  "GROWING",
  "SEASONAL",
  "EXPERIMENTAL",
  "DEAD",
] as const;

export type ProductLifecycleLabel = (typeof PRODUCT_LIFECYCLE_LABELS)[number];

export const liveProductMetricsSchema = z.object({
  revenueUsd: z.number().nonnegative(),
  profitUsd: z.number(),
  orders: z.number().int().nonnegative(),
  refunds: z.number().int().nonnegative(),
  conversionPercent: z.number().min(0).max(100),
  ctrPercent: z.number().min(0).max(100),
  supplierPerformance: z.number().min(0).max(100),
  marketplacePerformance: z.number().min(0).max(100),
  countryPerformance: z.number().min(0).max(100),
});

export const liveProductRecordSchema = z.object({
  productId: z.string(),
  supplierProductId: z.string(),
  title: z.string(),
  countryCode: z.string().optional(),
  marketplaceId: z.string().optional(),
  lifecycle: z.enum(PRODUCT_LIFECYCLE_LABELS),
  metrics: liveProductMetricsSchema,
  executiveConfidence: z.number().min(0).max(100),
  executiveReviewRequired: z.boolean(),
  whySucceedingOrFailing: z.string(),
  reusedModules: z.array(z.string()),
  computedAt: z.string().datetime({ offset: true }),
});

export type LiveProductRecord = z.infer<typeof liveProductRecordSchema>;

export const liveProductIntelligenceDashboardSchema = z.object({
  moduleId: z.literal("live-product-intelligence"),
  missionId: z.literal("REAL-013"),
  workspaceId: z.string(),
  companyId: z.string(),
  liveProducts: z.array(liveProductRecordSchema),
  winners: z.array(liveProductRecordSchema),
  atRisk: z.array(liveProductRecordSchema),
  awaitingReview: z.array(liveProductRecordSchema),
  architectureComplete: z.boolean(),
  computedAt: z.string().datetime({ offset: true }),
});

export type LiveProductIntelligenceDashboard = z.infer<typeof liveProductIntelligenceDashboardSchema>;
