import { z } from "zod";

export const REVENUE_TRENDS = ["UP", "DOWN", "FLAT"] as const;

export type RevenueTrend = (typeof REVENUE_TRENDS)[number];

/** Executive dashboard revenue widget. */
export type RevenueWidget = {
  widgetId: string;
  totalRevenue: number;
  monthlyRevenue: number;
  dailyAverage: number;
  growthRatePercent: number;
  trend: RevenueTrend;
  currency: string;
  score: number;
  summary: string;
};

export const revenueWidgetSchema = z.object({
  widgetId: z.string().min(1),
  totalRevenue: z.number().min(0),
  monthlyRevenue: z.number().min(0),
  dailyAverage: z.number().min(0),
  growthRatePercent: z.number(),
  trend: z.enum(REVENUE_TRENDS),
  currency: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a RevenueWidget record shape. */
export function validateRevenueWidget(value: unknown): RevenueWidget {
  return revenueWidgetSchema.parse(value);
}
