import { z } from "zod";

/** Funnel stage in the analytics blueprint. */
export type FunnelStage = {
  stageId: string;
  name: string;
  eventName: string;
  order: number;
  benchmarkRate: number;
};

export const funnelStageSchema = z.object({
  stageId: z.string().min(1),
  name: z.string().min(1),
  eventName: z.string().min(1),
  order: z.number().int().min(1),
  benchmarkRate: z.number().min(0).max(100),
});

/** Analytics funnel blueprint. */
export type AnalyticsFunnel = {
  funnelId: string;
  name: string;
  stages: FunnelStage[];
  primaryConversionEvent: string;
};

export const analyticsFunnelSchema = z.object({
  funnelId: z.string().min(1),
  name: z.string().min(1),
  stages: z.array(funnelStageSchema).min(2),
  primaryConversionEvent: z.string().min(1),
});

/** Validates an AnalyticsFunnel record shape. */
export function validateAnalyticsFunnel(value: unknown): AnalyticsFunnel {
  return analyticsFunnelSchema.parse(value);
}

/** Revenue attribution model blueprint. */
export type RevenueAttributionModel = {
  modelId: string;
  name: string;
  touchpointModels: Array<"FIRST_TOUCH" | "LAST_TOUCH" | "LINEAR" | "DATA_DRIVEN">;
  defaultModel: "LAST_TOUCH";
  channels: string[];
  revenueEvents: string[];
  lookbackWindowDays: number;
};

export const revenueAttributionModelSchema = z.object({
  modelId: z.string().min(1),
  name: z.string().min(1),
  touchpointModels: z
    .array(z.enum(["FIRST_TOUCH", "LAST_TOUCH", "LINEAR", "DATA_DRIVEN"]))
    .min(1),
  defaultModel: z.literal("LAST_TOUCH"),
  channels: z.array(z.string().min(1)).min(1),
  revenueEvents: z.array(z.string().min(1)).min(1),
  lookbackWindowDays: z.number().int().min(1),
});

/** Validates a RevenueAttributionModel record shape. */
export function validateRevenueAttributionModel(value: unknown): RevenueAttributionModel {
  return revenueAttributionModelSchema.parse(value);
}
