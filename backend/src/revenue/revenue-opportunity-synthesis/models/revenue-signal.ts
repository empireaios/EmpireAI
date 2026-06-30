import { z } from "zod";

export const REVENUE_SIGNAL_TYPES = [
  "product_opportunity",
  "launch_decision",
  "trend_forecast",
  "source_trust",
  "investigation_learning",
  "value_projection",
  "difficulty_projection",
  "confidence_composite",
] as const;

export type RevenueSignalType = (typeof REVENUE_SIGNAL_TYPES)[number];

/** Individual factor contributing to a revenue opportunity synthesis. */
export type RevenueSignal = {
  signalType: RevenueSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const revenueSignalSchema = z.object({
  signalType: z.enum(REVENUE_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a RevenueSignal record shape. */
export function validateRevenueSignal(value: unknown): RevenueSignal {
  return revenueSignalSchema.parse(value);
}
