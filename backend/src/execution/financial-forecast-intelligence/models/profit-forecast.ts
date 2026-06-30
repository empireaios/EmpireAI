import { z } from "zod";

/** Profit forecast projection. */
export type ProfitForecast = {
  forecastId: string;
  monthlyProfit: number;
  quarterlyProfit: number;
  annualProfit: number;
  grossMarginPercent: number;
  netMarginPercent: number;
  currency: string;
  score: number;
};

export const profitForecastSchema = z.object({
  forecastId: z.string().min(1),
  monthlyProfit: z.number(),
  quarterlyProfit: z.number(),
  annualProfit: z.number(),
  grossMarginPercent: z.number().min(0).max(100),
  netMarginPercent: z.number().min(-100).max(100),
  currency: z.string().min(1),
  score: z.number().min(0).max(100),
});

/** Validates a ProfitForecast record shape. */
export function validateProfitForecast(value: unknown): ProfitForecast {
  return profitForecastSchema.parse(value);
}
