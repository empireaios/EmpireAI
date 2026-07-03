/**
 * G8-04 — Authorization health evaluator.
 */

import type { ConnectionHealthState, HealthCheckSeverity } from "../contracts/connection-health-types.js";
import { listAuthorizationRequests } from "../../authorization-framework/services/authorization-flow-service.js";

export type EvaluatorResult = {
  status: ConnectionHealthState;
  severity: HealthCheckSeverity;
  message: string;
  evidence: string[];
  expiry: string | null;
  requiredAction: string | null;
};

export function evaluateAuthorizationStatus(input: {
  providerId: string;
  workspaceId: string;
}): EvaluatorResult {
  const requests = listAuthorizationRequests().filter(
    (r) => r.providerId === input.providerId && r.workspaceId === input.workspaceId,
  );
  if (requests.length === 0) {
    return {
      status: "requires_reconnect",
      severity: "high",
      message: "No authorization flow found for provider",
      evidence: [`authorization:missing:${input.providerId}`],
      expiry: null,
      requiredAction: "start_authorization",
    };
  }
  const latest = requests[requests.length - 1]!;
  if (latest.flowState === "authorized") {
    return {
      status: "healthy",
      severity: "info",
      message: "Authorization active",
      evidence: [`authorization:${latest.authorizationId}`],
      expiry: latest.expiresAt,
      requiredAction: null,
    };
  }
  if (latest.flowState === "expired" || latest.flowState === "revoked") {
    return {
      status: latest.flowState === "revoked" ? "revoked" : "expired",
      severity: "critical",
      message: `Authorization ${latest.flowState}`,
      evidence: [`authorization:${latest.authorizationId}`],
      expiry: latest.expiresAt,
      requiredAction: "requires_reconnect",
    };
  }
  if (latest.flowState === "failed" || latest.flowState === "cancelled") {
    return {
      status: "failed",
      severity: "high",
      message: `Authorization ${latest.flowState}`,
      evidence: [`authorization:${latest.authorizationId}`],
      expiry: latest.expiresAt,
      requiredAction: "start_authorization",
    };
  }
  return {
    status: "warning",
    severity: "medium",
    message: `Authorization in progress: ${latest.flowState}`,
    evidence: [`authorization:${latest.authorizationId}`],
    expiry: latest.expiresAt,
    requiredAction: "complete_authorization",
  };
}

export function evaluateScopeCompleteness(input: {
  providerId: string;
  requiredScopes: string[];
  grantedScopes: string[];
}): EvaluatorResult {
  const missing = input.requiredScopes.filter((s) => !input.grantedScopes.includes(s));
  if (missing.length > 0) {
    return {
      status: "misconfigured",
      severity: "medium",
      message: "Required scopes incomplete",
      evidence: missing.map((s) => `scope:missing:${s}`),
      expiry: null,
      requiredAction: "reauthorize_scopes",
    };
  }
  return {
    status: "healthy",
    severity: "info",
    message: "Scope completeness verified",
    evidence: input.grantedScopes.map((s) => `scope:granted:${s}`),
    expiry: null,
    requiredAction: null,
  };
}
