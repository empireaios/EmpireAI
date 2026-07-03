/**
 * G8-04 — Readiness health bridge.
 */

import type { ConnectionHealthState, HealthCheckSeverity } from "../contracts/connection-health-types.js";
import { computeReadinessPercentage } from "../../registry/identity-authorization-registry-resolver.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { resolveIdentityPlatformDependencies } from "../../registry/identity-authorization-registry-resolver.js";

export type EvaluatorResult = {
  status: ConnectionHealthState;
  severity: HealthCheckSeverity;
  message: string;
  evidence: string[];
  expiry: string | null;
  requiredAction: string | null;
};

export function evaluateReadinessStatus(context: RegistryLoaderContext = {}): EvaluatorResult {
  const readiness = computeReadinessPercentage(context);
  const policies = resolveIdentityPlatformDependencies(context).readinessPolicies;
  const blockerRefs = policies.flatMap((p) => p.blockerConditions);

  if (readiness >= 85) {
    return {
      status: "healthy",
      severity: "info",
      message: "Connection readiness within target",
      evidence: [`readiness:${readiness}%`, ...policies.map((p) => `readiness-policy:${p.policyId}`)],
      expiry: null,
      requiredAction: null,
    };
  }
  if (readiness >= 50) {
    return {
      status: "degraded",
      severity: "medium",
      message: "Connection readiness below target",
      evidence: [`readiness:${readiness}%`, ...blockerRefs.map((b) => `blocker:${b}`)],
      expiry: null,
      requiredAction: "improve_readiness",
    };
  }
  return {
    status: "requires_review",
    severity: "high",
    message: "Connection readiness critically low",
    evidence: [`readiness:${readiness}%`, ...blockerRefs.map((b) => `blocker:${b}`)],
    expiry: null,
    requiredAction: "executive_review",
  };
}
