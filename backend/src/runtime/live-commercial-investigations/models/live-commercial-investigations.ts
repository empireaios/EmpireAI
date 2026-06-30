import { z } from "zod";

export const INVESTIGATION_TYPES = [
  "sales_decline",
  "refund_spike",
  "supplier_issue",
  "marketplace_warning",
  "country_slowdown",
] as const;

export const investigationSchema = z.object({
  investigationId: z.string(),
  type: z.enum(INVESTIGATION_TYPES),
  title: z.string(),
  status: z.enum(["OPEN", "MONITORING", "RESOLVED"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  executiveRecommendation: z.string(),
  evidence: z.array(z.string()),
  openedAt: z.string(),
});

export const liveCommercialInvestigationsSchema = z.object({
  moduleId: z.literal("live-commercial-investigations"),
  missionId: z.literal("REAL-063"),
  workspaceId: z.string(),
  companyId: z.string(),
  openInvestigations: z.array(investigationSchema),
  openCount: z.number(),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type InvestigationType = (typeof INVESTIGATION_TYPES)[number];
export type LiveCommercialInvestigations = z.infer<typeof liveCommercialInvestigationsSchema>;
