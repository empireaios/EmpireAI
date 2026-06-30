import { z } from "zod";

export const READINESS_DIMENSIONS = [
  "ARCHITECTURE",
  "OPERATIONAL",
  "MARKETPLACE",
  "SUPPLIER",
  "REVENUE",
  "DEPLOYMENT",
  "SECURITY",
  "EXECUTIVE",
  "GRAND_KING",
  "PRODUCTION",
] as const;

export const readinessDimensionSchema = z.object({
  dimension: z.enum(READINESS_DIMENSIONS),
  score: z.number().min(0).max(100),
  status: z.enum(["READY", "WARNING", "BLOCKED"]),
  blockers: z.array(z.string()),
});

export const version1ReadinessAuditSchema = z.object({
  moduleId: z.literal("version-1-readiness-audit"),
  missionId: z.literal("REAL-024"),
  workspaceId: z.string(),
  companyId: z.string(),
  version1ReadinessScore: z.number().min(0).max(100),
  dimensions: z.array(readinessDimensionSchema),
  blockers: z.array(z.string()),
  remainingWork: z.array(z.string()),
  productionRecommendation: z.string(),
  architectureComplete: z.boolean(),
  computedAt: z.string().datetime({ offset: true }),
});

export type Version1ReadinessAudit = z.infer<typeof version1ReadinessAuditSchema>;
