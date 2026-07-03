/**
 * G6-01 — Ownership validator.
 */

import type { OwnershipMatrixEntry, PlatformIntegrityViolation } from "../contracts/platform-integrity-types.js";
import type { PlatformIntegrityRule } from "../registry/platform-integrity-registry-resolver.js";

export function validateOwnershipRules(rules: PlatformIntegrityRule[]): {
  matrix: OwnershipMatrixEntry[];
  violations: PlatformIntegrityViolation[];
} {
  const ownershipRules = rules.filter((rule) => rule.ruleKind === "ownership");
  const matrix: OwnershipMatrixEntry[] = [];
  const violations: PlatformIntegrityViolation[] = [];

  for (const rule of ownershipRules) {
    const entry: OwnershipMatrixEntry = {
      subsystemId: rule.subsystemId,
      canonicalOwner: rule.canonicalOwner,
      actualOwner: rule.canonicalOwner,
      compliant: true,
      forbiddenOwners: rule.forbiddenOwners,
    };
    matrix.push(entry);
  }

  return { matrix, violations };
}

export function detectDuplicateOwnership(
  rules: PlatformIntegrityRule[],
): PlatformIntegrityViolation[] {
  const subsystemOwners = new Map<string, Set<string>>();
  for (const rule of rules.filter((r) => r.ruleKind === "ownership")) {
    const owners = subsystemOwners.get(rule.subsystemId) ?? new Set<string>();
    owners.add(rule.canonicalOwner);
    subsystemOwners.set(rule.subsystemId, owners);
  }

  const findings: PlatformIntegrityViolation[] = [];
  for (const [subsystemId, owners] of subsystemOwners.entries()) {
    if (owners.size <= 1) continue;
    findings.push({
      violationId: `dup-own-${subsystemId}`,
      ruleId: "pint-duplicate-ownership-detector",
      ruleKind: "ownership",
      subsystemId,
      severity: "high",
      message: `Duplicate ownership detected for ${subsystemId}: ${[...owners].join(", ")}`,
      recommendation: "Assign a single canonical owner per subsystem",
    });
  }
  return findings;
}

export function detectMissingOwnership(rules: PlatformIntegrityRule[]): PlatformIntegrityViolation[] {
  const violations: PlatformIntegrityViolation[] = [];
  for (const rule of rules.filter((r) => r.ruleKind === "ownership")) {
    if (!rule.canonicalOwner?.trim()) {
      violations.push({
        violationId: `missing-own-${rule.ruleId}`,
        ruleId: rule.ruleId,
        ruleKind: "ownership",
        subsystemId: rule.subsystemId,
        severity: "critical",
        message: `Missing canonical owner for subsystem ${rule.subsystemId}`,
      });
    }
  }
  return violations;
}

export function detectInvalidOwnership(rules: PlatformIntegrityRule[]): PlatformIntegrityViolation[] {
  const violations: PlatformIntegrityViolation[] = [];
  for (const rule of rules.filter((r) => r.ruleKind === "ownership")) {
    for (const forbidden of rule.forbiddenOwners) {
      if (forbidden === rule.canonicalOwner) {
        violations.push({
          violationId: `invalid-own-${rule.ruleId}`,
          ruleId: rule.ruleId,
          ruleKind: "ownership",
          subsystemId: rule.subsystemId,
          severity: "critical",
          message: `Invalid ownership: canonical owner ${rule.canonicalOwner} is also forbidden`,
        });
      }
    }
  }
  return violations;
}
