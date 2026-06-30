import { z } from "zod";

export const SIGN_OFF_DOMAINS = [
  "architecture",
  "governance",
  "commercial",
  "operational",
  "financial",
  "production",
  "deployment",
  "grand_king",
  "success_readiness",
] as const;

export type SignOffDomain = (typeof SIGN_OFF_DOMAINS)[number];

const signOffItemSchema = z.object({
  domain: z.enum(SIGN_OFF_DOMAINS),
  label: z.string(),
  score: z.number(),
  status: z.enum(["READY", "PENDING", "BLOCKED"]),
  blockers: z.array(z.string()),
  evidence: z.string(),
});

export const version1ExecutiveSignOffSchema = z.object({
  moduleId: z.literal("version-1-executive-sign-off"),
  missionId: z.literal("REAL-070"),
  workspaceId: z.string(),
  companyId: z.string(),
  signOffItems: z.array(signOffItemSchema),
  readyCount: z.number(),
  blockedCount: z.number(),
  overallScore: z.number(),
  signOffReady: z.boolean(),
  acceptanceScore: z.number(),
  goldMasterScore: z.number(),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type Version1ExecutiveSignOff = z.infer<typeof version1ExecutiveSignOffSchema>;
