/**
 * G8-01 — Connection Registry service.
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import { CONNECTION_REGISTRY_FOUNDATION_VERSION } from "../contracts/connection-registry-types.js";
import { recordConnectionRegistryEklsObservation } from "../ekls/connection-registry-ekls-integration.js";
import { validateConnectionRegistryPillowGovernance } from "../governance/connection-registry-pillow-governance.js";
import {
  resolveAllConnectionProviders,
  resolveConnectionDependencies,
  resolveConnectionProvider,
  resolveConnectionRequirements,
  resolveProviderCapabilities,
  resolveWorkspaceConnectionProfile,
} from "../registry/connection-registry-resolver.js";

let initialized = false;

export function resetConnectionRegistryStateForTests(): void {
  initialized = false;
}

function requireGovernance(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  providerId?: string;
  accountHolderId?: string;
}) {
  const governance = validateConnectionRegistryPillowGovernance({
    ...input,
    operation: "resolve",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    throw new Error(governance.reason);
  }
}

export function initializeConnectionRegistry(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  context?: RegistryLoaderContext;
  pillowGovernance: true;
}) {
  const context = input.context ?? { workspaceId: input.workspaceId };
  requireGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
  });

  const providers = resolveAllConnectionProviders(context);
  for (const provider of providers.slice(0, 5)) {
    recordConnectionRegistryEklsObservation({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId,
      providerId: provider.providerId,
      kind: "connection_provider_registered",
      summary: `Connection provider ${provider.displayName} registered from registry`,
      pillowGovernance: true,
    });
  }

  const requirements = resolveConnectionRequirements(context);
  recordConnectionRegistryEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    kind: "connection_requirement_defined",
    summary: `${requirements.length} connection requirements resolved from registry`,
    pillowGovernance: true,
  });

  const capabilities = resolveProviderCapabilities(context);
  recordConnectionRegistryEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    kind: "connection_capability_defined",
    summary: `${capabilities.length} connection capabilities resolved from registry`,
    pillowGovernance: true,
  });

  initialized = true;
  return {
    frameworkVersion: CONNECTION_REGISTRY_FOUNDATION_VERSION,
    providerCount: providers.length,
    requirementCount: requirements.length,
    capabilityCount: capabilities.length,
    initialized: true,
  };
}

export function getConnectionRegistryList(context: RegistryLoaderContext = {}) {
  return resolveAllConnectionProviders(context).map((provider) => ({
    providerId: provider.providerId,
    displayName: provider.displayName,
    providerCategory: provider.providerCategory,
    status: provider.status,
    version: provider.version,
    registrySource: provider.registrySource,
    supportsOAuth: provider.supportsOAuth,
    supportsApiKey: provider.supportsApiKey,
    requiresAccountHolder: provider.requiresAccountHolder,
  }));
}

export function getConnectionProviderDetail(providerId: string, context: RegistryLoaderContext = {}) {
  return resolveConnectionProvider(providerId, context);
}

export function getConnectionRequirements(context: RegistryLoaderContext = {}) {
  return resolveConnectionRequirements(context);
}

export function getConnectionCapabilities(context: RegistryLoaderContext = {}) {
  return resolveProviderCapabilities(context);
}

export function getConnectionDependencies(context: RegistryLoaderContext = {}) {
  return resolveConnectionDependencies(context);
}

export function getWorkspaceConnectionProfile(
  input: { workspaceId: string; accountHolderId?: string; actorId: string; ownerId: string },
  context: RegistryLoaderContext = {},
) {
  requireGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
  });
  const profile = resolveWorkspaceConnectionProfile(
    { workspaceId: input.workspaceId, accountHolderId: input.accountHolderId },
    context,
  );
  recordConnectionRegistryEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    kind: "connection_profile_resolved",
    summary: `Workspace connection profile resolved for ${input.workspaceId}`,
    pillowGovernance: true,
  });
  return profile;
}

export function isConnectionRegistryInitialized(): boolean {
  return initialized;
}
