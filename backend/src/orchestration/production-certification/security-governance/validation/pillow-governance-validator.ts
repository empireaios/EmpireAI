/**
 * G6-02 — Pillow governance validator.
 */

import { validateCertificationPillowGovernance } from "../../governance/certification-pillow-governance.js";
import type { SecurityGovernanceViolation } from "../contracts/security-governance-types.js";
import type { SecurityGovernanceRule } from "../registry/security-governance-registry-resolver.js";

export function validatePillowGovernanceRules(
  rules: SecurityGovernanceRule[],
  context: { actorId: string; workspaceId: string },
): SecurityGovernanceViolation[] {
  const violations: SecurityGovernanceViolation[] = [];

  for (const rule of rules.filter(
    (r) => r.ruleKind === "pillow_governance" || r.requiredGovernance.includes("pillow"),
  )) {
    const governance = validateCertificationPillowGovernance({
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      operation: "run_full",
      pillowGovernance: true,
    });

    if (!governance.allowed) {
      violations.push({
        violationId: `pillow-${rule.ruleId}`,
        ruleId: rule.ruleId,
        ruleKind: rule.ruleKind,
        securityDomain: rule.securityDomain,
        boundaryId: rule.boundaryId,
        severity: "critical",
        message: `Pillow governance failure: ${governance.reason}`,
        recommendation: "Resolve Pillow governance before certification",
      });
    }

    if (rule.forbiddenBypasses.includes("pillow_bypass") && !governance.certificationAuthority) {
      violations.push({
        violationId: `pillow-bypass-${rule.ruleId}`,
        ruleId: rule.ruleId,
        ruleKind: rule.ruleKind,
        securityDomain: rule.securityDomain,
        boundaryId: rule.boundaryId,
        severity: "critical",
        message: "Pillow bypass detected — certification authority not validated",
      });
    }
  }

  return violations;
}
