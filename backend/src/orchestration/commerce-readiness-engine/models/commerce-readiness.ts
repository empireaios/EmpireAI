import { z } from "zod";

export const READINESS_BLOCKER_SEVERITIES = ["INFO", "WARNING", "BLOCKING"] as const;
export type ReadinessBlockerSeverity = (typeof READINESS_BLOCKER_SEVERITIES)[number];

export const LAUNCH_DECISIONS = ["NOT_READY", "READY_WITH_WARNINGS", "READY_TO_LAUNCH"] as const;
export type LaunchDecision = (typeof LAUNCH_DECISIONS)[number];

export const readinessBlockerSchema = z.object({
  id: z.string().min(1),
  severity: z.enum(READINESS_BLOCKER_SEVERITIES),
  category: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  recommendedAction: z.string().optional(),
  metadata: z.record(z.string()).default({}),
});

export type ReadinessBlocker = z.infer<typeof readinessBlockerSchema>;

export function createReadinessBlocker(
  input: Omit<ReadinessBlocker, "metadata"> & { metadata?: Record<string, string> },
): ReadinessBlocker {
  return { ...input, metadata: input.metadata ?? {} };
}

export const individualReadinessSchema = z.object({
  accounts: z.number().int().min(0).max(100),
  marketplaces: z.number().int().min(0).max(100),
  suppliers: z.number().int().min(0).max(100),
  products: z.number().int().min(0).max(100),
  brands: z.number().int().min(0).max(100),
  fulfillment: z.number().int().min(0).max(100),
  payment: z.number().int().min(0).max(100),
  governance: z.number().int().min(0).max(100),
  treasury: z.number().int().min(0).max(100),
});

export type IndividualReadiness = z.infer<typeof individualReadinessSchema>;

export const commerceReadinessEvaluationSchema = z.object({
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  accountType: z.enum(["grand_king", "founder"]).default("grand_king"),
  overallReadinessScore: z.number().int().min(0).max(100),
  individualReadiness: individualReadinessSchema,
  blockers: z.array(readinessBlockerSchema),
  launchDecision: z.enum(LAUNCH_DECISIONS),
  recommendedNextAction: z.string(),
  readyMarketplaces: z.array(z.string()),
  readyProducts: z.array(z.string()),
  readyBrands: z.array(z.string()),
  computedAt: z.string().datetime({ offset: true }),
});

export type CommerceReadinessEvaluation = z.infer<typeof commerceReadinessEvaluationSchema>;

export const commerceReadinessSummarySchema = z.object({
  workspaceId: z.string().min(1),
  companyId: z.string().min(1),
  overallReadinessScore: z.number().int().min(0).max(100),
  launchDecision: z.enum(LAUNCH_DECISIONS),
  recommendedNextAction: z.string(),
  blockingCount: z.number().int().min(0),
  warningCount: z.number().int().min(0),
  readyMarketplaceCount: z.number().int().min(0),
  readyProductCount: z.number().int().min(0),
  readyBrandCount: z.number().int().min(0),
  individualReadiness: individualReadinessSchema,
  computedAt: z.string().datetime({ offset: true }),
});

export type CommerceReadinessSummary = z.infer<typeof commerceReadinessSummarySchema>;

export const commerceReadinessDashboardSchema = z.object({
  overallReadinessScore: z.number().int().min(0).max(100),
  launchDecision: z.enum(LAUNCH_DECISIONS),
  recommendedNextAction: z.string(),
  blockingItems: z.array(readinessBlockerSchema),
  readyMarketplaces: z.array(z.string()),
  readyProducts: z.array(z.string()),
  readyBrands: z.array(z.string()),
});

export type CommerceReadinessDashboard = z.infer<typeof commerceReadinessDashboardSchema>;
