import { z } from "zod";

export const GOVERNANCE_CHAIN_STEPS = [
  "Observe",
  "Analyse",
  "Debate",
  "Soul",
  "Grand King",
] as const;

export type GovernanceChainStep = (typeof GOVERNANCE_CHAIN_STEPS)[number];

const governanceCheckSchema = z.object({
  checkId: z.string(),
  label: z.string(),
  moduleId: z.string(),
  chainStep: z.enum(GOVERNANCE_CHAIN_STEPS),
  status: z.enum(["COMPLIANT", "PARTIAL", "NON_COMPLIANT"]),
  bypassDetected: z.boolean(),
  evidence: z.string(),
});

export const version1GovernanceReviewSchema = z.object({
  moduleId: z.literal("version-1-governance-review"),
  missionId: z.literal("REAL-068"),
  workspaceId: z.string(),
  companyId: z.string(),
  governanceChain: z.array(z.enum(GOVERNANCE_CHAIN_STEPS)),
  checks: z.array(governanceCheckSchema),
  compliantCount: z.number(),
  partialCount: z.number(),
  nonCompliantCount: z.number(),
  bypassCount: z.number(),
  chainIntact: z.boolean(),
  reusedModules: z.array(z.string()),
  architectureComplete: z.boolean(),
  computedAt: z.string(),
});

export type Version1GovernanceReview = z.infer<typeof version1GovernanceReviewSchema>;
