import { z } from "zod";

import { optimizationTaskSchema, type OptimizationTask } from "./optimization-task.js";

/** Ads optimization task bundle. */
export type AdsOptimization = {
  bundleId: string;
  tasks: OptimizationTask[];
  focusArea: string;
  score: number;
  summary: string;
};

export const adsOptimizationSchema = z.object({
  bundleId: z.string().min(1),
  tasks: z.array(optimizationTaskSchema).min(1),
  focusArea: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates an AdsOptimization record shape. */
export function validateAdsOptimization(value: unknown): AdsOptimization {
  return adsOptimizationSchema.parse(value);
}
