/**
 * G8-07 — Automatic reauthorization & token lifecycle main service.
 */

import { randomUUID } from "node:crypto";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  AUTOMATIC_REAUTHORIZATION_VERSION,
  type ReauthorizationReason,
  type ReauthorizationRequest,
  type TokenLifecycleDetail,
  type TokenLifecycleState,
  type TokenLifecycleSummary,
} from "../contracts/token-lifecycle-types.js";
import { detectTokenExpiry } from "../evaluators/expiry-detector.js";
import { recordTokenLifecycleEklsObservation } from "../ekls/token-lifecycle-ekls-integration.js";
import { validateTokenLifecyclePillowGovernance } from "../governance/token-lifecycle-pillow-governance.js";
import { listTokenLifecyclePluginsByKind } from "../plugins/token-lifecycle-plugin-host.js";
import {
  resolveRefreshEligible,
  resolveRequiredActionFromProfile,
  resolveTokenLifecycleProfile,
} from "../registry/token-lifecycle-resolver.js";
import { generateReauthorizationRequest } from "../services/reauthorization-request-generator.js";
import { scanTokenLifecycleSchedule } from "../services/reauthorization-scheduler.js";
import {
  resolveReauthorizationTargetState,
  transitionReauthorizationState,
} from "../services/reauthorization-state-machine.js";
import { listAuthorizationRequests } from "../../authorization-framework/services/authorization-flow-service.js";
import { listCredentialReferences } from "../../credential-vault-integration/services/credential-handoff-service.js";
import { resolveAllConnectionProviders } from "../../connection-registry/registry/connection-registry-resolver.js";

const reauthorizationRequests = new Map<string, ReauthorizationRequest>();

export function resetReauthorizationStateForTests(): void {
  reauthorizationRequests.clear();
}

function requireGovernance(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId?: string;
  providerId?: string;
  operation: "scan" | "start" | "cancel" | "status" | "refresh" | "summary";
}) {
  const governance = validateTokenLifecyclePillowGovernance({
    ...input,
    pillowGovernance: true,
  });
  if (!governance.allowed) throw new Error(governance.reason);
  return governance;
}

function mapReason(state: TokenLifecycleState): ReauthorizationReason {
  switch (state) {
    case "expiring_soon":
      return "token_expiring";
    case "expired":
      return "token_expired";
    case "refresh_required":
    case "refreshing":
      return "refresh_required";
    case "refresh_failed":
      return "refresh_failed";
    case "revoked":
      return "permission_revoked";
    case "reconnect_required":
      return "provider_reconnect";
    default:
      return "manual_reconnect";
  }
}

function recordLifecycleEkls(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  providerId: string;
  reauthorizationId?: string;
  kind: Parameters<typeof recordTokenLifecycleEklsObservation>[0]["kind"];
  summary: string;
}) {
  recordTokenLifecycleEklsObservation({
    ...input,
    pillowGovernance: true,
  });
}

function buildDetail(
  providerId: string,
  workspaceId: string,
  context: RegistryLoaderContext,
): TokenLifecycleDetail | null {
  const profile = resolveTokenLifecycleProfile(providerId, context);
  if (!profile) return null;

  const authRequests = listAuthorizationRequests().filter(
    (r) => r.providerId === providerId && r.workspaceId === workspaceId,
  );
  const latestAuth = authRequests[authRequests.length - 1];
  const credRefs = listCredentialReferences(context).filter((r) => r.providerId === providerId);
  const credRef = credRefs[credRefs.length - 1];
  const detection = detectTokenExpiry({
    providerId,
    workspaceId,
    authorization: latestAuth,
    credentialRef: credRef,
    context,
  });

  const refreshEligible = resolveRefreshEligible(profile, detection.lifecycleState);
  const requiredAction = resolveRequiredActionFromProfile(profile, detection.lifecycleState);

  return {
    providerId,
    connectionId: latestAuth?.connectionId ?? `connection:${providerId}:${workspaceId}`,
    authorizationId: latestAuth?.authorizationId ?? null,
    credentialRefId: credRef?.credentialRefId ?? null,
    lifecycleState: detection.lifecycleState,
    expiry: detection.expiry,
    warningWindow: detection.warningWindow,
    refreshEligible,
    requiredAction,
    requiresUserAction: !refreshEligible || detection.lifecycleState === "reconnect_required",
    requiresPillowApproval: refreshEligible || detection.lifecycleState === "revoked",
    registryRefs: profile.registryRefs,
    governanceState: "pillow-governed",
  };
}

export function getTokenLifecycleSummary(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  pillowGovernance: true;
  context?: RegistryLoaderContext;
}): TokenLifecycleSummary {
  requireGovernance({ ...input, operation: "summary" });
  const ctx = input.context ?? { workspaceId: input.workspaceId };
  const providers = resolveAllConnectionProviders(ctx);
  const scan = scanTokenLifecycleSchedule({ workspaceId: input.workspaceId, context: ctx });

  const counts = {
    active: 0,
    expiring_soon: 0,
    expired: 0,
    reconnect_required: 0,
    reauthorization_pending: 0,
    revoked: 0,
  };

  for (const provider of providers) {
    const detail = buildDetail(provider.providerId, input.workspaceId, ctx);
    if (!detail) continue;
    if (detail.lifecycleState === "active") counts.active++;
    if (detail.lifecycleState === "expiring_soon") counts.expiring_soon++;
    if (detail.lifecycleState === "expired") counts.expired++;
    if (detail.lifecycleState === "reconnect_required") counts.reconnect_required++;
    if (detail.lifecycleState === "reauthorization_pending") counts.reauthorization_pending++;
    if (detail.lifecycleState === "revoked") counts.revoked++;
  }

  return {
    workspaceId: input.workspaceId,
    totalConnections: providers.length,
    activeCount: counts.active,
    expiringSoonCount: counts.expiring_soon,
    expiredCount: counts.expired,
    reconnectRequiredCount: counts.reconnect_required,
    reauthorizationPendingCount: counts.reauthorization_pending,
    revokedCount: counts.revoked,
    computedAt: new Date().toISOString(),
    correlationId: randomUUID(),
    governanceState: "pillow-governed",
  };
}

export function getTokenLifecycleDetail(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  providerId: string;
  pillowGovernance: true;
  context?: RegistryLoaderContext;
}) {
  requireGovernance({ ...input, operation: "status" });
  const ctx = input.context ?? { workspaceId: input.workspaceId };
  const detail = buildDetail(input.providerId, input.workspaceId, ctx);
  if (!detail) return { frameworkVersion: AUTOMATIC_REAUTHORIZATION_VERSION, found: false as const };
  return { frameworkVersion: AUTOMATIC_REAUTHORIZATION_VERSION, found: true as const, detail };
}

export function listReauthorizationRequired(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  pillowGovernance: true;
  context?: RegistryLoaderContext;
}) {
  requireGovernance({ ...input, operation: "scan" });
  const ctx = input.context ?? { workspaceId: input.workspaceId };
  const scheduled = scanTokenLifecycleSchedule({ workspaceId: input.workspaceId, context: ctx });
  const required = scheduled.filter((s) =>
    ["expiring_soon", "expired", "refresh_required", "reconnect_required", "revoked"].includes(s.lifecycleState),
  );
  return {
    frameworkVersion: AUTOMATIC_REAUTHORIZATION_VERSION,
    required,
    correlationId: randomUUID(),
  };
}

export function getTokenExpiryWarnings(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  pillowGovernance: true;
  context?: RegistryLoaderContext;
}) {
  requireGovernance({ ...input, operation: "scan" });
  const ctx = input.context ?? { workspaceId: input.workspaceId };
  const warnings = scanTokenLifecycleSchedule({ workspaceId: input.workspaceId, context: ctx }).filter(
    (s) => s.lifecycleState === "expiring_soon",
  );

  for (const warning of warnings) {
    recordLifecycleEkls({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      providerId: warning.providerId,
      kind: "token_expiring_soon",
      summary: `Token expiring soon for ${warning.providerId}`,
    });
  }

  return {
    frameworkVersion: AUTOMATIC_REAUTHORIZATION_VERSION,
    warnings,
    correlationId: randomUUID(),
  };
}

export function getRefreshEligibility(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  providerId: string;
  pillowGovernance: true;
  context?: RegistryLoaderContext;
}) {
  requireGovernance({ ...input, operation: "refresh" });
  const ctx = input.context ?? { workspaceId: input.workspaceId };
  const profile = resolveTokenLifecycleProfile(input.providerId, ctx);
  if (!profile) {
    return {
      frameworkVersion: AUTOMATIC_REAUTHORIZATION_VERSION,
      refreshEligible: false,
      reason: "Provider not found",
    };
  }

  const detail = buildDetail(input.providerId, input.workspaceId, ctx);
  const refreshEligible = detail ? resolveRefreshEligible(profile, detail.lifecycleState) : false;
  const refreshProviders = listTokenLifecyclePluginsByKind("refresh_provider");

  if (!refreshEligible && profile.supportsRefreshToken) {
    recordLifecycleEkls({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      providerId: input.providerId,
      kind: "refresh_blocked",
      summary: `Refresh blocked for ${input.providerId} — Pillow or lifecycle state`,
    });
  }

  return {
    frameworkVersion: AUTOMATIC_REAUTHORIZATION_VERSION,
    providerId: input.providerId,
    refreshEligible,
    supportsRefreshToken: profile.supportsRefreshToken,
    authorizationType: profile.authorizationType,
    credentialKind: profile.credentialKind,
    pluginRefreshAvailable: refreshProviders.length > 0,
    lifecycleState: detail?.lifecycleState ?? "unknown",
    registryRefs: profile.registryRefs,
  };
}

export function startReauthorization(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  accountHolderId: string;
  providerId: string;
  pillowGovernance: true;
  context?: RegistryLoaderContext;
}) {
  requireGovernance({ ...input, operation: "start" });
  const ctx = input.context ?? { workspaceId: input.workspaceId };
  const profile = resolveTokenLifecycleProfile(input.providerId, ctx);
  if (!profile) throw new Error(`Provider not found: ${input.providerId}`);

  const authRequests = listAuthorizationRequests().filter(
    (r) => r.providerId === input.providerId && r.workspaceId === input.workspaceId,
  );
  const latestAuth = authRequests[authRequests.length - 1];
  if (!latestAuth) throw new Error("No authorization found for reauthorization");

  const credRefs = listCredentialReferences(ctx).filter((r) => r.providerId === input.providerId);
  const credRef = credRefs[credRefs.length - 1];
  const detection = detectTokenExpiry({
    providerId: input.providerId,
    workspaceId: input.workspaceId,
    authorization: latestAuth,
    credentialRef: credRef,
    context: ctx,
  });

  const targetState = resolveReauthorizationTargetState({
    currentState: detection.lifecycleState,
    refreshEligible: resolveRefreshEligible(profile, detection.lifecycleState),
    action: "start",
  });
  const transition = transitionReauthorizationState(detection.lifecycleState, targetState);
  const lifecycleState = transition.ok ? transition.state : targetState;

  const request = generateReauthorizationRequest({
    providerId: input.providerId,
    connectionId: latestAuth.connectionId,
    authorizationId: latestAuth.authorizationId,
    credentialRefId: credRef?.credentialRefId ?? null,
    workspaceId: input.workspaceId,
    accountHolderId: input.accountHolderId,
    environment: latestAuth.environment,
    profile,
    detection,
    lifecycleState,
    reason: mapReason(lifecycleState),
  });

  reauthorizationRequests.set(request.reauthorizationId, request);

  recordLifecycleEkls({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    providerId: input.providerId,
    reauthorizationId: request.reauthorizationId,
    kind: "reauthorization_requested",
    summary: `Reauthorization requested for ${input.providerId}: ${request.reason}`,
  });

  if (request.refreshEligible) {
    recordLifecycleEkls({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      providerId: input.providerId,
      reauthorizationId: request.reauthorizationId,
      kind: "refresh_attempted",
      summary: `Refresh handoff initiated for ${input.providerId} (no live provider call)`,
    });

    const refreshProviders = listTokenLifecyclePluginsByKind("refresh_provider");
    if (refreshProviders.length === 0) {
      request.lifecycleState = "reauthorization_pending";
      request.updatedAt = new Date().toISOString();
      reauthorizationRequests.set(request.reauthorizationId, request);
    } else {
      const completeTransition = transitionReauthorizationState(request.lifecycleState, "reauthorized");
      if (completeTransition.ok) {
        request.lifecycleState = "reauthorized";
        request.updatedAt = new Date().toISOString();
        reauthorizationRequests.set(request.reauthorizationId, request);
        recordLifecycleEkls({
          actorId: input.actorId,
          workspaceId: input.workspaceId,
          ownerId: input.ownerId,
          providerId: input.providerId,
          reauthorizationId: request.reauthorizationId,
          kind: "reauthorization_completed",
          summary: `Reauthorization completed via plugin for ${input.providerId}`,
        });
      }
    }
  }

  if (detection.lifecycleState === "expired") {
    recordLifecycleEkls({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      providerId: input.providerId,
      reauthorizationId: request.reauthorizationId,
      kind: "token_expired",
      summary: `Token expired for ${input.providerId}`,
    });
  }

  return {
    frameworkVersion: AUTOMATIC_REAUTHORIZATION_VERSION,
    request,
    handoffOnly: true,
    liveProviderCall: false,
  };
}

export function cancelReauthorization(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  reauthorizationId: string;
  pillowGovernance: true;
}) {
  requireGovernance({ ...input, operation: "cancel" });
  const request = reauthorizationRequests.get(input.reauthorizationId);
  if (!request) throw new Error("Reauthorization request not found");
  if (request.workspaceId !== input.workspaceId) throw new Error("Workspace isolation violation");

  const targetState = resolveReauthorizationTargetState({
    currentState: request.lifecycleState,
    refreshEligible: request.refreshEligible,
    action: "cancel",
  });
  request.lifecycleState = targetState;
  request.updatedAt = new Date().toISOString();
  reauthorizationRequests.set(input.reauthorizationId, request);

  return {
    frameworkVersion: AUTOMATIC_REAUTHORIZATION_VERSION,
    request,
    cancelled: true,
  };
}

export function getReauthorizationStatus(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  reauthorizationId?: string;
  providerId?: string;
  pillowGovernance: true;
}) {
  requireGovernance({ ...input, operation: "status", providerId: input.providerId });
  if (input.reauthorizationId) {
    const request = reauthorizationRequests.get(input.reauthorizationId);
    if (!request || request.workspaceId !== input.workspaceId) {
      return { frameworkVersion: AUTOMATIC_REAUTHORIZATION_VERSION, found: false as const };
    }
    return { frameworkVersion: AUTOMATIC_REAUTHORIZATION_VERSION, found: true as const, request };
  }

  const requests = Array.from(reauthorizationRequests.values()).filter(
    (r) =>
      r.workspaceId === input.workspaceId && (!input.providerId || r.providerId === input.providerId),
  );
  return {
    frameworkVersion: AUTOMATIC_REAUTHORIZATION_VERSION,
    requests,
    correlationId: randomUUID(),
  };
}

export function listReauthorizationRequests(): ReauthorizationRequest[] {
  return Array.from(reauthorizationRequests.values());
}

export function getAutomaticReauthorizationVersion(): string {
  return AUTOMATIC_REAUTHORIZATION_VERSION;
}
