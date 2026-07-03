/**
 * G2-08 — Brain commerce orchestration bridge (never bypasses Brain).
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  COMMERCE_COORDINATION_CAPABILITIES,
  type CommerceBrainOrchestrationDescriptor,
} from "../contracts/commerce-orchestration-types.js";
import { discoverCommerceOrchestrationProfiles } from "./commerce-orchestration-service.js";
import { resolveAllCommerceCoordinationCapabilities } from "../registry/commerce-orchestration-capability-resolver.js";

export function discoverCommerceOrchestrationForBrain(
  context: RegistryLoaderContext,
): CommerceBrainOrchestrationDescriptor[] {
  const discovery = discoverCommerceOrchestrationProfiles(context);
  const capabilityMap = new Map(
    resolveAllCommerceCoordinationCapabilities(context).map((entry) => [entry.profileId, entry]),
  );

  return discovery.profiles.map((profile) => {
    const resolved = capabilityMap.get(profile.profileId);
    return {
      profileId: profile.profileId,
      capabilities: profile.capabilities,
      coordinationCapabilities: resolved?.resolvedCapabilities ?? [],
      participatingComponents: resolved?.participatingComponents ?? [],
      discoverySource: "CommerceOrchestrationCatalog:registry-backed" as const,
      brainRouted: true as const,
    };
  });
}

export function listCommerceBrainCoordinationCapabilities(): readonly string[] {
  return COMMERCE_COORDINATION_CAPABILITIES;
}
