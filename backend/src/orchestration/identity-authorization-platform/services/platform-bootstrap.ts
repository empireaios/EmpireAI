/**
 * G8-00 — Identity platform bootstrap.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { IDENTITY_PLATFORM_CANONICAL_REGISTRY_IDS } from "../../../registry/types/registry-ids.js";
import { getRegistryLoader } from "../../../registry/registry-loader.js";
import { createIdentityAuthorizationModuleContract } from "../contract/identity-authorization-module.js";
import { createCockpitIdentityAuthorizationRouteRegistration } from "../contracts/identity-authorization-cockpit-contracts.js";
import { recordIdentityAuthorizationEklsObservation } from "../ekls/identity-authorization-ekls-integration.js";
import { validateIdentityAuthorizationPillowGovernance } from "../governance/identity-authorization-pillow-governance.js";
import { registerIdentityPlatformHealthProbe } from "./identity-health-registration.js";
import {
  listIdentityPlatformRegistryIds,
  resolveIdentityPlatformDependencies,
} from "../registry/identity-authorization-registry-resolver.js";

export type IdentityPlatformBootstrapResult = {
  initialized: boolean;
  moduleContract: ReturnType<typeof createIdentityAuthorizationModuleContract>;
  cockpitRegistration: ReturnType<typeof createCockpitIdentityAuthorizationRouteRegistration>;
  registryCount: number;
  registryIds: string[];
  providerCount: number;
  healthRegistered: boolean;
};

export function bootstrapIdentityPlatform(input: {
  actorId: string;
  ownerId: string;
  workspaceId: string;
  context?: RegistryLoaderContext;
  pillowGovernance: true;
}): IdentityPlatformBootstrapResult {
  const context = input.context ?? { workspaceId: input.workspaceId };

  const governance = validateIdentityAuthorizationPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "load",
    pillowGovernance: true,
  });
  if (!governance.allowed) {
    throw new Error(governance.reason);
  }

  const loader = getRegistryLoader();
  for (const registryId of IDENTITY_PLATFORM_CANONICAL_REGISTRY_IDS) {
    loader.resolve(context, registryId);
  }

  const deps = resolveIdentityPlatformDependencies(context);
  const moduleContract = createIdentityAuthorizationModuleContract();
  const cockpitRegistration = createCockpitIdentityAuthorizationRouteRegistration();
  const healthRegistered = registerIdentityPlatformHealthProbe({
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    ownerId: input.ownerId,
    pillowGovernance: true,
  }).registered;

  recordIdentityAuthorizationEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    kind: "authorization",
    summary: "Identity & Authorization Platform foundation bootstrapped from registry",
    pillowGovernance: true,
  });

  recordIdentityAuthorizationEklsObservation({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    kind: "connection",
    summary: `Foundation providers resolved: ${deps.authorizationProviders.length} authorization providers`,
    pillowGovernance: true,
  });

  return {
    initialized: true,
    moduleContract,
    cockpitRegistration,
    registryCount: listIdentityPlatformRegistryIds().length,
    registryIds: listIdentityPlatformRegistryIds(),
    providerCount: deps.authorizationProviders.length,
    healthRegistered,
  };
}
