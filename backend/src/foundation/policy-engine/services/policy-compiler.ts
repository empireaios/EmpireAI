import type { GovernancePolicyRule } from "../../empire-governance/models/governance-policy.js";
import type { BusinessPolicy } from "../models/business-policy.js";

/** Compiles an active business policy into an executable governance rule when configured. */
export function compilePolicyToGovernanceRule(policy: BusinessPolicy): GovernancePolicyRule | null {
  if (policy.status !== "ACTIVE" || !policy.executableEnforcement) {
    return null;
  }

  if (policy.decisionMode === "deny") {
    const enforcement = policy.executableEnforcement;
    const timestamp = policy.updatedAt;
    return {
      policyId: `governance:${policy.policyId}:v${policy.version}`,
      workspaceId: policy.workspaceId,
      domain: enforcement.domain,
      name: policy.name,
      description: policy.description,
      module: enforcement.module,
      action: enforcement.action,
      effect: "DENY",
      envFlag: enforcement.envFlag,
      requiredRole: enforcement.requiredRole,
      priority: enforcement.priority,
      enabled: true,
      metadata: {
        source: "policy-engine",
        businessPolicyId: policy.policyId,
        policyVersion: String(policy.version),
        category: policy.category,
        ...policy.metadata,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }

  const enforcement = policy.executableEnforcement;
  const timestamp = policy.updatedAt;

  return {
    policyId: `governance:${policy.policyId}:v${policy.version}`,
    workspaceId: policy.workspaceId,
    domain: enforcement.domain,
    name: policy.name,
    description: policy.description,
    module: enforcement.module,
    action: enforcement.action,
    effect: enforcement.effect,
    envFlag: enforcement.envFlag,
    requiredRole: enforcement.requiredRole,
    priority: enforcement.priority,
    enabled: true,
    metadata: {
      source: "policy-engine",
      businessPolicyId: policy.policyId,
      policyVersion: String(policy.version),
      category: policy.category,
      decisionMode: policy.decisionMode,
      ...policy.metadata,
    },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** Compiles all active business policies with enforcement into governance rules. */
export function compileExecutableBusinessPolicies(policies: BusinessPolicy[]): GovernancePolicyRule[] {
  return policies
    .map(compilePolicyToGovernanceRule)
    .filter((rule): rule is GovernancePolicyRule => rule !== null);
}
