import { z } from "zod";

export const FORECAST_SIGNAL_TYPES = [
  "momentum_projection",
  "risk_projection",
  "opportunity_projection",
  "velocity_projection",
  "confidence",
  "snapshot_coverage",
] as const;

export type ForecastSignalType = (typeof FORECAST_SIGNAL_TYPES)[number];

/** Individual factor contributing to a product trend forecast. */
export type ForecastSignal = {
  signalType: ForecastSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const forecastSignalSchema = z.object({
  signalType: z.enum(FORECAST_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a ForecastSignal record shape. */
export function validateForecastSignal(value: unknown): ForecastSignal {
  return forecastSignalSchema.parse(value);
}

/** Lightweight historical trend snapshot for forecasting. */
export type TrendSnapshot = {
  capturedAt: string;
  trendVelocity: number;
  trendStrength: number;
  momentumScore: number;
  volatilityScore: number;
  trendConfidence: number;
};
