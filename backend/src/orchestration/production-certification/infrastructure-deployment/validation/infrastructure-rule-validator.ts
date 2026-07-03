/**
 * G6-03 — Shared infrastructure rule validation helpers.
 */

import type { InfrastructureDeploymentViolation, ServiceHealthEntry } from "../contracts/infrastructure-deployment-types.js";
import type { InfrastructureDeploymentRule } from "../registry/infrastructure-deployment-registry-resolver.js";
import { resolveDeploymentSignals } from "../registry/deployment-signal-resolver.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { getRegistryLoader } from "../../../../registry/registry-loader.js";

export function validateInfrastructureRulesByKind(
  rules: InfrastructureDeploymentRule[],
  ruleKinds: InfrastructureDeploymentRule["ruleKind"][],
  context: RegistryLoaderContext,
): { violations: InfrastructureDeploymentViolation[]; serviceHealth: ServiceHealthEntry[] } {
  const violations: InfrastructureDeploymentViolation[] = [];
  const serviceHealth: ServiceHealthEntry[] = [];
  const kindSet = new Set(ruleKinds);

  for (const rule of rules.filter((r) => kindSet.has(r.ruleKind))) {
    const signals = resolveDeploymentSignals(rule.readinessSignals, context);
    const passed = signals.filter((s) => s.satisfied).length;
    const allPassed = signals.length === 0 || passed === signals.length;

    serviceHealth.push({
      serviceId: rule.serviceId,
      infrastructureDomain: rule.infrastructureDomain,
      status: allPassed ? "healthy" : signals.some((s) => s.satisfied) ? "degraded" : "unavailable",
      signalCount: signals.length,
      passedSignals: passed,
    });

    if (!allPassed) {
      const missing = signals.filter((s) => !s.satisfied).map((s) => s.signalRef);
      violations.push({
        violationId: `infr-${rule.ruleId}`,
        ruleId: rule.ruleId,
        ruleKind: rule.ruleKind,
        infrastructureDomain: rule.infrastructureDomain,
        serviceId: rule.serviceId,
        severity: rule.healthCheckKind === "available" ? "critical" : "high",
        message: `Infrastructure readiness failed for ${rule.serviceId}: missing signals ${missing.join(", ")}`,
        recommendation: `Satisfy deployment signals for ${rule.infrastructureDomain}`,
      });
    }

    if (rule.registryRef) {
      try {
        const result = getRegistryLoader().resolve(
          context,
          rule.registryRef as Parameters<ReturnType<typeof getRegistryLoader>["resolve"]>[1],
        );
        if (!result.meta.wired) {
          violations.push({
            violationId: `registry-${rule.ruleId}`,
            ruleId: rule.ruleId,
            ruleKind: rule.ruleKind,
            infrastructureDomain: rule.infrastructureDomain,
            serviceId: rule.serviceId,
            severity: "medium",
            message: `Registry ${rule.registryRef} not wired for ${rule.serviceId}`,
          });
        }
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        violations.push({
          violationId: `registry-fail-${rule.ruleId}`,
          ruleId: rule.ruleId,
          ruleKind: rule.ruleKind,
          infrastructureDomain: rule.infrastructureDomain,
          serviceId: rule.serviceId,
          severity: "high",
          message: `Registry resolution failed: ${reason}`,
        });
      }
    }
  }

  return { violations, serviceHealth };
}
