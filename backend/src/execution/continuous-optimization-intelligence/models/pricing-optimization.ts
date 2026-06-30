import { z } from "zod";

import { optimizationTaskSchema, type OptimizationTask } from "./optimization-task.js";

/** Pricing optimization task bundle. */
export type PricingOptimization = {
  bundleId: string;
  tasks: OptimizationTask[];
  focusArea: string;
  score: number;
  summary: string;
};

export const pricingOptimizationSchema = z.object({
  bundleId: z.string().min(1),
  tasks: z.array(optimizationTaskSchema).min(1),
  focusArea: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a PricingOptimization record shape. */
export function validatePricingOptimization(value: unknown): PricingOptimization {
  return pricingOptimizationSchema.parse(value);
}
