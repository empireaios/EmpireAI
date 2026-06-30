import { z } from "zod";

export const CONTINUOUS_OPTIMIZATION_SIGNAL_TYPES = [
  "store_optimization",
  "ads_optimization",
  "pricing_optimization",
  "offer_optimization",
  "seo_optimization",
  "marketing_optimization",
  "task_coverage",
  "optimization_composite",
] as const;

export type ContinuousOptimizationSignalType =
  (typeof CONTINUOUS_OPTIMIZATION_SIGNAL_TYPES)[number];

/** Scoring signal for continuous optimization confidence. */
export type ContinuousOptimizationSignal = {
  signalType: ContinuousOptimizationSignalType;
  score: number;
  weight: number;
  detail: string;
};

export const continuousOptimizationSignalSchema = z.object({
  signalType: z.enum(CONTINUOUS_OPTIMIZATION_SIGNAL_TYPES),
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(1),
  detail: z.string().min(1),
});

/** Validates a ContinuousOptimizationSignal record shape. */
export function validateContinuousOptimizationSignal(
  value: unknown,
): ContinuousOptimizationSignal {
  return continuousOptimizationSignalSchema.parse(value);
}
