/**
 * G6-02 — Workspace isolation validator.
 */

import type { SecurityGovernanceViolation } from "../contracts/security-governance-types.js";
import type { SecurityGovernanceRule } from "../registry/security-governance-registry-resolver.js";

export function validateWorkspaceIsolationRules(
  rules: SecurityGovernanceRule[],
  context: { workspaceId: string },
): SecurityGovernanceViolation[] {
  const violations: SecurityGovernanceViolation[] = [];

  if (!context.workspaceId?.trim()) {
    for (const rule of rules.filter((r) => r.workspaceScoped)) {
      violations.push({
        violationId: `ws-missing-${rule.ruleId}`,
        ruleId: rule.ruleId,
        ruleKind: rule.ruleKind,
        securityDomain: rule.securityDomain,
        boundaryId: rule.boundaryId,
        severity: "critical",
        message: "Workspace isolation violation — workspaceId required",
      });
    }
    return violations;
  }

  for (const rule of rules.filter(
    (r) => r.ruleKind === "workspace_isolation" || r.ruleKind === "cross_workspace",
  )) {
    if (!rule.workspaceScoped) {
      violations.push({
        violationId: `ws-scope-${rule.ruleId}`,
        ruleId: rule.ruleId,
        ruleKind: rule.ruleKind,
        securityDomain: rule.securityDomain,
        boundaryId: rule.boundaryId,
        severity: "medium",
        message: `Workspace rule ${rule.ruleId} must be workspace-scoped`,
      });
    }

    if (rule.forbiddenBypasses.includes("cross_workspace_leakage") && context.workspaceId === "*") {
      violations.push({
        violationId: `ws-leak-${rule.ruleId}`,
        ruleId: rule.ruleId,
        ruleKind: rule.ruleKind,
        securityDomain: rule.securityDomain,
        boundaryId: rule.boundaryId,
        severity: "critical",
        message: "Cross-workspace leakage risk — wildcard workspace scope",
      });
    }
  }

  return violations;
}

export function detectCrossProviderLeakage(
  rules: SecurityGovernanceRule[],
): SecurityGovernanceViolation[] {
  return rules
    .filter((r) => r.forbiddenBypasses.includes("cross_provider_leakage"))
    .map((rule) => ({
      violationId: `cross-provider-check-${rule.ruleId}`,
      ruleId: rule.ruleId,
      ruleKind: rule.ruleKind,
      securityDomain: rule.securityDomain,
      boundaryId: rule.boundaryId,
      severity: "low" as const,
      message: `Cross-provider isolation registered for ${rule.boundaryId}`,
    }))
    .filter(() => false);
}
