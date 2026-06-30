import { z } from "zod";

export const READINESS_CAPABILITIES = [
  "operate",
  "publish",
  "monitor",
  "improve",
  "scale",
  "repeat",
] as const;

export type ReadinessCapability = (typeof READINESS_CAPABILITIES)[number];

const capabilityCheckSchema = z.object({
  capability: z.enum(READINESS_CAPABILITIES),
  label: z.string(),
  ready: z.boolean(),
  evidence: z.string(),
});

export const success001ReadinessReviewSchema = z.object({
  moduleId: z.literal("success-001-readiness-review"),
  missionId: z.literal("REAL-069"),
  workspaceId: z.string(),
  companyId: z.string(),
  capabilities: z.array(capabilityCheckSchema),
  readyCount: z.number(),
  blockerCount: z.number(),
  blockers: z.array(z.string()),
  netProfitUsd: z.number(),
  progressPercent: z.number(),
  grandKingReady: z.boolean(),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type Success001ReadinessReview = z.infer<typeof success001ReadinessReviewSchema>;
