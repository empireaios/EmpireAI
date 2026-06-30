import { z } from "zod";

export const RISK_DIMENSIONS = [
  "Commercial",
  "Supplier",
  "Marketplace",
  "Operational",
  "Financial",
  "Strategic",
  "Legal",
  "Technology",
  "Country",
] as const;

export const riskDimensionSchema = z.object({
  dimension: z.enum(RISK_DIMENSIONS),
  score: z.number(),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  evidence: z.array(z.string()),
  recommendation: z.string(),
});

export const globalRiskCommandSchema = z.object({
  moduleId: z.literal("global-risk-command"),
  missionId: z.literal("REAL-045"),
  workspaceId: z.string(),
  companyId: z.string(),
  dimensions: z.array(riskDimensionSchema),
  overallRiskScore: z.number(),
  executiveRecommendations: z.array(z.object({
    priority: z.string(),
    action: z.string(),
    evidence: z.string(),
  })),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type RiskDimension = (typeof RISK_DIMENSIONS)[number];
export type GlobalRiskCommand = z.infer<typeof globalRiskCommandSchema>;
