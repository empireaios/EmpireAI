/**
 * G8-00 — Identity & Authorization Platform service.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type {
  IdentityHealthSummary,
  IdentityPlatformOverview,
  IdentityPlatformSummary,
  ProviderConnectionState,
} from "../contracts/identity-authorization-types.js";
import { IDENTITY_AUTHORIZATION_PLATFORM_VERSION } from "../contracts/identity-authorization-types.js";
import { recordIdentityAuthorizationEklsObservation } from "../ekls/identity-authorization-ekls-integration.js";
import { validateIdentityAuthorizationPillowGovernance } from "../governance/identity-authorization-pillow-governance.js";
import {
  computeReadinessPercentage,
  listIdentityPlatformRegistryIds,
  resolveAuthorizationProviders,
  resolveIdentityPlatformDependencies,
  resolveProviderConnectionStates,
} from "../registry/identity-authorization-registry-resolver.js";
import { bootstrapIdentityPlatform } from "./platform-bootstrap.js";
import { getIdentityPlatformHealthProbe } from "./identity-health-registration.js";

let initialized = false;
let lastWorkspaceId: string | undefined;

export function resetIdentityAuthorizationStateForTests(): void {
  initialized = false;
  lastWorkspaceId = undefined;
}

function requireGovernance(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  providerId?: string;
  operation: "overview" | "load" | "configure";
}) {
  const governance = validateIdentityAuthorizationPillowGovernance({
    ...input,
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    throw new Error(governance.reason);
  }
}

export function loadIdentityPlatform(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  context?: RegistryLoaderContext;
  pillowGovernance: true;
}) {
  const context = input.context ?? { workspaceId: input.workspaceId };

  if (initialized && lastWorkspaceId === input.workspaceId) {
    return {
      overview: getIdentityPlatformOverview(context),
      bootstrap: {
        initialized: true,
        registryCount: listIdentityPlatformRegistryIds().length,
        providerCount: resolveAuthorizationProviders(context).length,
      },
    };
  }

  const bootstrap = bootstrapIdentityPlatform({
    actorId: input.actorId,
    ownerId: input.ownerId,
    workspaceId: input.workspaceId,
    context,
    pillowGovernance: true,
  });

  initialized = true;
  lastWorkspaceId = input.workspaceId;

  return {
    overview: getIdentityPlatformOverview(context),
    bootstrap,
  };
}

export function getIdentityPlatformOverview(context: RegistryLoaderContext = {}): IdentityPlatformOverview {
  const deps = resolveIdentityPlatformDependencies(context);
  const workspaceId = context.workspaceId ?? "ws_empire_1";
  return {
    frameworkVersion: IDENTITY_AUTHORIZATION_PLATFORM_VERSION,
    initialized,
    registryCount: listIdentityPlatformRegistryIds().length,
    providerCount: deps.authorizationProviders.length,
    programmeStatus: "identity-authorization-platform-foundation-established",
    workspaceId,
    generatedAt: new Date().toISOString(),
  };
}

export function getIdentityPlatformSummary(context: RegistryLoaderContext = {}): IdentityPlatformSummary {
  const connections = resolveProviderConnectionStates(context);
  const authorizedCount = connections.filter((c) => c.connectionState === "authorized").length;
  const disconnectedCount = connections.filter((c) => c.connectionState === "disconnected").length;
  const readinessPercentage = computeReadinessPercentage(context);
  const providerCount = resolveAuthorizationProviders(context).length;
  const workspaceId = context.workspaceId ?? "ws_empire_1";

  return {
    frameworkVersion: IDENTITY_AUTHORIZATION_PLATFORM_VERSION,
    providerCount,
    connectionCount: connections.length,
    authorizedCount,
    disconnectedCount,
    readinessPercentage,
    executiveSummary: `Identity platform foundation: ${providerCount} providers, ${connections.length} connections, ${readinessPercentage}% readiness`,
    workspaceId,
    generatedAt: new Date().toISOString(),
  };
}

export function getIdentityHealth(context: RegistryLoaderContext = {}): IdentityHealthSummary {
  const connections = resolveProviderConnectionStates(context);
  const configuredCount = connections.filter(
    (c) => c.connectionState === "configured" || c.connectionState === "authorized",
  ).length;
  const issues: string[] = [];
  const disconnected = connections.filter((c) => c.connectionState === "disconnected");
  if (disconnected.length > 0) {
    issues.push(`${disconnected.length} provider(s) disconnected`);
  }
  const expired = connections.filter((c) => c.connectionState === "expired");
  if (expired.length > 0) {
    issues.push(`${expired.length} provider(s) expired`);
  }
  const probe = getIdentityPlatformHealthProbe();
  if (!probe) {
    issues.push("Health probe not registered");
  }
  const score =
    connections.length === 0 ? 0 : Math.round((configuredCount / connections.length) * 100);

  return {
    healthy: issues.length === 0 && initialized,
    score,
    providerCount: connections.length,
    configuredCount,
    issues,
    computedAt: new Date().toISOString(),
  };
}

export function listIdentityProviders(context: RegistryLoaderContext = {}) {
  return resolveAuthorizationProviders(context).map((provider) => ({
    providerId: provider.providerId,
    providerName: provider.providerName,
    providerKind: provider.providerKind,
    configurable: provider.configurable,
    oauthCapable: provider.oauthCapable,
    credentialCapable: provider.credentialCapable,
  }));
}

export function getIdentityProviderDetail(providerId: string, context: RegistryLoaderContext = {}) {
  const provider = resolveAuthorizationProviders(context).find((p) => p.providerId === providerId);
  if (!provider) {
    return undefined;
  }
  const connection = resolveProviderConnectionStates(context).find((c) => c.providerId === providerId);
  return {
    ...provider,
    connectionState: connection?.connectionState ?? "unknown",
    ruleReference: connection?.ruleReference,
  };
}

export function getConnectionStatus(context: RegistryLoaderContext = {}): ProviderConnectionState[] {
  return resolveProviderConnectionStates(context);
}

export function getOverallReadiness(context: RegistryLoaderContext = {}) {
  const readinessPercentage = computeReadinessPercentage(context);
  const connections = resolveProviderConnectionStates(context);
  return {
    readinessPercentage,
    connectionCount: connections.length,
    readyCount: connections.filter(
      (c) => c.connectionState === "authorized" || c.connectionState === "configured",
    ).length,
    programmeStatus: "identity-authorization-platform-foundation-established",
    computedAt: new Date().toISOString(),
  };
}

export function recordIdentityExecutiveAction(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  providerId?: string;
  summary: string;
  pillowGovernance: true;
}) {
  requireGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    providerId: input.providerId,
    operation: "configure",
  });
  return recordIdentityAuthorizationEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    providerId: input.providerId,
    kind: "executive_action",
    summary: input.summary,
    pillowGovernance: true,
  });
}
