import { z } from "zod";

export const FINANCIAL_FORECAST_SIGNAL_TYPES = [
  "revenue_projection",
  "profit_health",
  "roas_efficiency",
  "cash_flow_stability",
  "breakeven_proximity",
  "growth_potential",
  "risk_exposure",
  "forecast_composite",
] as const;

export type FinancialForecastSignalType = (typeof FINANCIAL_FORECAST_SIGNAL_TYPES)[number];

/** Scoring signal for financial forecast confidence. */
export type FinancialForecastSignal = {
  signalType: FinancialForecastSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const financialForecastSignalSchema = z.object({
  signalType: z.enum(FINANCIAL_FORECAST_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a FinancialForecastSignal record shape. */
export function validateFinancialForecastSignal(value: unknown): FinancialForecastSignal {
  return financialForecastSignalSchema.parse(value);
}
