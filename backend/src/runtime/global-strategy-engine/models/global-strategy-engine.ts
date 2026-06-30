import { z } from "zod";

export const MILESTONE_TARGETS = [
  { milestoneId: "SUCCESS-001", label: "USD 100K net profit", targetUsd: 100_000 },
  { milestoneId: "SUCCESS-002", label: "USD 1M net profit", targetUsd: 1_000_000 },
  { milestoneId: "SUCCESS-003", label: "USD 10M net profit", targetUsd: 10_000_000 },
] as const;

export const globalStrategyEngineDashboardSchema = z.object({
  moduleId: z.literal("global-strategy-engine"),
  missionId: z.literal("REAL-034"),
  workspaceId: z.string(),
  companyId: z.string(),
  currentNetProfitUsd: z.number(),
  milestones: z.array(z.object({
    milestoneId: z.string(),
    label: z.string(),
    targetUsd: z.number(),
    progressPercent: z.number(),
    distanceUsd: z.number(),
    highestProbabilityPath: z.string(),
  })),
  strategicRecommendations: z.array(z.object({ title: z.string(), evidence: z.string(), profitImpactUsd: z.number() })),
  quarterlyObjectives: z.array(z.string()),
  commercialPriorities: z.array(z.string()),
  executiveDebateInputs: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type GlobalStrategyEngineDashboard = z.infer<typeof globalStrategyEngineDashboardSchema>;
