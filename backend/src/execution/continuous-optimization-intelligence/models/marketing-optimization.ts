import { z } from "zod";

import { optimizationTaskSchema, type OptimizationTask } from "./optimization-task.js";

/** Marketing optimization task bundle. */
export type MarketingOptimization = {
  bundleId: string;
  tasks: OptimizationTask[];
  focusArea: string;
  score: number;
  summary: string;
};

export const marketingOptimizationSchema = z.object({
  bundleId: z.string().min(1),
  tasks: z.array(optimizationTaskSchema).min(1),
  focusArea: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a MarketingOptimization record shape. */
export function validateMarketingOptimization(value: unknown): MarketingOptimization {
  return marketingOptimizationSchema.parse(value);
}
