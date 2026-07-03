/**
 * G6-02 — Boundary validators for commerce, automation, identity, cockpit, vault.
 */

import { resolveProgrammeModule } from "../../platform-integrity/registry/programme-module-resolver.js";
import type { SecurityGovernanceViolation } from "../contracts/security-governance-types.js";
import type { SecurityGovernanceRule } from "../registry/security-governance-registry-resolver.js";

const BOUNDARY_RULE_KINDS = [
  "commerce_boundary",
  "automation_boundary",
  "identity_boundary",
  "cockpit_boundary",
  "vault_integration",
  "governance",
] as const;

export function validateBoundaryRules(rules: SecurityGovernanceRule[]): SecurityGovernanceViolation[] {
  const violations: SecurityGovernanceViolation[] = [];

  for (const rule of rules.filter((r) =>
    (BOUNDARY_RULE_KINDS as readonly string[]).includes(r.ruleKind),
  )) {
    if (rule.moduleResolverRef) {
      const module = resolveProgrammeModule(rule.moduleResolverRef);
      if (!module) {
        violations.push({
          violationId: `boundary-mod-${rule.ruleId}`,
          ruleId: rule.ruleId,
          ruleKind: rule.ruleKind,
          securityDomain: rule.securityDomain,
          boundaryId: rule.boundaryId,
          severity: "high",
          message: `Boundary module not resolved for ${rule.boundaryId}`,
        });
        continue;
      }

      for (const gov of rule.requiredGovernance) {
        if (gov === "pillow" && !module.integratesWith.includes("pillow")) {
          violations.push({
            violationId: `boundary-gov-${rule.ruleId}-${gov}`,
            ruleId: rule.ruleId,
            ruleKind: rule.ruleKind,
            securityDomain: rule.securityDomain,
            boundaryId: rule.boundaryId,
            severity: "high",
            message: `${rule.boundaryId} must integrate with ${gov}`,
          });
        }
      }
    }

    if (rule.ruleKind === "vault_integration" && rule.forbiddenBypasses.includes("vault_bypass")) {
      if (!rule.requiredGovernance.includes("pillow")) {
        violations.push({
          violationId: `vault-${rule.ruleId}`,
          ruleId: rule.ruleId,
          ruleKind: rule.ruleKind,
          securityDomain: rule.securityDomain,
          boundaryId: rule.boundaryId,
          severity: "critical",
          message: "Vault integration requires Pillow governance — bypass not permitted",
        });
      }
    }
  }

  return violations;
}
