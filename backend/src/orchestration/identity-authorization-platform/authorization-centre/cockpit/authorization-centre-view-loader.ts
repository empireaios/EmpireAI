/**
 * G8-05 — Authorization Centre view loader (Brain aggregation — G8-00 through G8-04).
 */

import {
  getAuthorizationRequirements,
  getAuthorizationStatus,
  listAuthorizationRequests,
} from "../../authorization-framework/services/authorization-flow-service.js";
import { searchAuthorizationFrameworkEklsObservations } from "../../authorization-framework/ekls/authorization-framework-ekls-integration.js";
import { resolveProviderAuthorizationRequirements } from "../../authorization-framework/registry/authorization-framework-resolver.js";
import { searchConnectionHealthEklsObservations } from "../../connection-health-monitoring/ekls/connection-health-ekls-integration.js";
import {
  getConnectionHealthAttentionItems,
  getConnectionHealthSummary,
  getProviderHealthMatrix,
  listConnectionHealthChecks,
} from "../../connection-health-monitoring/services/connection-monitoring-service.js";
import { resolveAllProviderMonitoringProfiles } from "../../connection-health-monitoring/registry/connection-health-resolver.js";
import { searchConnectionRegistryEklsObservations } from "../../connection-registry/ekls/connection-registry-ekls-integration.js";
import {
  resolveAllConnectionProviders,
  resolveConnectionAccountHolders,
  resolveConnectionRequirements,
} from "../../connection-registry/registry/connection-registry-resolver.js";
import { searchCredentialVaultEklsObservations } from "../../credential-vault-integration/ekls/credential-vault-ekls-integration.js";
import { listCredentialReferences } from "../../credential-vault-integration/services/credential-handoff-service.js";
import { computeReadinessPercentage } from "../../registry/identity-authorization-registry-resolver.js";
import { buildCockpitReadinessSummary } from "../../operational-readiness-engine/contracts/readiness-cockpit-contracts.js";
import { buildCockpitTokenLifecycleView } from "../../automatic-reauthorization/contracts/token-lifecycle-cockpit-contracts.js";
import { searchReadinessEklsObservations } from "../../operational-readiness-engine/ekls/readiness-ekls-integration.js";
import { searchTokenLifecycleEklsObservations } from "../../automatic-reauthorization/ekls/token-lifecycle-ekls-integration.js";
import { buildIdentityPluginCockpitView } from "../../identity-plugin-integration/contracts/identity-plugin-cockpit-contracts.js";
import {
  applyCockpitIsolationFilter,
  buildCockpitIsolationSummary,
} from "../../multi-workspace-isolation/contracts/isolation-cockpit-contracts.js";
import { searchIsolationEklsObservations } from "../../multi-workspace-isolation/ekls/isolation-ekls-integration.js";
import type { IsolationActorContext } from "../../multi-workspace-isolation/contracts/isolation-types.js";
import { searchIdentityAuthorizationEklsObservations } from "../../ekls/identity-authorization-ekls-integration.js";
import { validateConnectionHealthPillowGovernance } from "../../connection-health-monitoring/governance/connection-health-pillow-governance.js";
import {
  AUTHORIZATION_CENTRE_ROUTE,
  AUTHORIZATION_CENTRE_SCREEN_ID,
  type AuthorizationCentreAction,
  type AuthorizationCentreRecentActivity,
  type AuthorizationCentreView,
  type AuthorizationProviderCard,
  type AuthorizationProviderDetailView,
} from "../contracts/authorization-centre-types.js";
import { authorizationCentrePluginRegistry } from "./authorization-centre-plugin-registry.js";

const DEFAULT_ACTOR = {
  actorId: "grand-king",
  ownerId: "grand-king",
  accountHolderId: "grand-king",
};

function resolvePrimaryAction(input: {
  authorizationStatus: string;
  credentialStatus: string;
  healthStatus: string;
  requiredAction: string | null;
}): AuthorizationProviderCard["primaryAction"] {
  if (input.healthStatus === "requires_reconnect" || input.authorizationStatus === "expired") return "reconnect";
  if (input.credentialStatus === "missing" || input.authorizationStatus === "not_started") return "connect";
  if (input.requiredAction === "manual_review" || input.healthStatus === "requires_review") return "review";
  return "none";
}

function buildProviderCard(
  providerId: string,
  displayName: string,
  providerKind: string,
  workspaceId: string,
  context: { workspaceId: string },
): AuthorizationProviderCard {
  const requirement = resolveConnectionRequirements(context).find((r) => r.providerId === providerId);
  const authRequests = listAuthorizationRequests().filter(
    (r) => r.providerId === providerId && r.workspaceId === workspaceId,
  );
  const latestAuth = authRequests[authRequests.length - 1];
  const credRefs = listCredentialReferences(context).filter((r) => r.providerId === providerId);
  const healthChecks = listConnectionHealthChecks(context).filter((c) => c.providerId === providerId);
  const worstHealth = healthChecks.reduce<string>(
    (acc, check) => (check.status !== "healthy" ? check.status : acc),
    healthChecks.length > 0 ? "healthy" : "unknown",
  );
  const attention = getConnectionHealthAttentionItems(context).find((a) => a.providerId === providerId);

  const authorizationStatus = latestAuth?.flowState ?? "not_started";
  const credentialStatus = credRefs.some((r) => r.status === "active")
    ? "active"
    : credRefs.length > 0
      ? credRefs[0]!.status
      : "missing";
  const connectionStatus =
    authorizationStatus === "authorized" && credentialStatus === "active"
      ? "connected"
      : authorizationStatus === "not_started"
        ? "disconnected"
        : authorizationStatus;

  return {
    providerId,
    providerName: displayName,
    providerCategory: providerKind,
    connectionStatus,
    authorizationStatus,
    credentialStatus,
    healthStatus: worstHealth,
    readinessStatus: connectionStatus === "connected" ? "ready" : "not_ready",
    expiry: latestAuth?.expiresAt ?? credRefs[0]?.expiresAt ?? null,
    requiredAction: attention?.requiredAction ?? null,
    accountHolderId: DEFAULT_ACTOR.accountHolderId,
    accountHolderType: requirement?.accountHolderTypeRef ?? "grand-king",
    environment: latestAuth?.environment ?? "production",
    lastVerified: credRefs[0]?.lastVerifiedAt ?? null,
    primaryAction: resolvePrimaryAction({
      authorizationStatus,
      credentialStatus,
      healthStatus: worstHealth,
      requiredAction: attention?.requiredAction ?? null,
    }),
  };
}

function collectRecentActivity(workspaceId: string): AuthorizationCentreRecentActivity[] {
  const sources = [
    ...searchIdentityAuthorizationEklsObservations({ workspaceId, pillowGovernance: true }).map((o) => ({
      channel: "identity-authorization",
      ...o,
    })),
    ...searchConnectionRegistryEklsObservations({ workspaceId, pillowGovernance: true }).map((o) => ({
      channel: "connection-registry",
      ...o,
    })),
    ...searchAuthorizationFrameworkEklsObservations({ workspaceId, pillowGovernance: true }).map((o) => ({
      channel: "authorization-framework",
      ...o,
    })),
    ...searchCredentialVaultEklsObservations({ workspaceId, pillowGovernance: true }).map((o) => ({
      channel: "credential-vault-integration",
      ...o,
    })),
    ...searchConnectionHealthEklsObservations({ workspaceId, pillowGovernance: true }).map((o) => ({
      channel: "connection-health-monitoring",
      ...o,
    })),
    ...searchReadinessEklsObservations({ workspaceId, pillowGovernance: true }).map((o) => ({
      channel: "operational-readiness-engine",
      ...o,
    })),
    ...searchTokenLifecycleEklsObservations({ workspaceId, pillowGovernance: true }).map((o) => ({
      channel: "automatic-reauthorization",
      ...o,
    })),
    ...searchIsolationEklsObservations({ workspaceId, pillowGovernance: true }).map((o) => ({
      channel: "multi-workspace-isolation",
      ...o,
    })),
  ];

  return sources
    .map((entry) => ({
      activityId: entry.observationId,
      kind: entry.kind,
      providerId: entry.providerId,
      summary: entry.summary,
      recordedAt: entry.recordedAt,
    }))
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))
    .slice(0, 20);
}

export function loadAuthorizationCentreView(
  workspaceId: string,
  isolationActor?: IsolationActorContext,
): AuthorizationCentreView {
  const context = { workspaceId };
  const providers = resolveAllConnectionProviders(context);
  const providerCards = providers.map((p) =>
    buildProviderCard(p.providerId, p.displayName, p.providerCategory, workspaceId, context),
  );

  const connected = providerCards.filter((c) => c.connectionStatus === "connected").length;
  const disconnected = providerCards.filter((c) => c.connectionStatus === "disconnected").length;
  const expired = providerCards.filter(
    (c) => c.authorizationStatus === "expired" || c.healthStatus === "expired",
  ).length;
  const missingCreds = providerCards.filter((c) => c.credentialStatus === "missing").length;
  const missingPerms = providerCards.filter((c) => c.healthStatus === "missing_permissions").length;
  const reconnect = providerCards.filter(
    (c) => c.primaryAction === "reconnect" || c.healthStatus === "requires_reconnect",
  ).length;

  const accountHolders = resolveConnectionAccountHolders(context);
  const accountHolderGroups = accountHolders.map((holder) => ({
    accountHolderTypeId: holder.accountHolderTypeId,
    accountHolderTypeName: holder.accountHolderTypeName,
    connectionCount: providerCards.filter((c) => c.accountHolderType === holder.accountHolderTypeId).length,
    providerIds: providerCards
      .filter((c) => c.accountHolderType === holder.accountHolderTypeId)
      .map((c) => c.providerId),
  }));

  const matrix = getProviderHealthMatrix(context);
  const attentionItems = getConnectionHealthAttentionItems(context);
  const recentActivity = collectRecentActivity(workspaceId);
  const eklsReferenceCount = recentActivity.length;

  const pluginWidgets = authorizationCentrePluginRegistry.listWidgets().map((widget) => ({
    pluginId: widget.pluginId,
    title: widget.title,
    summary: widget.buildSummary({ workspaceId }).summary,
  }));

  const readiness = buildCockpitReadinessSummary(workspaceId);
  const tokenLifecycle = buildCockpitTokenLifecycleView(workspaceId);

  const actor: IsolationActorContext =
    isolationActor ??
    ({
      actorId: DEFAULT_ACTOR.actorId,
      ownerId: DEFAULT_ACTOR.ownerId,
      accountHolderId: DEFAULT_ACTOR.accountHolderId,
      accountHolderTypeId: "grand-king",
      workspaceId,
      pillowGovernance: true,
    } as const);

  const pluginIntegration = buildIdentityPluginCockpitView({
    workspaceId,
    actorId: actor.actorId,
    ownerId: actor.ownerId,
    pillowGovernance: true,
    correlationId: readiness.correlationId,
  });

  const baseView: AuthorizationCentreView = {
    computedAt: new Date().toISOString(),
    workspaceId,
    screenId: AUTHORIZATION_CENTRE_SCREEN_ID,
    route: AUTHORIZATION_CENTRE_ROUTE,
    dataMode: "identity-authorization",
    overview: {
      overallReadinessPercent: computeReadinessPercentage(context),
      connectedProviders: connected,
      disconnectedProviders: disconnected,
      expiredAuthorizations: expired,
      missingCredentials: missingCreds,
      missingPermissions: missingPerms,
      reconnectRequired: reconnect,
    },
    providerCards,
    providerMatrix: matrix,
    attentionItems,
    accountHolderGroups,
    grandKingConnections: providerCards
      .filter((c) => c.accountHolderType === "grand-king")
      .map((c) => c.providerId),
    futureCustomerConnections: providerCards
      .filter((c) => c.accountHolderType === "future-founder")
      .map((c) => c.providerId),
    recentActivity,
    eklsReferenceCount,
    pillowGovernanceState: "pillow-governed",
    pluginWidgets,
    brainModule: "identity-authorization",
    readinessSummary: {
      overallReadinessScore: readiness.overallReadinessScore,
      overallReadinessLevel: readiness.overallReadinessLevel,
      blockedActions: readiness.blockedActions,
      nextRequiredAction: readiness.nextRequiredAction,
      providerReadinessCount: readiness.providerReadiness.length,
      correlationId: readiness.correlationId,
    },
    tokenLifecycleSummary: {
      expiringSoonCount: tokenLifecycle.summary.expiringSoonCount,
      expiredCount: tokenLifecycle.summary.expiredCount,
      reconnectRequiredCount: tokenLifecycle.summary.reconnectRequiredCount,
      reauthorizationPendingCount: tokenLifecycle.summary.reauthorizationPendingCount,
      requiredAccountHolderAction: tokenLifecycle.requiredAccountHolderAction,
    },
  };

  const filteredView = applyCockpitIsolationFilter({ view: baseView, actor });
  const isolationSummary = buildCockpitIsolationSummary({ view: baseView, actor });

  return {
    ...filteredView,
    isolationSummary: {
      viewerScope: isolationSummary.viewerScope,
      visibleProviderCount: isolationSummary.visibleProviderCount,
      hiddenProviderCount: isolationSummary.hiddenProviderCount,
      isolationEnforced: true,
      requiredAccountHolderAction: isolationSummary.requiredAccountHolderAction,
    },
    pluginIntegrationSummary: pluginIntegration.summary,
  };
}

export function loadAuthorizationCentreDetailView(
  workspaceId: string,
  providerId: string,
): AuthorizationProviderDetailView | null {
  const context = { workspaceId };
  const providers = resolveAllConnectionProviders(context);
  const provider = providers.find((p) => p.providerId === providerId);
  if (!provider) return null;

  const card = buildProviderCard(provider.providerId, provider.displayName, provider.providerCategory, workspaceId, context);
  const authReq = resolveProviderAuthorizationRequirements(providerId, context);
  const authRequests = listAuthorizationRequests().filter(
    (r) => r.providerId === providerId && r.workspaceId === workspaceId,
  );
  const latestAuth = authRequests[authRequests.length - 1];
  const grantedScopes = latestAuth?.requestedScopes ?? [];
  const grantedPermissions = latestAuth?.requestedPermissions ?? [];
  const requiredScopes = authReq?.requestedScopes ?? [];
  const requiredPermissions = authReq?.requestedPermissions ?? [];
  const credRefs = listCredentialReferences(context)
    .filter((r) => r.providerId === providerId)
    .map((r) => ({
      credentialRefId: r.credentialRefId,
      credentialType: r.credentialType,
      status: r.status,
      vaultBackend: r.vaultBackend,
      expiresAt: r.expiresAt,
      lastVerifiedAt: r.lastVerifiedAt,
    }));
  const healthChecks = listConnectionHealthChecks(context)
    .filter((c) => c.providerId === providerId)
    .map((c) => ({
      healthCheckId: c.healthCheckId,
      checkType: c.checkType,
      status: c.status,
      severity: c.severity,
      message: c.message,
      lastCheckedAt: c.lastCheckedAt,
    }));

  const pillow = validateConnectionHealthPillowGovernance({
    ...DEFAULT_ACTOR,
    workspaceId,
    providerId,
    operation: "check",
    pillowGovernance: true,
  });

  const eklsEvents = [
    ...searchAuthorizationFrameworkEklsObservations({ workspaceId, providerId, pillowGovernance: true }),
    ...searchCredentialVaultEklsObservations({ workspaceId, providerId, pillowGovernance: true }),
    ...searchConnectionHealthEklsObservations({ workspaceId, providerId, pillowGovernance: true }),
    ...searchConnectionRegistryEklsObservations({ workspaceId, providerId, pillowGovernance: true }),
  ]
    .map((e) => ({
      referenceId: e.observationId,
      kind: e.kind,
      summary: e.summary,
      recordedAt: e.recordedAt,
      channel: "authorization-centre",
    }))
    .slice(0, 25);

  const brainActions: AuthorizationCentreAction[] = [
    "start_authorization",
    "submit_credential",
    "reconnect",
    "cancel_authorization",
    "run_health_check",
    "refresh_status",
    "view_requirements",
    "view_credential_references",
    "view_ekls_events",
  ];

  return {
    computedAt: new Date().toISOString(),
    workspaceId,
    providerId,
    providerName: provider.displayName,
    connectionSummary: {
      connectionId: `conn:${providerId}`,
      connectionStatus: card.connectionStatus,
      authorizationStatus: card.authorizationStatus,
      credentialStatus: card.credentialStatus,
      healthStatus: String(card.healthStatus),
      readinessStatus: card.readinessStatus,
      environment: card.environment,
      accountHolderId: card.accountHolderId,
      expiry: card.expiry,
      lastVerified: card.lastVerified,
    },
    requiredScopes,
    grantedScopes,
    missingScopes: requiredScopes.filter((s) => !grantedScopes.includes(s)),
    requiredPermissions,
    grantedPermissions,
    missingPermissions: requiredPermissions.filter((p) => !grantedPermissions.includes(p)),
    credentialReferences: credRefs,
    healthChecks,
    readinessResult: {
      readinessPercent: computeReadinessPercentage(context),
      overallStatus: getConnectionHealthSummary({ workspaceId, context }).overallStatus,
    },
    eklsEvents,
    brainActions,
    pillowGovernanceState: "pillow-governed",
    governanceChecks: {
      workspaceOwnership: pillow.workspaceOwnership,
      providerEligibility: pillow.providerEligibility,
      monitoringPermission: pillow.monitoringPermission,
      credentialVisibilityBoundary: pillow.credentialVisibilityBoundary,
    },
  };
}

export function loadAuthorizationCentreAttentionItems(workspaceId: string) {
  return getConnectionHealthAttentionItems({ workspaceId });
}

export function getAuthorizationCentreRequirements(providerId: string, workspaceId: string) {
  return getAuthorizationRequirements(providerId, { workspaceId });
}

export function getAuthorizationCentreStatus(authorizationId: string) {
  return getAuthorizationStatus(authorizationId);
}

export function resolveAuthorizationCentreMonitoringProfiles(workspaceId: string) {
  return resolveAllProviderMonitoringProfiles({ workspaceId });
}
