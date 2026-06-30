import { z } from "zod";

export const MARGIN_HEALTH_STATUSES = ["HEALTHY", "WARNING", "CRITICAL"] as const;

export type MarginHealthStatus = (typeof MARGIN_HEALTH_STATUSES)[number];

/** Margin health monitor snapshot. */
export type MarginHealth = {
  monitorId: string;
  grossMarginPercent: number;
  netMarginPercent: number;
  targetGrossMarginPercent: number;
  costOfGoodsSold: number;
  status: MarginHealthStatus;
  currency: string;
  score: number;
  summary: string;
};

export const marginHealthSchema = z.object({
  monitorId: z.string().min(1),
  grossMarginPercent: z.number().min(0).max(100),
  netMarginPercent: z.number().min(-100).max(100),
  targetGrossMarginPercent: z.number().min(0).max(100),
  costOfGoodsSold: z.number().min(0),
  status: z.enum(MARGIN_HEALTH_STATUSES),
  currency: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a MarginHealth record shape. */
export function validateMarginHealth(value: unknown): MarginHealth {
  return marginHealthSchema.parse(value);
}
