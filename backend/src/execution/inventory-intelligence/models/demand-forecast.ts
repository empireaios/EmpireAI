import { z } from "zod";

/** Demand forecast for inventory planning. */
export type DemandForecast = {
  forecastId: string;
  dailyUnits: number;
  weeklyUnits: number;
  monthlyUnits: number;
  trendDirection: "RISING" | "STABLE" | "FALLING";
  growthRatePercent: number;
  score: number;
};

export const demandForecastSchema = z.object({
  forecastId: z.string().min(1),
  dailyUnits: z.number().min(0),
  weeklyUnits: z.number().min(0),
  monthlyUnits: z.number().min(0),
  trendDirection: z.enum(["RISING", "STABLE", "FALLING"]),
  growthRatePercent: z.number(),
  score: z.number().min(0).max(100),
});

/** Validates a DemandForecast record shape. */
export function validateDemandForecast(value: unknown): DemandForecast {
  return demandForecastSchema.parse(value);
}
