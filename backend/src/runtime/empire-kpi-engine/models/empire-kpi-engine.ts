import { z } from "zod";

export const SUCCESS_001_NET_PROFIT_TARGET_USD = 100_000;

export const secondaryKpiSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.number(),
  unit: z.string(),
  progressPercent: z.number().optional(),
  evidence: z.string(),
});

export const empireKpiEngineSchema = z.object({
  moduleId: z.literal("empire-kpi-engine"),
  missionId: z.literal("REAL-062"),
  workspaceId: z.string(),
  companyId: z.string(),
  primaryKpi: z.object({
    label: z.literal("USD 100K Net Profit Progress"),
    currentUsd: z.number(),
    targetUsd: z.number(),
    progressPercent: z.number(),
    distanceUsd: z.number(),
  }),
  secondaryKpis: z.array(secondaryKpiSchema),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type EmpireKpiEngine = z.infer<typeof empireKpiEngineSchema>;
