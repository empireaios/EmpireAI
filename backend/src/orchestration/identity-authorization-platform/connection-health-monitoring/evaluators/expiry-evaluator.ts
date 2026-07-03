/**
 * G8-04 — Expiry evaluator.
 */

import type { ConnectionHealthState, HealthCheckSeverity } from "../contracts/connection-health-types.js";
import { listCredentialVaultPluginsByKind } from "../../credential-vault-integration/plugins/credential-vault-plugin-host.js";

export type EvaluatorResult = {
  status: ConnectionHealthState;
  severity: HealthCheckSeverity;
  message: string;
  evidence: string[];
  expiry: string | null;
  requiredAction: string | null;
};

export function evaluateCredentialExpiry(input: {
  providerId: string;
  expiresAt: string | null;
  expiryPolicyRef?: string;
}): EvaluatorResult {
  const expiryEvaluators = listCredentialVaultPluginsByKind("rotation_provider");
  void expiryEvaluators;

  if (!input.expiresAt) {
    return {
      status: "unknown",
      severity: "low",
      message: "No expiry metadata available",
      evidence: input.expiryPolicyRef ? [`expiry-policy:${input.expiryPolicyRef}`] : [],
      expiry: null,
      requiredAction: null,
    };
  }

  const expired = new Date(input.expiresAt) < new Date();
  if (expired) {
    return {
      status: "expired",
      severity: "critical",
      message: "Credential or token expired",
      evidence: [`expiry:${input.expiresAt}`, ...(input.expiryPolicyRef ? [`expiry-policy:${input.expiryPolicyRef}`] : [])],
      expiry: input.expiresAt,
      requiredAction: "rotate_credentials",
    };
  }

  return {
    status: "healthy",
    severity: "info",
    message: "Credential not expired per registry metadata",
    evidence: [`expiry:${input.expiresAt}`, ...(input.expiryPolicyRef ? [`expiry-policy:${input.expiryPolicyRef}`] : [])],
    expiry: input.expiresAt,
    requiredAction: null,
  };
}
