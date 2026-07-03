/**
 * G2-04 — Storefront capability resolution from registry-backed contracts.
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  STOREFRONT_DOMAIN_CAPABILITIES,
  STOREFRONT_INTEGRATION_LIFECYCLE,
  type StorefrontCapabilityResolution,
  type StorefrontDomainCapability,
  type StorefrontIntegrationLifecyclePhase,
  type StorefrontPublishingCapability,
} from "../contracts/storefront-integration-types.js";
import { parseStorefrontIntegrationConfiguration } from "../validation/storefront-contract-validator.js";
import {
  resolvePolicyForStorefront,
  resolveStorefrontRegistrySnapshot,
} from "./storefront-registry-resolver.js";

function resolveDomainCapabilities(
  configuration: ReturnType<typeof parseStorefrontIntegrationConfiguration>,
): StorefrontDomainCapability[] {
  return STOREFRONT_DOMAIN_CAPABILITIES.filter(
    (domain) => configuration.domainContracts[domain]?.supported === true,
  );
}

function isPolicyCompliant(
  context: RegistryLoaderContext,
  storefront: Parameters<typeof resolvePolicyForStorefront>[1],
): boolean {
  const policy = resolvePolicyForStorefront(context, storefront);
  if (!policy) {
    return storefront.dependencies.length === 0;
  }
  return policy.status === "VALIDATED" || policy.status === "PUBLISHED";
}

export function resolveStorefrontCapabilities(
  context: RegistryLoaderContext,
  storefrontId: string,
  lifecyclePhase: StorefrontIntegrationLifecyclePhase = "discover",
): StorefrontCapabilityResolution {
  const snapshot = resolveStorefrontRegistrySnapshot(context, { registryRowId: storefrontId });
  const storefront = snapshot.storefronts[0];
  if (!storefront) {
    throw new Error(`Unknown storefront registry row: ${storefrontId}`);
  }

  const integration = parseStorefrontIntegrationConfiguration(storefront.configuration);

  return {
    storefrontId: storefront.id,
    resolvedCapabilities: resolveDomainCapabilities(integration),
    publishingCapabilities: integration.publishingCapabilities as StorefrontPublishingCapability[],
    lifecyclePhase,
    policyCompliant: isPolicyCompliant(context, storefront),
    registryBacked: true,
  };
}

export function resolveAllStorefrontCapabilities(
  context: RegistryLoaderContext,
  lifecyclePhase: StorefrontIntegrationLifecyclePhase = "discover",
): StorefrontCapabilityResolution[] {
  const snapshot = resolveStorefrontRegistrySnapshot(context);
  return snapshot.storefronts.map((storefront) =>
    resolveStorefrontCapabilities(context, storefront.id, lifecyclePhase),
  );
}

export function listSupportedStorefrontLifecyclePhases(): readonly StorefrontIntegrationLifecyclePhase[] {
  return STOREFRONT_INTEGRATION_LIFECYCLE;
}
