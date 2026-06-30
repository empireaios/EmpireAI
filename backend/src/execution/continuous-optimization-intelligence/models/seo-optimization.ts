import { z } from "zod";

import { optimizationTaskSchema, type OptimizationTask } from "./optimization-task.js";

/** SEO optimization task bundle. */
export type SeoOptimization = {
  bundleId: string;
  tasks: OptimizationTask[];
  focusArea: string;
  score: number;
  summary: string;
};

export const seoOptimizationSchema = z.object({
  bundleId: z.string().min(1),
  tasks: z.array(optimizationTaskSchema).min(1),
  focusArea: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a SeoOptimization record shape. */
export function validateSeoOptimization(value: unknown): SeoOptimization {
  return seoOptimizationSchema.parse(value);
}
