import { z } from "zod";

export const REVENUE_HEALTH_STATUSES = ["HEALTHY", "WARNING", "CRITICAL"] as const;

export type RevenueHealthStatus = (typeof REVENUE_HEALTH_STATUSES)[number];

/** Revenue health monitor snapshot. */
export type RevenueHealth = {
  monitorId: string;
  dailyRevenue: number;
  monthlyRevenue: number;
  growthRatePercent: number;
  targetPercent: number;
  status: RevenueHealthStatus;
  currency: string;
  score: number;
  summary: string;
};

export const revenueHealthSchema = z.object({
  monitorId: z.string().min(1),
  dailyRevenue: z.number().min(0),
  monthlyRevenue: z.number().min(0),
  growthRatePercent: z.number(),
  targetPercent: z.number().min(0).max(100),
  status: z.enum(REVENUE_HEALTH_STATUSES),
  currency: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a RevenueHealth record shape. */
export function validateRevenueHealth(value: unknown): RevenueHealth {
  return revenueHealthSchema.parse(value);
}
