import { z } from "zod";

export const GOVERNANCE_DOMAINS = [
  "identity",
  "policies",
  "approval",
  "capital",
  "founder",
  "grandKings",
  "supplier",
  "marketing",
  "deployment",
] as const;

export type GovernanceDomain = (typeof GOVERNANCE_DOMAINS)[number];

export const GOVERNANCE_EFFECTS = [
  "ALLOW",
  "DENY",
  "REQUIRE_FOUNDER_APPROVAL",
  "REQUIRE_OPERATOR_ROLE",
  "SANDBOX_ONLY",
  "REQUIRE_ENV_ENABLED",
] as const;

export type GovernanceEffect = (typeof GOVERNANCE_EFFECTS)[number];

export const governancePolicyRuleSchema = z.object({
  policyId: z.string().min(1),
  workspaceId: z.string().min(1),
  domain: z.enum(GOVERNANCE_DOMAINS),
  name: z.string().min(1),
  description: z.string().min(1),
  module: z.string().optional(),
  action: z.string().optional(),
  effect: z.enum(GOVERNANCE_EFFECTS),
  envFlag: z.string().optional(),
  requiredRole: z.enum(["founder", "admin", "operator"]).optional(),
  priority: z.number().int().min(0).default(100),
  enabled: z.boolean().default(true),
  metadata: z.record(z.string()).default({}),
  createdAt: z.string().datetime({ offset: true }),
  updatedAt: z.string().datetime({ offset: true }),
});

export type GovernancePolicyRule = z.infer<typeof governancePolicyRuleSchema>;

export const governanceDecisionRequestSchema = z.object({
  workspaceId: z.string().min(1),
  domain: z.enum(GOVERNANCE_DOMAINS),
  module: z.string().min(1),
  action: z.string().min(1),
  actorRole: z.string().optional(),
  actor: z.string().optional(),
  companyId: z.string().optional(),
  correlationId: z.string().optional(),
  payload: z.record(z.unknown()).default({}),
  founderApproved: z.boolean().optional(),
});

export type GovernanceDecisionRequest = z.infer<typeof governanceDecisionRequestSchema>;

export const governanceVerdictSchema = z.object({
  allowed: z.boolean(),
  requiresApproval: z.boolean(),
  approvalType: z.enum(["founder", "operator", "grand_king"]).optional(),
  sandboxOnly: z.boolean(),
  reason: z.string(),
  code: z.string(),
  domain: z.enum(GOVERNANCE_DOMAINS),
  policyId: z.string().optional(),
  policyName: z.string().optional(),
});

export type GovernanceVerdict = z.infer<typeof governanceVerdictSchema>;

export type GovernanceDecisionRecord = {
  decisionId: string;
  workspaceId: string;
  domain: GovernanceDomain;
  module: string;
  action: string;
  verdict: GovernanceVerdict;
  actor: string;
  correlationId: string;
  createdAt: string;
};

export function validateGovernancePolicyRule(value: unknown): GovernancePolicyRule {
  return governancePolicyRuleSchema.parse(value);
}

export function validateGovernanceDecisionRequest(value: unknown): GovernanceDecisionRequest {
  return governanceDecisionRequestSchema.parse(value);
}
