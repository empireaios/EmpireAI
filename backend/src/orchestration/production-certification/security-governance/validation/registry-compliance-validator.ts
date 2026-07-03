/**
 * G6-02 — Registry compliance validator.
 */

import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import type { SecurityGovernanceViolation } from "../contracts/security-governance-types.js";
import type { SecurityGovernanceRule } from "../registry/security-governance-registry-resolver.js";

export function validateRegistryComplianceRules(
  rules: SecurityGovernanceRule[],
  context: { workspaceId: string },
): SecurityGovernanceViolation[] {
  const violations: SecurityGovernanceViolation[] = [];

  for (const rule of rules.filter(
    (r) => r.ruleKind === "registry_integrity" || r.registryRef,
  )) {
    if (!rule.registryRef) continue;
    let resolvedOk = false;
    try {
      const result = getRegistryLoader().resolve(
        { workspaceId: context.workspaceId },
        rule.registryRef as Parameters<ReturnType<typeof getRegistryLoader>["resolve"]>[1],
      );
      resolvedOk = result.meta.wired;
      if (!resolvedOk) {
        violations.push({
          violationId: `registry-${rule.ruleId}`,
          ruleId: rule.ruleId,
          ruleKind: rule.ruleKind,
          securityDomain: rule.securityDomain,
          boundaryId: rule.boundaryId,
          severity: "high",
          message: `Registry ${rule.registryRef} not wired for compliance check`,
          recommendation: `Wire registry ${rule.registryRef}`,
        });
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      violations.push({
        violationId: `registry-fail-${rule.ruleId}`,
        ruleId: rule.ruleId,
        ruleKind: rule.ruleKind,
        securityDomain: rule.securityDomain,
        boundaryId: rule.boundaryId,
        severity: "critical",
        message: `Registry compliance failure: ${reason}`,
      });
    }

    if (rule.forbiddenBypasses.includes("registry_bypass") && !resolvedOk) {
      violations.push({
        violationId: `registry-bypass-${rule.ruleId}`,
        ruleId: rule.ruleId,
        ruleKind: rule.ruleKind,
        securityDomain: rule.securityDomain,
        boundaryId: rule.boundaryId,
        severity: "critical",
        message: "Registry bypass — governance chain incomplete",
      });
    }
  }

  return violations;
}
