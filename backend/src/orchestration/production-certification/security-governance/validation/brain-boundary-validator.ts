/**
 * G6-02 — Brain boundary validator.
 */

import { resolveProgrammeModule } from "../../platform-integrity/registry/programme-module-resolver.js";
import type { SecurityGovernanceViolation } from "../contracts/security-governance-types.js";
import type { SecurityGovernanceRule } from "../registry/security-governance-registry-resolver.js";

export function validateBrainBoundaryRules(rules: SecurityGovernanceRule[]): SecurityGovernanceViolation[] {
  const violations: SecurityGovernanceViolation[] = [];

  for (const rule of rules.filter((r) => r.ruleKind === "brain_boundary")) {
    if (!rule.requiredGovernance.includes("pillow")) {
      violations.push({
        violationId: `brain-gov-${rule.ruleId}`,
        ruleId: rule.ruleId,
        ruleKind: rule.ruleKind,
        securityDomain: rule.securityDomain,
        boundaryId: rule.boundaryId,
        severity: "critical",
        message: "Brain boundary requires Pillow governance in rule configuration",
      });
    }

    if (rule.moduleResolverRef) {
      const module = resolveProgrammeModule(rule.moduleResolverRef);
      if (!module?.integratesWith.includes("pillow")) {
        violations.push({
          violationId: `brain-int-${rule.ruleId}`,
          ruleId: rule.ruleId,
          ruleKind: rule.ruleKind,
          securityDomain: rule.securityDomain,
          boundaryId: rule.boundaryId,
          severity: "high",
          message: `Brain module ${module?.moduleId ?? "unknown"} must integrate with Pillow`,
        });
      }
    }

    if (rule.forbiddenBypasses.includes("brain_bypass")) {
      const module = rule.moduleResolverRef
        ? resolveProgrammeModule(rule.moduleResolverRef)
        : undefined;
      const bypassRisk = module && !module.integratesWith.includes("pillow");
      if (bypassRisk) {
        violations.push({
          violationId: `brain-bypass-${rule.ruleId}`,
          ruleId: rule.ruleId,
          ruleKind: rule.ruleKind,
          securityDomain: rule.securityDomain,
          boundaryId: rule.boundaryId,
          severity: "critical",
          message: "Brain bypass risk — module not Pillow-governed",
        });
      }
    }
  }

  return violations;
}
