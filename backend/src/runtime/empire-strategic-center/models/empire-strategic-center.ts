import { z } from "zod";

const roadmapSchema = z.object({
  roadmapId: z.string(),
  label: z.string(),
  horizon: z.enum(["90d", "1y", "3y", "5y"]),
  focus: z.string(),
  revenueTargetUsd: z.number(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  progressPercent: z.number(),
  evidence: z.string(),
});

export const empireStrategicCenterSchema = z.object({
  moduleId: z.literal("empire-strategic-center"),
  missionId: z.literal("REAL-067"),
  workspaceId: z.string(),
  companyId: z.string(),
  roadmaps: z.array(roadmapSchema),
  expansionPriorities: z.array(z.string()),
  revenuePriorities: z.array(z.string()),
  marketSharePriorities: z.array(z.string()),
  riskPriorities: z.array(z.string()),
  executiveSummary: z.string(),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type EmpireStrategicCenter = z.infer<typeof empireStrategicCenterSchema>;
