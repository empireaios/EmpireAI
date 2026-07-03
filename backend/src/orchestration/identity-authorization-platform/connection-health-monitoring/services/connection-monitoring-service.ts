/**
 * G8-04 — Connection monitoring service.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  type ConnectionHealthAttentionItem,
  type ConnectionHealthCheck,
  type ConnectionHealthState,
  type ConnectionHealthSummary,
  type HealthCheckSeverity,
  type HealthCheckType,
  type ProviderHealthMatrixEntry,
  CONNECTION_HEALTH_MONITORING_VERSION,
} from "../contracts/connection-health-types.js";
import { recordConnectionHealthEklsObservation } from "../ekls/connection-health-ekls-integration.js";
import { validateConnectionHealthPillowGovernance } from "../governance/connection-health-pillow-governance.js";
import {
  resolveAllProviderMonitoringProfiles,
  resolveProviderMonitoringProfile,
} from "../registry/connection-health-resolver.js";
import { evaluateCredentialPresent, evaluateCredentialHealth } from "../evaluators/credential-health-evaluator.js";
import {
  evaluateAuthorizationStatus,
  evaluateScopeCompleteness,
} from "../evaluators/authorization-health-evaluator.js";
import { evaluateCredentialExpiry } from "../evaluators/expiry-evaluator.js";
import { evaluatePermissionCompleteness } from "../evaluators/permission-health-evaluator.js";
import {
  evaluateEnvironmentStatus,
  evaluateProviderAvailability,
  evaluateWebhookStatus,
} from "../evaluators/provider-health-evaluator.js";
import { evaluateReadinessStatus } from "../evaluators/readiness-health-bridge.js";
import { resolveConnectionRequirements } from "../../connection-registry/registry/connection-registry-resolver.js";
import { resolveProviderCredentialRequirements } from "../../credential-vault-integration/registry/credential-vault-resolver.js";
import { listCredentialReferences } from "../../credential-vault-integration/services/credential-handoff-service.js";
import { listAuthorizationRequests } from "../../authorization-framework/services/authorization-flow-service.js";

const healthChecks = new Map<string, ConnectionHealthCheck>();
const providerOverallStatus = new Map<string, ConnectionHealthState>();

const STATUS_PRIORITY: Record<ConnectionHealthState, number> = {
  healthy: 0,
  unknown: 1,
  warning: 2,
  degraded: 3,
  missing_permissions: 4,
  missing_credentials: 5,
  misconfigured: 6,
  requires_review: 7,
  requires_reconnect: 8,
  expired: 9,
  revoked: 10,
  failed: 11,
  unavailable: 12,
};

function worstStatus(a: ConnectionHealthState, b: ConnectionHealthState): ConnectionHealthState {
  return STATUS_PRIORITY[a] >= STATUS_PRIORITY[b] ? a : b;
}

export function resetConnectionMonitoringStateForTests(): void {
  healthChecks.clear();
  providerOverallStatus.clear();
}

function requireGovernance(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId: string;
  providerId?: string;
  operation: "check" | "list" | "summary" | "matrix" | "attention";
}) {
  const governance = validateConnectionHealthPillowGovernance({
    ...input,
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    throw new Error(governance.reason);
  }
}

function runSingleCheck(input: {
  checkType: HealthCheckType;
  providerId: string;
  connectionId: string;
  workspaceId: string;
  accountHolderId: string;
  environment: "sandbox" | "production";
  context: RegistryLoaderContext;
}) {
  const requirement = resolveConnectionRequirements(input.context).find((r) => r.providerId === input.providerId);
  const credentialReq = resolveProviderCredentialRequirements(input.providerId, input.context);
  const refs = listCredentialReferences(input.context).filter((r) => r.providerId === input.providerId);
  const authRequests = listAuthorizationRequests().filter(
    (r) => r.providerId === input.providerId && r.workspaceId === input.workspaceId,
  );
  const latestAuth = authRequests[authRequests.length - 1];

  switch (input.checkType) {
    case "credential_present":
      return evaluateCredentialPresent({ providerId: input.providerId, workspaceId: input.workspaceId });
    case "credential_expiry":
      return evaluateCredentialExpiry({
        providerId: input.providerId,
        expiresAt: refs[0]?.expiresAt ?? latestAuth?.expiresAt ?? null,
        expiryPolicyRef: credentialReq?.expiryPolicyRef,
      });
    case "authorization_status":
      return evaluateAuthorizationStatus({ providerId: input.providerId, workspaceId: input.workspaceId });
    case "scope_completeness":
      return evaluateScopeCompleteness({
        providerId: input.providerId,
        requiredScopes: requirement?.requiredScopes ?? [],
        grantedScopes: latestAuth?.requestedScopes ?? [],
      });
    case "permission_completeness":
      return evaluatePermissionCompleteness({
        providerId: input.providerId,
        requiredPermissions: requirement?.requiredPermissions ?? [],
        grantedPermissions: latestAuth?.requestedPermissions ?? [],
      });
    case "webhook_status":
      return evaluateWebhookStatus({ providerId: input.providerId });
    case "provider_availability":
      return evaluateProviderAvailability({ providerId: input.providerId, context: input.context });
    case "sandbox_status":
      return evaluateEnvironmentStatus({
        providerId: input.providerId,
        environment: "sandbox",
        context: input.context,
      });
    case "production_status":
      return evaluateEnvironmentStatus({
        providerId: input.providerId,
        environment: input.environment,
        context: input.context,
      });
    case "readiness_status":
      return evaluateReadinessStatus(input.context);
    case "manual_review":
      return {
        status: "requires_review" as const,
        severity: "low" as const,
        message: "Manual review check registered from monitor",
        evidence: [`manual-review:${input.providerId}`],
        expiry: null,
        requiredAction: "manual_review",
      };
    default:
      return evaluateCredentialHealth({ providerId: input.providerId });
  }
}

function recordHealthEklsForStatus(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId: string;
  providerId: string;
  connectionId: string;
  healthCheckId: string;
  status: ConnectionHealthState;
  previousStatus?: ConnectionHealthState;
}) {
  recordConnectionHealthEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    providerId: input.providerId,
    connectionId: input.connectionId,
    healthCheckId: input.healthCheckId,
    kind: "connection_health_checked",
    summary: `Health check completed — status: ${input.status}`,
    pillowGovernance: true,
  });

  if (input.status === "expired") {
    recordConnectionHealthEklsObservation({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      accountHolderId: input.accountHolderId,
      providerId: input.providerId,
      connectionId: input.connectionId,
      kind: "connection_expired",
      summary: "Connection expired",
      pillowGovernance: true,
    });
  }
  if (input.status === "revoked") {
    recordConnectionHealthEklsObservation({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      accountHolderId: input.accountHolderId,
      providerId: input.providerId,
      connectionId: input.connectionId,
      kind: "connection_revoked",
      summary: "Connection revoked",
      pillowGovernance: true,
    });
  }
  if (input.status === "requires_reconnect") {
    recordConnectionHealthEklsObservation({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      accountHolderId: input.accountHolderId,
      providerId: input.providerId,
      connectionId: input.connectionId,
      kind: "connection_requires_reconnect",
      summary: "Connection requires reconnect",
      pillowGovernance: true,
    });
  }
  if (
    input.previousStatus &&
    input.previousStatus !== "healthy" &&
    input.status === "healthy"
  ) {
    recordConnectionHealthEklsObservation({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      accountHolderId: input.accountHolderId,
      providerId: input.providerId,
      connectionId: input.connectionId,
      kind: "connection_health_recovered",
      summary: "Connection health recovered",
      pillowGovernance: true,
    });
  }
  if (input.status === "degraded" || input.status === "warning" || input.status === "failed") {
    recordConnectionHealthEklsObservation({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      accountHolderId: input.accountHolderId,
      providerId: input.providerId,
      connectionId: input.connectionId,
      kind: "connection_health_degraded",
      summary: `Connection health degraded — ${input.status}`,
      pillowGovernance: true,
    });
  }
}

export function runConnectionHealthCheck(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  accountHolderId: string;
  providerId: string;
  environment?: "sandbox" | "production";
  context?: RegistryLoaderContext;
  pillowGovernance: true;
}): ConnectionHealthCheck[] {
  const context = input.context ?? { workspaceId: input.workspaceId };
  const profile = resolveProviderMonitoringProfile(input.providerId, context);
  if (!profile) {
    recordConnectionHealthEklsObservation({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      accountHolderId: input.accountHolderId,
      providerId: input.providerId,
      kind: "connection_monitoring_failed",
      summary: "Monitoring failed — provider not in registry",
      pillowGovernance: true,
    });
    throw new Error(`Provider not found in registry: ${input.providerId}`);
  }

  requireGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    providerId: input.providerId,
    operation: "check",
  });

  const previousStatus = providerOverallStatus.get(input.providerId);
  const results: ConnectionHealthCheck[] = [];
  let overall: ConnectionHealthState = "healthy";

  for (const checkType of profile.checkTypes) {
    const evaluation = runSingleCheck({
      checkType,
      providerId: input.providerId,
      connectionId: profile.connectionId,
      workspaceId: input.workspaceId,
      accountHolderId: input.accountHolderId,
      environment: input.environment ?? "production",
      context,
    });

    overall = worstStatus(overall, evaluation.status);
    const healthCheckId = randomUUID();
    const correlationId = randomUUID();
    const now = new Date().toISOString();

    const check: ConnectionHealthCheck = {
      healthCheckId,
      connectionId: profile.connectionId,
      providerId: input.providerId,
      workspaceId: input.workspaceId,
      accountHolderId: input.accountHolderId,
      environment: input.environment ?? "production",
      checkType,
      status: evaluation.status,
      severity: evaluation.severity,
      message: evaluation.message,
      evidence: evaluation.evidence,
      lastCheckedAt: now,
      nextCheckAt: null,
      expiry: evaluation.expiry,
      requiredAction: evaluation.requiredAction,
      correlationId,
      governanceState: "pillow-governed",
    };

    healthChecks.set(healthCheckId, check);
    results.push(check);

    recordHealthEklsForStatus({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      accountHolderId: input.accountHolderId,
      providerId: input.providerId,
      connectionId: profile.connectionId,
      healthCheckId,
      status: evaluation.status,
      previousStatus,
    });
  }

  providerOverallStatus.set(input.providerId, overall);
  return results;
}

export function listConnectionHealthChecks(context: RegistryLoaderContext = {}): ConnectionHealthCheck[] {
  void context;
  return Array.from(healthChecks.values());
}

export function getConnectionHealthDetail(providerId: string): {
  providerId: string;
  overallStatus: ConnectionHealthState;
  checks: ConnectionHealthCheck[];
} | undefined {
  const checks = Array.from(healthChecks.values()).filter((c) => c.providerId === providerId);
  if (checks.length === 0) return undefined;
  const overall = checks.reduce(
    (acc, check) => worstStatus(acc, check.status),
    "healthy" as ConnectionHealthState,
  );
  return { providerId, overallStatus: overall, checks };
}

export function getConnectionHealthSummary(input: {
  workspaceId: string;
  context?: RegistryLoaderContext;
}): ConnectionHealthSummary {
  const context = input.context ?? { workspaceId: input.workspaceId };
  const profiles = resolveAllProviderMonitoringProfiles(context);
  const checks = listConnectionHealthChecks(context);
  let healthyCount = 0;
  let degradedCount = 0;
  let attentionCount = 0;
  let overall: ConnectionHealthState = "healthy";

  for (const profile of profiles) {
    const providerChecks = checks.filter((c) => c.providerId === profile.providerId);
    const status =
      providerOverallStatus.get(profile.providerId) ??
      (providerChecks.length > 0
        ? providerChecks.reduce((acc, c) => worstStatus(acc, c.status), "healthy" as ConnectionHealthState)
        : "unknown");
    overall = worstStatus(overall, status);
    if (status === "healthy") healthyCount += 1;
    else if (status === "degraded" || status === "warning") degradedCount += 1;
    else attentionCount += 1;
  }

  return {
    workspaceId: input.workspaceId,
    providerCount: profiles.length,
    healthyCount,
    degradedCount,
    attentionCount,
    overallStatus: overall,
    computedAt: new Date().toISOString(),
  };
}

export function getConnectionHealthAttentionItems(context: RegistryLoaderContext = {}): ConnectionHealthAttentionItem[] {
  const checks = listConnectionHealthChecks(context);
  const attentionStatuses = new Set<ConnectionHealthState>([
    "degraded",
    "warning",
    "expired",
    "revoked",
    "failed",
    "missing_credentials",
    "missing_permissions",
    "requires_reconnect",
    "requires_review",
    "misconfigured",
    "unavailable",
  ]);

  const byProvider = new Map<string, ConnectionHealthCheck>();
  for (const check of checks) {
    if (!attentionStatuses.has(check.status)) continue;
    const existing = byProvider.get(check.providerId);
    if (!existing || STATUS_PRIORITY[check.status] > STATUS_PRIORITY[existing.status]) {
      byProvider.set(check.providerId, check);
    }
  }

  return Array.from(byProvider.values()).map((check) => ({
    attentionId: `attention:${check.providerId}:${check.checkType}`,
    providerId: check.providerId,
    connectionId: check.connectionId,
    status: check.status,
    severity: check.severity,
    message: check.message,
    requiredAction: check.requiredAction,
  }));
}

export function getProviderHealthMatrix(context: RegistryLoaderContext = {}): ProviderHealthMatrixEntry[] {
  const profiles = resolveAllProviderMonitoringProfiles(context);
  const checks = listConnectionHealthChecks(context);

  return profiles.map((profile) => {
    const providerChecks = checks.filter((c) => c.providerId === profile.providerId);
    const status =
      providerOverallStatus.get(profile.providerId) ??
      (providerChecks.length > 0
        ? providerChecks.reduce((acc, c) => worstStatus(acc, c.status), "unknown" as ConnectionHealthState)
        : "unknown");
    const worstSeverity = providerChecks.reduce(
      (acc, c) => c.severity,
      "info" as HealthCheckSeverity,
    );
    const lastChecked = providerChecks.reduce<string | null>((acc, c) => {
      if (!acc) return c.lastCheckedAt;
      return c.lastCheckedAt > acc ? c.lastCheckedAt : acc;
    }, null);

    return {
      providerId: profile.providerId,
      displayName: profile.displayName,
      status,
      severity: worstSeverity,
      checkCount: providerChecks.length,
      lastCheckedAt: lastChecked,
    };
  });
}

export function getConnectionHealthMonitoringVersion() {
  return CONNECTION_HEALTH_MONITORING_VERSION;
}
