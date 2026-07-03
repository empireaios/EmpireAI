/**
 * G2-02 — Marketplace capability resolution from registry-backed contracts.
 */

import type { CommerceMarketplaceRow } from "../../../../registry/types/commerce-registry-types.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  MARKETPLACE_DOMAIN_CAPABILITIES,
  MARKETPLACE_INTEGRATION_LIFECYCLE,
  type MarketplaceCapabilityResolution,
  type MarketplaceDomainCapability,
  type MarketplaceFeatureFlag,
  type MarketplaceIntegrationLifecyclePhase,
} from "../contracts/marketplace-integration-types.js";
import {
  buildMarketplaceAdapterContract,
  parseMarketplaceIntegrationConfiguration,
} from "../validation/marketplace-contract-validator.js";
import {
  resolveMarketplaceRegistrySnapshot,
  resolvePolicyForMarketplace,
} from "./marketplace-registry-resolver.js";

function resolveDomainCapabilities(
  configuration: ReturnType<typeof parseMarketplaceIntegrationConfiguration>,
): MarketplaceDomainCapability[] {
  return MARKETPLACE_DOMAIN_CAPABILITIES.filter(
    (domain) => configuration.domainContracts[domain]?.supported === true,
  );
}

function isPolicyCompliant(
  context: RegistryLoaderContext,
  marketplace: CommerceMarketplaceRow,
): boolean {
  const policy = resolvePolicyForMarketplace(context, marketplace);
  if (!policy) {
    return marketplace.dependencies.length === 0;
  }
  return policy.status === "VALIDATED" || policy.status === "PUBLISHED";
}

export function resolveMarketplaceCapabilities(
  context: RegistryLoaderContext,
  marketplaceId: string,
  lifecyclePhase: MarketplaceIntegrationLifecyclePhase = "discover",
): MarketplaceCapabilityResolution {
  const snapshot = resolveMarketplaceRegistrySnapshot(context, { registryRowId: marketplaceId });
  const marketplace = snapshot.marketplaces[0];
  if (!marketplace) {
    throw new Error(`Unknown marketplace registry row: ${marketplaceId}`);
  }

  const integration = parseMarketplaceIntegrationConfiguration(marketplace.configuration);
  const contract = buildMarketplaceAdapterContract(marketplace);

  return {
    marketplaceId: contract.marketplaceId,
    resolvedCapabilities: resolveDomainCapabilities(integration),
    supportedFeatures: contract.supportedFeatures as MarketplaceFeatureFlag[],
    lifecyclePhase,
    policyCompliant: isPolicyCompliant(context, marketplace),
    registryBacked: true,
  };
}

export function resolveAllMarketplaceCapabilities(
  context: RegistryLoaderContext = {},
  lifecyclePhase: MarketplaceIntegrationLifecyclePhase = "discover",
): MarketplaceCapabilityResolution[] {
  const snapshot = resolveMarketplaceRegistrySnapshot(context);
  return snapshot.marketplaces.map((marketplace) =>
    resolveMarketplaceCapabilities(context, marketplace.id, lifecyclePhase),
  );
}

export function listSupportedMarketplaceLifecyclePhases(): readonly MarketplaceIntegrationLifecyclePhase[] {
  return MARKETPLACE_INTEGRATION_LIFECYCLE;
}
