import { z } from "zod";

/** Return on ad spend forecast. */
export type RoasForecast = {
  forecastId: string;
  currentRoas: number;
  projectedRoas: number;
  adSpendMonthly: number;
  revenueFromAds: number;
  breakEvenRoas: number;
  score: number;
};

export const roasForecastSchema = z.object({
  forecastId: z.string().min(1),
  currentRoas: z.number().min(0),
  projectedRoas: z.number().min(0),
  adSpendMonthly: z.number().min(0),
  revenueFromAds: z.number().min(0),
  breakEvenRoas: z.number().min(0),
  score: z.number().min(0).max(100),
});

/** Validates a RoasForecast record shape. */
export function validateRoasForecast(value: unknown): RoasForecast {
  return roasForecastSchema.parse(value);
}
