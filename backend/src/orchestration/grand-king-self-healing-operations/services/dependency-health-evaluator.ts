/**
 * G7-08 — Dependency health evaluator.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { SelfHealingDomainId } from "../../../registry/types/self-healing-registry-types.js";
import { resolveSelfHealingDependencies } from "../registry/self-healing-registry-resolver.js";
import { validateProductionEligibilityGate } from "../../grand-king-live-operations/services/production-eligibility-gate.js";

export type DependencyHealthResult = {
  domainId: SelfHealingDomainId;
  healthy: boolean;
  dependencyRefs: string[];
  reason: string;
};

export function evaluateDependencyHealth(
  domainId: SelfHealingDomainId,
  context: RegistryLoaderContext = {},
): DependencyHealthResult {
  const deps = resolveSelfHealingDependencies(context);
  const dependencyRefs = [
    deps.automationRecovery,
    deps.readinessPolicy,
    deps.connectionProvider,
  ];

  let productionEligible = false;
  try {
    productionEligible = validateProductionEligibilityGate(context).eligible;
  } catch {
    productionEligible = false;
  }

  const blocked = deps.blockerConditions.some(
    (c) => process.env[c.toUpperCase().replace(/[^A-Z0-9]/g, "_")] === "true",
  );

  return {
    domainId,
    healthy: productionEligible && !blocked,
    dependencyRefs,
    reason: productionEligible ? "Dependencies satisfied" : "Production eligibility not met",
  };
}

export function evaluateAllDependencyHealth(context: RegistryLoaderContext = {}): DependencyHealthResult[] {
  const domains: SelfHealingDomainId[] = [
    "commerce",
    "business_automation",
    "identity",
    "provider_connections",
    "infrastructure",
  ];
  return domains.map((d) => evaluateDependencyHealth(d, context));
}
