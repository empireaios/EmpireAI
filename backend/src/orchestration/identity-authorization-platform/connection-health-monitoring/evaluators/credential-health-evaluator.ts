/**
 * G8-04 — Credential health evaluator.
 */

import type { ConnectionHealthState, HealthCheckSeverity } from "../contracts/connection-health-types.js";
import {
  getCredentialReferenceDetail,
  listCredentialReferences,
} from "../../credential-vault-integration/services/credential-handoff-service.js";

export type EvaluatorResult = {
  status: ConnectionHealthState;
  severity: HealthCheckSeverity;
  message: string;
  evidence: string[];
  expiry: string | null;
  requiredAction: string | null;
};

export function evaluateCredentialPresent(input: {
  providerId: string;
  workspaceId: string;
}): EvaluatorResult {
  const refs = listCredentialReferences({ workspaceId: input.workspaceId }).filter(
    (r) => r.providerId === input.providerId && r.status === "active",
  );
  if (refs.length === 0) {
    return {
      status: "missing_credentials",
      severity: "high",
      message: "No active credential reference found for provider",
      evidence: [`credential-ref:missing:${input.providerId}`],
      expiry: null,
      requiredAction: "submit_credentials",
    };
  }
  return {
    status: "healthy",
    severity: "info",
    message: "Credential reference present",
    evidence: refs.map((r) => `credential-ref:${r.credentialRefId}`),
    expiry: refs[0]?.expiresAt ?? null,
    requiredAction: null,
  };
}

export function evaluateCredentialHealth(input: {
  providerId: string;
  credentialRefId?: string;
}): EvaluatorResult {
  const refs = listCredentialReferences().filter((r) => r.providerId === input.providerId);
  const ref = input.credentialRefId
    ? refs.find((r) => r.credentialRefId === input.credentialRefId)
    : refs[0];
  if (!ref) {
    return {
      status: "missing_credentials",
      severity: "high",
      message: "Credential reference not found",
      evidence: [],
      expiry: null,
      requiredAction: "submit_credentials",
    };
  }
  const detail = getCredentialReferenceDetail(ref.credentialRefId);
  if (ref.status === "revoked") {
    return {
      status: "revoked",
      severity: "critical",
      message: "Credential reference revoked",
      evidence: [`credential-ref:${ref.credentialRefId}`],
      expiry: ref.expiresAt,
      requiredAction: "reauthorize",
    };
  }
  if (detail?.expiry.expired) {
    return {
      status: "expired",
      severity: "critical",
      message: "Credential reference expired",
      evidence: [`credential-ref:${ref.credentialRefId}`, `expiry-policy:${ref.rotationPolicy}`],
      expiry: ref.expiresAt,
      requiredAction: "rotate_credentials",
    };
  }
  if (detail?.health.healthStatus === "degraded") {
    return {
      status: "degraded",
      severity: "medium",
      message: "Credential health degraded",
      evidence: [`credential-ref:${ref.credentialRefId}`],
      expiry: ref.expiresAt,
      requiredAction: "verify_credentials",
    };
  }
  return {
    status: "healthy",
    severity: "info",
    message: "Credential health nominal",
    evidence: [`credential-ref:${ref.credentialRefId}`],
    expiry: ref.expiresAt,
    requiredAction: null,
  };
}
