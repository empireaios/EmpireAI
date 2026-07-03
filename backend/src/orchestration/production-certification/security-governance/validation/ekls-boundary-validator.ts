/**
 * G6-02 — EKLS boundary validator.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import type { SecurityGovernanceViolation } from "../contracts/security-governance-types.js";
import type { SecurityGovernanceRule } from "../registry/security-governance-registry-resolver.js";

export function validateEklsBoundaryRules(
  rules: SecurityGovernanceRule[],
  context: { actorId: string; workspaceId: string },
): SecurityGovernanceViolation[] {
  const violations: SecurityGovernanceViolation[] = [];

  for (const rule of rules.filter(
    (r) => r.ruleKind === "ekls_boundary" || r.requiredGovernance.includes("ekls"),
  )) {
    const ekls = enforceEklsAccess(
      {
        pillowGovernance: true,
        actorId: context.actorId,
        workspaceId: context.workspaceId,
        consumerChannel: "production-certification",
        operation: "store",
      },
      context.workspaceId,
    );

    if (!ekls.allowed && rule.ruleKind === "ekls_boundary") {
      violations.push({
        violationId: `ekls-${rule.ruleId}`,
        ruleId: rule.ruleId,
        ruleKind: rule.ruleKind,
        securityDomain: rule.securityDomain,
        boundaryId: rule.boundaryId,
        severity: "critical",
        message: `EKLS boundary failure: ${ekls.reason}`,
      });
    }

    if (rule.forbiddenBypasses.includes("ekls_bypass") && !ekls.allowed) {
      violations.push({
        violationId: `ekls-bypass-${rule.ruleId}`,
        ruleId: rule.ruleId,
        ruleKind: rule.ruleKind,
        securityDomain: rule.securityDomain,
        boundaryId: rule.boundaryId,
        severity: "critical",
        message: "EKLS bypass detected — access not Pillow-governed",
      });
    }
  }

  return violations;
}
