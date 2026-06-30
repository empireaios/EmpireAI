import { z } from "zod";

export const empireCashflowEngineSchema = z.object({
  moduleId: z.literal("empire-cashflow-engine"),
  missionId: z.literal("REAL-082"),
  workspaceId: z.string(),
  companyId: z.string(),
  summary: z.string(),
  items: z.array(z.object({
    itemId: z.string(),
    label: z.string(),
    score: z.number(),
    status: z.enum(["READY", "PENDING", "BLOCKED"]),
    recommendation: z.string(),
    evidence: z.string(),
    why: z.string(),
  })),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type EmpireCashflowEngine = z.infer<typeof empireCashflowEngineSchema>;
