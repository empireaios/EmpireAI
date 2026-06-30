import { z } from "zod";

/** REAL-016 — Global opportunity queue. */
export const globalOpportunitySchema = z.object({
  opportunityId: z.string(),
  opportunityType: z.enum(["COUNTRY", "MARKETPLACE", "CATEGORY", "SUPPLIER_CATALOG", "REVENUE_GAP"]),
  title: z.string(),
  opportunityScore: z.number().min(0).max(100),
  expectedRoi: z.string(),
  expectedPaybackDays: z.number().int(),
  priority: z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]),
  executiveRecommendation: z.string(),
  expectedProfitUsd: z.number(),
});

export const globalOpportunityEngineSchema = z.object({
  moduleId: z.literal("global-opportunity-engine"),
  missionId: z.literal("REAL-016"),
  workspaceId: z.string(),
  companyId: z.string(),
  opportunityQueue: z.array(globalOpportunitySchema),
  computedAt: z.string().datetime({ offset: true }),
});

export type GlobalOpportunityEngine = z.infer<typeof globalOpportunityEngineSchema>;
