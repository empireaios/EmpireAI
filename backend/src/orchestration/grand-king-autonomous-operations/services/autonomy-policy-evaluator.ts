/**
 * G7-07 — Autonomy policy evaluator (registry-driven).
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { AutonomousDomainId, AutonomyLevel } from "../../../registry/types/autonomous-operations-registry-types.js";
import { AUTONOMOUS_DOMAIN_IDS } from "../../../registry/types/autonomous-operations-registry-types.js";
import {
  deriveAutonomySignalFromRef,
  resolveAutonomousOperationDependencies,
  resolveAutonomyLevelFromPolicyRefs,
} from "../registry/autonomous-operations-registry-resolver.js";

export type AutonomyPolicyEvaluation = {
  domainId: AutonomousDomainId;
  autonomyLevel: AutonomyLevel;
  eligible: boolean;
  policyReference: string;
  riskThresholdRef: string;
  evaluatedAt: string;
};

export function evaluateAutonomyPolicy(
  domainId: AutonomousDomainId,
  context: RegistryLoaderContext = {},
): AutonomyPolicyEvaluation {
  const deps = resolveAutonomousOperationDependencies(context);
  const refs = [...deps.readinessSignals, ...deps.opportunityRuleRefs];
  const autonomyLevel = resolveAutonomyLevelFromPolicyRefs(refs, domainId);
  const signal = refs.reduce((sum, ref) => sum + deriveAutonomySignalFromRef(ref), 0) / Math.max(refs.length, 1);

  const eligible =
    autonomyLevel !== "manual_only" &&
    autonomyLevel !== "emergency_stop" &&
    !deps.blockerConditions.some((condition) => process.env[condition.toUpperCase().replace(/[^A-Z0-9]/g, "_")] === "true");

  return {
    domainId,
    autonomyLevel,
    eligible,
    policyReference: deps.readinessPolicy,
    riskThresholdRef: deps.prioritizationRuleRefs[0] ?? "rule:risk-adjusted",
    evaluatedAt: new Date().toISOString(),
  };
}

export function evaluateAllAutonomyPolicies(context: RegistryLoaderContext = {}): AutonomyPolicyEvaluation[] {
  return AUTONOMOUS_DOMAIN_IDS.map((domainId) => evaluateAutonomyPolicy(domainId, context));
}
