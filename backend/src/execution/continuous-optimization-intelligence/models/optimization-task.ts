import { z } from "zod";

export const OPTIMIZATION_DOMAINS = [
  "STORE",
  "ADS",
  "PRICING",
  "OFFER",
  "SEO",
  "MARKETING",
] as const;

export type OptimizationDomain = (typeof OPTIMIZATION_DOMAINS)[number];

export const OPTIMIZATION_PRIORITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

export type OptimizationPriority = (typeof OPTIMIZATION_PRIORITIES)[number];

export const OPTIMIZATION_TASK_STATUSES = ["PLANNED", "QUEUED", "IN_PROGRESS", "COMPLETED"] as const;

export type OptimizationTaskStatus = (typeof OPTIMIZATION_TASK_STATUSES)[number];

/** Autonomous optimization task — planned only, no auto-apply. */
export type OptimizationTask = {
  taskId: string;
  domain: OptimizationDomain;
  priority: OptimizationPriority;
  title: string;
  description: string;
  action: string;
  expectedImpactPercent: number;
  status: OptimizationTaskStatus;
  score: number;
};

export const optimizationTaskSchema = z.object({
  taskId: z.string().min(1),
  domain: z.enum(OPTIMIZATION_DOMAINS),
  priority: z.enum(OPTIMIZATION_PRIORITIES),
  title: z.string().min(1),
  description: z.string().min(1),
  action: z.string().min(1),
  expectedImpactPercent: z.number().min(0).max(100),
  status: z.enum(OPTIMIZATION_TASK_STATUSES),
  score: z.number().min(0).max(100),
});

/** Validates an OptimizationTask record shape. */
export function validateOptimizationTask(value: unknown): OptimizationTask {
  return optimizationTaskSchema.parse(value);
}
