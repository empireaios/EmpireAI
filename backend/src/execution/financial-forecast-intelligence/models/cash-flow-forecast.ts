import { z } from "zod";

/** Cash flow forecast projection. */
export type CashFlowForecast = {
  forecastId: string;
  monthlyInflow: number;
  monthlyOutflow: number;
  netCashFlow: number;
  runwayMonths: number;
  currency: string;
  score: number;
};

export const cashFlowForecastSchema = z.object({
  forecastId: z.string().min(1),
  monthlyInflow: z.number().min(0),
  monthlyOutflow: z.number().min(0),
  netCashFlow: z.number(),
  runwayMonths: z.number().min(0),
  currency: z.string().min(1),
  score: z.number().min(0).max(100),
});

/** Validates a CashFlowForecast record shape. */
export function validateCashFlowForecast(value: unknown): CashFlowForecast {
  return cashFlowForecastSchema.parse(value);
}
