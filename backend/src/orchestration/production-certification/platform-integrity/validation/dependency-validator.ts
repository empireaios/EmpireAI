/**
 * G6-01 — Dependency validator.
 */

import type { DependencyMatrixEntry, PlatformIntegrityViolation } from "../contracts/platform-integrity-types.js";
import type { PlatformIntegrityRule } from "../registry/platform-integrity-registry-resolver.js";
import { resolveProgrammeModule } from "../registry/programme-module-resolver.js";

export function validateDependencyRules(rules: PlatformIntegrityRule[]): {
  matrix: DependencyMatrixEntry[];
  violations: PlatformIntegrityViolation[];
} {
  const matrix: DependencyMatrixEntry[] = [];
  const violations: PlatformIntegrityViolation[] = [];

  for (const rule of rules.filter((r) => r.ruleKind === "dependency" || r.ruleKind === "subsystem")) {
    const module = rule.moduleResolverRef ? resolveProgrammeModule(rule.moduleResolverRef) : undefined;
    const integratesWith = module?.integratesWith ?? rule.allowedDependencies;

    for (const dep of integratesWith) {
      const allowed = !rule.forbiddenDependencies.includes(dep);
      matrix.push({
        subsystemId: rule.subsystemId,
        dependencyId: dep,
        allowed,
        direction: "outbound",
      });
      if (!allowed) {
        violations.push({
          violationId: `dep-viol-${rule.ruleId}-${dep}`,
          ruleId: rule.ruleId,
          ruleKind: "dependency",
          subsystemId: rule.subsystemId,
          severity: "high",
          message: `Forbidden dependency ${dep} on subsystem ${rule.subsystemId}`,
          recommendation: `Remove dependency on ${dep}`,
        });
      }
    }

    for (const dep of rule.allowedDependencies) {
      if (matrix.some((e) => e.subsystemId === rule.subsystemId && e.dependencyId === dep)) continue;
      matrix.push({
        subsystemId: rule.subsystemId,
        dependencyId: dep,
        allowed: true,
        direction: "outbound",
      });
    }
  }

  return { matrix, violations };
}

export function detectCircularDependencies(matrix: DependencyMatrixEntry[]): PlatformIntegrityViolation[] {
  const graph = new Map<string, Set<string>>();
  for (const entry of matrix) {
    if (!entry.allowed) continue;
    const deps = graph.get(entry.subsystemId) ?? new Set<string>();
    deps.add(entry.dependencyId);
    graph.set(entry.subsystemId, deps);
  }

  const findings: PlatformIntegrityViolation[] = [];
  for (const [node, deps] of graph.entries()) {
    for (const dep of deps) {
      const reverse = graph.get(dep);
      if (reverse?.has(node)) {
        findings.push({
          violationId: `cycle-${node}-${dep}`,
          ruleId: "pint-circular-dependency-validator",
          ruleKind: "dependency",
          subsystemId: node,
          severity: "medium",
          message: `Circular dependency between ${node} and ${dep}`,
          recommendation: "Break circular integration path through Brain dispatch",
        });
      }
    }
  }
  return findings;
}

export function detectBrokenIntegrationPaths(rules: PlatformIntegrityRule[]): PlatformIntegrityViolation[] {
  const violations: PlatformIntegrityViolation[] = [];
  for (const rule of rules.filter((r) => r.ruleKind === "dependency")) {
    if (rule.allowedDependencies.length === 0 && rule.forbiddenDependencies.length === 0) {
      violations.push({
        violationId: `broken-int-${rule.ruleId}`,
        ruleId: rule.ruleId,
        ruleKind: "dependency",
        subsystemId: rule.subsystemId,
        severity: "low",
        message: `No integration path defined for subsystem ${rule.subsystemId}`,
      });
    }
  }
  return violations;
}
