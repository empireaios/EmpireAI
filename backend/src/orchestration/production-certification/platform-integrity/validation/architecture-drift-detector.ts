/**
 * G6-01 — Architecture drift detector.
 */

import type { PlatformIntegrityViolation } from "../contracts/platform-integrity-types.js";
import type { PlatformIntegrityRule } from "../registry/platform-integrity-registry-resolver.js";
import { resolveProgrammeModule } from "../registry/programme-module-resolver.js";

export function detectArchitecturalDrift(rules: PlatformIntegrityRule[]): PlatformIntegrityViolation[] {
  const findings: PlatformIntegrityViolation[] = [];

  for (const rule of rules.filter((r) => r.ruleKind === "drift")) {
    const module = rule.moduleResolverRef ? resolveProgrammeModule(rule.moduleResolverRef) : undefined;
    const integratesWith = module?.integratesWith ?? [];

    for (const forbidden of rule.forbiddenDependencies) {
      if (integratesWith.includes(forbidden as never)) {
        findings.push({
          violationId: `drift-${rule.ruleId}-${forbidden}`,
          ruleId: rule.ruleId,
          ruleKind: "drift",
          subsystemId: rule.subsystemId,
          severity: "critical",
          message: `Architectural drift: ${rule.subsystemId} integrates with forbidden ${forbidden}`,
          recommendation: `Remove ${forbidden} integration from ${rule.subsystemId}`,
        });
      }
    }

    for (const forbidden of rule.forbiddenOwners) {
      if (module?.moduleId === forbidden) {
        findings.push({
          violationId: `drift-own-${rule.ruleId}`,
          ruleId: rule.ruleId,
          ruleKind: "drift",
          subsystemId: rule.subsystemId,
          severity: "high",
          message: `Architectural drift: ${rule.subsystemId} owns forbidden subsystem ${forbidden}`,
        });
      }
    }
  }

  return findings;
}

export function detectMissingCertificationRecords(
  programmeResults: Array<{ programmeRef: string; status: string }>,
): PlatformIntegrityViolation[] {
  return programmeResults
    .filter((entry) => entry.status === "fail" || entry.status === "blocked")
    .map((entry) => ({
      violationId: `missing-cert-${entry.programmeRef}`,
      ruleId: "pint-programme-integrity",
      ruleKind: "programme",
      subsystemId: entry.programmeRef,
      severity: "high",
      message: `Missing or invalid certification record for programme ${entry.programmeRef}`,
      recommendation: "Complete programme certification mission",
    }));
}
