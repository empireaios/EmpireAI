/**
 * G6-02 — Plugin security validator.
 */

import { resolveProgrammeModule } from "../../platform-integrity/registry/programme-module-resolver.js";
import type { SecurityGovernanceViolation } from "../contracts/security-governance-types.js";
import type { SecurityGovernanceRule } from "../registry/security-governance-registry-resolver.js";

export function validatePluginSecurityRules(rules: SecurityGovernanceRule[]): SecurityGovernanceViolation[] {
  const violations: SecurityGovernanceViolation[] = [];

  for (const rule of rules.filter((r) => r.ruleKind === "plugin_trust" || r.pluginTrustRequired)) {
    if (!rule.requiredGovernance.includes("pillow")) {
      violations.push({
        violationId: `plugin-pillow-${rule.ruleId}`,
        ruleId: rule.ruleId,
        ruleKind: rule.ruleKind,
        securityDomain: rule.securityDomain,
        boundaryId: rule.boundaryId,
        severity: "high",
        message: "Plugin trust requires Pillow governance",
      });
    }

    if (!rule.requiredGovernance.includes("registry")) {
      violations.push({
        violationId: `plugin-registry-${rule.ruleId}`,
        ruleId: rule.ruleId,
        ruleKind: rule.ruleKind,
        securityDomain: rule.securityDomain,
        boundaryId: rule.boundaryId,
        severity: "medium",
        message: "Plugin trust requires registry governance reference",
      });
    }

    if (rule.forbiddenBypasses.includes("plugin_privilege_escalation")) {
      const registryModule = resolveProgrammeModule("resolve:identity-registry-module");
      if (registryModule && !registryModule.integratesWith.includes("registry")) {
        violations.push({
          violationId: `plugin-priv-${rule.ruleId}`,
          ruleId: rule.ruleId,
          ruleKind: rule.ruleKind,
          securityDomain: rule.securityDomain,
          boundaryId: rule.boundaryId,
          severity: "critical",
          message: "Plugin privilege escalation risk — registry chain incomplete",
        });
      }
    }
  }

  return violations;
}

export function detectUnauthorizedExecution(rules: SecurityGovernanceRule[]): SecurityGovernanceViolation[] {
  return rules
    .filter((r) => r.forbiddenBypasses.includes("unauthorized_execution"))
    .flatMap((rule) => {
      if (!rule.requiredGovernance.includes("pillow")) {
        return [{
          violationId: `unauth-exec-${rule.ruleId}`,
          ruleId: rule.ruleId,
          ruleKind: rule.ruleKind,
          securityDomain: rule.securityDomain,
          boundaryId: rule.boundaryId,
          severity: "critical" as const,
          message: `Unauthorized execution risk on ${rule.boundaryId} — Pillow not required`,
        }];
      }
      return [];
    });
}
