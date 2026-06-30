import { z } from "zod";

import { GOVERNANCE_DOMAINS, GOVERNANCE_EFFECTS } from "../../empire-governance/models/governance-policy.js";

export const POLICY_CATEGORIES = [
  "productSelection",
  "adApproval",
  "capitalApproval",
  "pricing",
  "founderAi",
  "grandKingsPrivileges",
] as const;

export type PolicyCategory = (typeof POLICY_CATEGORIES)[number];

export const POLICY_DECISION_MODES = [
  "manual",
  "automatic",
  "approval_required",
  "approval_optional",
  "allow",
  "deny",
  "sandbox_only",
] as const;

export type PolicyDecisionMode = (typeof POLICY_DECISION_MODES)[number];

export const POLICY_STATUSES = ["ACTIVE", "DISABLED"] as const;

export type PolicyStatus = (typeof POLICY_STATUSES)[number];

export const POLICY_LIFECYCLE_EVENTS = [
  "CREATED",
  "MODIFIED",
  "DISABLED",
  "ENABLED",
  "RESOLVED",
] as const;

export type PolicyLifecycleEvent = (typeof POLICY_LIFECYCLE_EVENTS)[number];

export const policyExecutableEnforcementSchema = z.object({
  domain: z.enum(GOVERNANCE_DOMAINS),
  module: z.string().optional(),
  action: z.string().optional(),
  effect: z.enum(GOVERNANCE_EFFECTS),
  envFlag: z.string().optional(),
  requiredRole: z.enum(["founder", "admin", "operator"]).optional(),
  priority: z.number().int().min(0).default(100),
});

export type PolicyExecutableEnforcement = z.infer<typeof policyExecutableEnforcementSchema>;

export const businessPolicySchema = z.object({
  policyId: z.string().min(1),
  workspaceId: z.string().min(1),
  category: z.enum(POLICY_CATEGORIES),
  name: z.string().min(1),
  description: z.string().min(1),
  decisionMode: z.enum(POLICY_DECISION_MODES),
  config: z.record(z.unknown()).default({}),
  executableEnforcement: policyExecutableEnforcementSchema.optional(),
  status: z.enum(POLICY_STATUSES),
  version: z.number().int().min(1),
  resolveCount: z.number().int().min(0).default(0),
  metadata: z.record(z.string()).default({}),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type BusinessPolicy = z.infer<typeof businessPolicySchema>;

export type PolicyLifecycleRecord = {
  lifecycleId: string;
  policyId: string;
  workspaceId: string;
  event: PolicyLifecycleEvent;
  summary: string;
  actor: string;
  correlationId?: string;
  metadata: Record<string, string>;
  createdAt: string;
};

export type PolicyUpsertInput = {
  workspaceId: string;
  policyId: string;
  category: PolicyCategory;
  name: string;
  description: string;
  decisionMode: PolicyDecisionMode;
  config?: Record<string, unknown>;
  executableEnforcement?: PolicyExecutableEnforcement;
  metadata?: Record<string, string>;
  actor?: string;
};

export type PolicyUpdateInput = {
  policyId: string;
  name?: string;
  description?: string;
  decisionMode?: PolicyDecisionMode;
  config?: Record<string, unknown>;
  executableEnforcement?: PolicyExecutableEnforcement;
  metadata?: Record<string, string>;
  actor?: string;
};

export type PolicyResolveInput = {
  workspaceId: string;
  category?: PolicyCategory;
  policyId?: string;
  module?: string;
  action?: string;
  context?: Record<string, unknown>;
  actor?: string;
  correlationId?: string;
};

export type PolicyResolution = {
  policyId: string;
  category: PolicyCategory;
  name: string;
  decisionMode: PolicyDecisionMode;
  config: Record<string, unknown>;
  allowed: boolean;
  requiresApproval: boolean;
  sandboxOnly: boolean;
  automatic: boolean;
  reason: string;
};

/** Stable policy IDs — modules resolve by ID or category, never hardcode business logic. */
export const CANONICAL_POLICY_IDS = {
  PRODUCT_SELECTION: "policy:product-selection",
  AD_APPROVAL: "policy:ad-approval",
  CAPITAL_APPROVAL: "policy:capital-approval",
  PRICING_RULES: "policy:pricing-rules",
  FOUNDER_AI_USAGE: "policy:founder-ai-usage",
  GRAND_KINGS_PRIVILEGES: "policy:grand-kings-privileges",
} as const;

export function validateBusinessPolicy(value: unknown): BusinessPolicy {
  return businessPolicySchema.parse(value);
}
