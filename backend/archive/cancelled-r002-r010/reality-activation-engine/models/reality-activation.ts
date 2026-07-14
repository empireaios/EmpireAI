import { z } from "zod";

export const ACTIVATION_STATES = [
  "NOT_READY",
  "READY_FOR_STAGING",
  "READY_FOR_LIVE",
  "LIVE_LOCKED",
  "EMERGENCY_STOP",
] as const;

export type ActivationState = (typeof ACTIVATION_STATES)[number];

export const activationBlockerSchema = z.object({
  id: z.string(),
  category: z.string(),
  severity: z.enum(["INFO", "WARNING", "BLOCKING"]),
  title: z.string(),
  description: z.string(),
});

export const activationDecisionSchema = z.object({
  decisionId: z.string(),
  workspaceId: z.string(),
  companyId: z.string(),
  state: z.enum(ACTIVATION_STATES),
  confidence: z.number().min(0).max(100),
  blockers: z.array(activationBlockerSchema),
  plan: z.array(z.string()),
  rollbackPlan: z.array(z.string()),
  timeline: z.array(z.object({ phase: z.string(), eta: z.string() })),
  evaluatedAt: z.string().datetime({ offset: true }),
  inputs: z.object({
    commerceReadiness: z.string(),
    connectorHealth: z.string(),
    marketplaceHealth: z.string(),
    supplierHealth: z.string(),
    paymentHealth: z.string(),
    governance: z.string(),
    executionLayer: z.string(),
    soulRuntime: z.string(),
    esis: z.string(),
  }),
});

export const realityActivationDashboardSchema = z.object({
  workspaceId: z.string(),
  companyId: z.string(),
  state: z.enum(ACTIVATION_STATES),
  confidence: z.number(),
  blockers: z.array(activationBlockerSchema),
  recommendedAction: z.string(),
  lastEvaluatedAt: z.string().datetime({ offset: true }).nullable(),
});

export type ActivationDecision = z.infer<typeof activationDecisionSchema>;
export type RealityActivationDashboard = z.infer<typeof realityActivationDashboardSchema>;
