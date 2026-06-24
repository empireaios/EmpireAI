import { z } from "zod";

import {
  prioritySignalSchema,
  type PrioritySignal,
} from "./priority-signal.js";

export type InvestigationPriorityId = string;

export const PRIORITY_LEVELS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;
export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

/** Ranked investigation priority for a product target. */
export type InvestigationPriority = {
  id: InvestigationPriorityId;
  workspaceId: string;
  targetId: string;
  productId: string;
  opportunityScore: number;
  trendForecastScore: number;
  trustScore: number;
  urgencyScore: number;
  uncertaintyScore: number;
  investigationPriorityScore: number;
  priorityLevel: PriorityLevel;
  rationale: string;
  signals: PrioritySignal[];
  createdAt: string;
  updatedAt: string;
};

export type InvestigationPriorityCreateInput = Omit<
  InvestigationPriority,
  "id" | "workspaceId" | "createdAt" | "updatedAt"
>;

const isoTimestamp = z.string().datetime({ offset: true });

export const investigationPrioritySchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  targetId: z.string().min(1),
  productId: z.string().min(1),
  opportunityScore: z.number().min(0).max(100),
  trendForecastScore: z.number().min(0).max(100),
  trustScore: z.number().min(0).max(100),
  urgencyScore: z.number().min(0).max(100),
  uncertaintyScore: z.number().min(0).max(100),
  investigationPriorityScore: z.number().min(0).max(100),
  priorityLevel: z.enum(PRIORITY_LEVELS),
  rationale: z.string().min(1),
  signals: z.array(prioritySignalSchema),
  createdAt: isoTimestamp,
  updatedAt: isoTimestamp,
});

/** Validates an InvestigationPriority record shape. */
export function validateInvestigationPriority(value: unknown): InvestigationPriority {
  return investigationPrioritySchema.parse(value);
}

/** Maps an investigation priority score to a priority level label. */
export function resolvePriorityLevel(
  investigationPriorityScore: number,
  urgencyScore: number,
  uncertaintyScore: number,
): PriorityLevel {
  if (
    investigationPriorityScore >= 82 ||
    (urgencyScore >= 78 && uncertaintyScore >= 60)
  ) {
    return "CRITICAL";
  }
  if (investigationPriorityScore >= 60) return "HIGH";
  if (investigationPriorityScore >= 38) return "MEDIUM";
  return "LOW";
}
