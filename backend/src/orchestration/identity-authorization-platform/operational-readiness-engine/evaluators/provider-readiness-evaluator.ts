/**
 * G8-06 — Provider readiness evaluator.
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type { ReadinessLevel } from "../contracts/readiness-types.js";
import { listAuthorizationRequests } from "../../authorization-framework/services/authorization-flow-service.js";
import { listCredentialReferences } from "../../credential-vault-integration/services/credential-handoff-service.js";
import { listConnectionHealthChecks } from "../../connection-health-monitoring/services/connection-monitoring-service.js";
import { resolveConnectionRequirements } from "../../connection-registry/registry/connection-registry-resolver.js";

export type ProviderReadinessState = {
  providerId: string;
  connected: boolean;
  expired: boolean;
  degraded: boolean;
  missingCredential: boolean;
  missingPermissions: boolean;
  missingScopes: boolean;
  level: ReadinessLevel;
  evidence: string[];
};

export function evaluateProviderReadiness(input: {
  providerId: string;
  workspaceId: string;
  context?: RegistryLoaderContext;
}): ProviderReadinessState {
  const ctx = input.context ?? { workspaceId: input.workspaceId };
  const requirement = resolveConnectionRequirements(ctx).find((r) => r.providerId === input.providerId);
  const authRequests = listAuthorizationRequests().filter(
    (r) => r.providerId === input.providerId && r.workspaceId === input.workspaceId,
  );
  const latestAuth = authRequests[authRequests.length - 1];
  const credRefs = listCredentialReferences(ctx).filter((r) => r.providerId === input.providerId);
  const healthChecks = listConnectionHealthChecks(ctx).filter((c) => c.providerId === input.providerId);

  const connected = latestAuth?.flowState === "authorized" && credRefs.some((r) => r.status === "active");
  const expired =
    latestAuth?.flowState === "expired" ||
    healthChecks.some((c) => c.status === "expired") ||
    credRefs.some((r) => r.status === "expired");
  const degraded = healthChecks.some((c) => c.status === "degraded" || c.status === "warning");
  const missingCredential = credRefs.length === 0 || !credRefs.some((r) => r.status === "active");
  const grantedPerms = latestAuth?.requestedPermissions ?? [];
  const grantedScopes = latestAuth?.requestedScopes ?? [];
  const authorized = latestAuth?.flowState === "authorized" || latestAuth?.flowState === "partially_authorized";
  const missingPermissions =
    !authorized &&
    (requirement?.requiredPermissions ?? []).filter((p) => !grantedPerms.includes(p)).length > 0;
  const missingScopes =
    !authorized && (requirement?.requiredScopes ?? []).filter((s) => !grantedScopes.includes(s)).length > 0;

  const evidence: string[] = [`provider:${input.providerId}`];
  if (requirement) evidence.push(`requirement:${requirement.requirementId}`);

  let level: ReadinessLevel = "unknown";
  if (expired) level = "blocked";
  else if (missingCredential || missingPermissions || missingScopes) level = "not_ready";
  else if (degraded) level = "partially_ready";
  else if (connected) level = "ready";
  else level = "not_ready";

  return {
    providerId: input.providerId,
    connected,
    expired,
    degraded,
    missingCredential,
    missingPermissions,
    missingScopes,
    level,
    evidence,
  };
}

export function evaluateAllProviderReadiness(workspaceId: string, providerIds: string[], context?: RegistryLoaderContext) {
  return providerIds.map((providerId) =>
    evaluateProviderReadiness({ providerId, workspaceId, context: context ?? { workspaceId } }),
  );
}
