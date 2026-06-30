import { z } from "zod";

/** Revenue forecast projection. */
export type RevenueForecast = {
  forecastId: string;
  monthlyRevenue: number;
  quarterlyRevenue: number;
  annualRevenue: number;
  growthRatePercent: number;
  currency: string;
  score: number;
};

export const revenueForecastSchema = z.object({
  forecastId: z.string().min(1),
  monthlyRevenue: z.number().min(0),
  quarterlyRevenue: z.number().min(0),
  annualRevenue: z.number().min(0),
  growthRatePercent: z.number(),
  currency: z.string().min(1),
  score: z.number().min(0).max(100),
});

/** Validates a RevenueForecast record shape. */
export function validateRevenueForecast(value: unknown): RevenueForecast {
  return revenueForecastSchema.parse(value);
}
