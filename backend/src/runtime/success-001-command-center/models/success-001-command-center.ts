import { z } from "zod";

export const SUCCESS_001_TARGET_USD = 100_000;

export const success001CommandCenterDashboardSchema = z.object({
  moduleId: z.literal("success-001-command-center"),
  missionId: z.literal("REAL-035"),
  missionCode: z.literal("SUCCESS-001"),
  workspaceId: z.string(),
  companyId: z.string(),
  currentNetProfitUsd: z.number(),
  currentMonthlyProfitUsd: z.number(),
  targetNetProfitUsd: z.number(),
  distanceToTargetUsd: z.number(),
  progressPercent: z.number(),
  programsBlocking: z.array(z.object({ program: z.string(), nextMission: z.string() })),
  operationalBlockers: z.array(z.string()),
  commercialBlockers: z.array(z.string()),
  supplierBlockers: z.array(z.string()),
  marketplaceBlockers: z.array(z.string()),
  executiveRecommendations: z.array(z.object({ title: z.string(), evidence: z.string() })),
  soulRecommendation: z.string(),
  grandKingApprovalQueue: z.array(z.object({ id: z.string(), title: z.string(), reason: z.string() })),
  projectedArrival: z.string(),
  confidencePercent: z.number(),
  businessHealth: z.enum(["CRITICAL", "WARNING", "STABLE", "GROWING"]),
  empireHealth: z.enum(["CRITICAL", "WARNING", "STABLE", "GROWING"]),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type Success001CommandCenterDashboard = z.infer<typeof success001CommandCenterDashboardSchema>;
