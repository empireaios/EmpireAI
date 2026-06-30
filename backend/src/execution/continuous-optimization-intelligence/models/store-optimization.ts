import { z } from "zod";

import { optimizationTaskSchema, type OptimizationTask } from "./optimization-task.js";

/** Store optimization task bundle. */
export type StoreOptimization = {
  bundleId: string;
  tasks: OptimizationTask[];
  focusArea: string;
  score: number;
  summary: string;
};

export const storeOptimizationSchema = z.object({
  bundleId: z.string().min(1),
  tasks: z.array(optimizationTaskSchema).min(1),
  focusArea: z.string().min(1),
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
});

/** Validates a StoreOptimization record shape. */
export function validateStoreOptimization(value: unknown): StoreOptimization {
  return storeOptimizationSchema.parse(value);
}
