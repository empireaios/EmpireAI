/**
 * G2-08 — Cross-engine coordination (no embedded engine logic).
 */

import type { CommerceEngineModule } from "../../../../registry/types/commerce-registry-types.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type {
  CommerceEngineCoordinationEnvelope,
  CommerceParticipatingComponent,
} from "../contracts/commerce-orchestration-types.js";
import { discoverCommerceOrchestrationProfiles } from "./commerce-orchestration-service.js";
import { parseCommerceOrchestrationConfiguration } from "../validation/commerce-orchestration-contract-validator.js";
import { getCommerceOrchestrationProfileById } from "../data/commerce-orchestration-profile-store.js";

const COMPONENT_ENGINE_MAP: Record<CommerceParticipatingComponent, string> = {
  marketplace: "marketplace-infrastructure-engine",
  supplier: "supplier-intelligence-engine",
  storefront: "storefront-assembly-engine",
  payment: "live-payment-engine",
  logistics: "logistics-engine",
  analytics: "analytics-intelligence-engine",
};

const COMPONENT_COORDINATION_MAP: Record<
  CommerceParticipatingComponent,
  CommerceEngineCoordinationEnvelope["coordinationCapability"]
> = {
  marketplace: "marketplace_coordination",
  supplier: "supplier_coordination",
  storefront: "storefront_coordination",
  payment: "payment_coordination",
  logistics: "logistics_coordination",
  analytics: "analytics_coordination",
};

const ADVERTISING_ENGINE: CommerceEngineModule = "advertising-intelligence-engine";

export function listCoordinatedCommerceEngines(): readonly string[] {
  return [...Object.values(COMPONENT_ENGINE_MAP), ADVERTISING_ENGINE, "business-automation"];
}

export function coordinateCommerceEngines(
  context: RegistryLoaderContext,
  profileId: string,
): CommerceEngineCoordinationEnvelope[] {
  const profile = getCommerceOrchestrationProfileById(profileId);
  if (!profile) return [];

  const integration = parseCommerceOrchestrationConfiguration(profile.configuration);
  const envelopes: CommerceEngineCoordinationEnvelope[] = [];

  for (const component of integration.participatingComponents) {
    if (!component.enabled) continue;
    envelopes.push({
      engineId: COMPONENT_ENGINE_MAP[component.component],
      profileId,
      component: component.component,
      registryRef: component.registryRef,
      coordinationCapability: COMPONENT_COORDINATION_MAP[component.component],
      logicEmbedded: false,
      discoverySource: "CommerceOrchestrationCatalog:engine-coordinator",
    });
  }

  return envelopes;
}

export function coordinateAllCommerceProfiles(
  context: RegistryLoaderContext,
): CommerceEngineCoordinationEnvelope[] {
  return discoverCommerceOrchestrationProfiles(context).profiles.flatMap((profile) =>
    coordinateCommerceEngines(context, profile.profileId),
  );
}

export function coordinateAdvertisingEngine(
  context: RegistryLoaderContext,
  profileId: string,
): CommerceEngineCoordinationEnvelope | undefined {
  const profile = getCommerceOrchestrationProfileById(profileId);
  if (!profile) return undefined;

  return {
    engineId: ADVERTISING_ENGINE,
    profileId,
    component: "marketplace",
    registryRef: {
      registryId: "REG-COMMERCE-POLICY",
      registryRowId: profile.policyRef ?? "pol-foundation-commerce-default",
    },
    coordinationCapability: "workflow_coordination",
    logicEmbedded: false,
    discoverySource: "CommerceOrchestrationCatalog:engine-coordinator",
  };
}
