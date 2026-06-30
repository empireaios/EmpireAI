import { z } from "zod";

import {
  googleAnalyticsModelSchema,
  type GoogleAnalyticsModel,
} from "./google-analytics-model.js";
import { metaPixelModelSchema, type MetaPixelModel } from "./meta-pixel-model.js";
import { tikTokPixelModelSchema, type TikTokPixelModel } from "./tiktok-pixel-model.js";
import {
  conversionEventSchema,
  serverSideEventSchema,
  type ConversionEvent,
  type ServerSideEvent,
} from "./analytics-events.js";
import {
  analyticsFunnelSchema,
  revenueAttributionModelSchema,
  type AnalyticsFunnel,
  type RevenueAttributionModel,
} from "./analytics-funnel.js";
import { dashboardMetricSchema, type DashboardMetric } from "./dashboard-metric.js";
import { analyticsSignalSchema, type AnalyticsSignal } from "./analytics-signal.js";

export type AnalyticsBlueprintId = string;

/** Complete analytics blueprint for a manufactured store — no live API calls. */
export type AnalyticsBlueprint = {
  blueprintId: AnalyticsBlueprintId;
  storeId: string;
  brandId: string;
  blueprintName: string;
  googleAnalytics: GoogleAnalyticsModel;
  metaPixel: MetaPixelModel;
  tikTokPixel: TikTokPixelModel;
  serverSideEvents: ServerSideEvent[];
  conversionEvents: ConversionEvent[];
  funnels: AnalyticsFunnel[];
  revenueAttribution: RevenueAttributionModel;
  dashboardMetrics: DashboardMetric[];
  confidence: number;
  signals: AnalyticsSignal[];
  blueprintOnly: true;
  liveApiEnabled: false;
  deploymentEnabled: false;
};

export type AnalyticsBlueprintCreateInput = Omit<AnalyticsBlueprint, "blueprintId">;

export const analyticsBlueprintSchema = z.object({
  blueprintId: z.string().min(1),
  storeId: z.string().min(1),
  brandId: z.string().min(1),
  blueprintName: z.string().min(1),
  googleAnalytics: googleAnalyticsModelSchema,
  metaPixel: metaPixelModelSchema,
  tikTokPixel: tikTokPixelModelSchema,
  serverSideEvents: z.array(serverSideEventSchema).min(1),
  conversionEvents: z.array(conversionEventSchema).min(1),
  funnels: z.array(analyticsFunnelSchema).min(1),
  revenueAttribution: revenueAttributionModelSchema,
  dashboardMetrics: z.array(dashboardMetricSchema).min(1),
  confidence: z.number().min(0).max(100),
  signals: z.array(analyticsSignalSchema),
  blueprintOnly: z.literal(true),
  liveApiEnabled: z.literal(false),
  deploymentEnabled: z.literal(false),
});

/** Validates an AnalyticsBlueprint record shape. */
export function validateAnalyticsBlueprint(value: unknown): AnalyticsBlueprint {
  return analyticsBlueprintSchema.parse(value);
}
