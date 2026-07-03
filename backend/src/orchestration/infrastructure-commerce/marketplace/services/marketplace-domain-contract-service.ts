/**
 * G2-02 — Marketplace domain contract builder from registry-backed adapter contracts.
 */

import type { CommerceMarketplaceRow } from "../../../../registry/types/commerce-registry-types.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type { MarketplaceDomainContractBundle } from "../contracts/marketplace-domain-contracts.js";
import type { MarketplaceFeatureFlag } from "../contracts/marketplace-integration-types.js";
import {
  buildMarketplaceAdapterContract,
  parseMarketplaceIntegrationConfiguration,
} from "../validation/marketplace-contract-validator.js";
import { resolvePolicyForMarketplace } from "../registry/marketplace-registry-resolver.js";

function featureSupported(
  features: MarketplaceFeatureFlag[],
  feature: MarketplaceFeatureFlag,
): boolean {
  return features.includes(feature);
}

export function buildMarketplaceDomainContractBundle(
  context: RegistryLoaderContext,
  marketplace: CommerceMarketplaceRow,
): MarketplaceDomainContractBundle {
  const contract = buildMarketplaceAdapterContract(marketplace);
  const integration = parseMarketplaceIntegrationConfiguration(marketplace.configuration);
  const policy = resolvePolicyForMarketplace(context, marketplace);

  return {
    authentication: {
      contractKind: "authentication",
      contractVersion: integration.domainContracts.authentication.contractVersion,
      authenticationMethod: contract.authenticationMethod,
      supportedProtocols: [contract.apiSpecification.protocol],
      credentialBindingRef: marketplace.providerRef ?? null,
      pillowGoverned: true,
    },
    catalogue: {
      contractKind: "catalogue",
      contractVersion: integration.domainContracts.catalogue.contractVersion,
      supportedFeatures: contract.supportedFeatures,
      syncMode: featureSupported(contract.supportedFeatures, "catalogue_sync") ? "hybrid" : "pull",
    },
    orders: {
      contractKind: "orders",
      contractVersion: integration.domainContracts.orders.contractVersion,
      supportedFeatures: contract.supportedFeatures,
      idempotencyRequired: policy?.enforcement === "blocking",
    },
    inventory: {
      contractKind: "inventory",
      contractVersion: integration.domainContracts.inventory.contractVersion,
      supportedFeatures: contract.supportedFeatures,
      reconciliationMode: featureSupported(contract.supportedFeatures, "inventory_sync")
        ? "hybrid"
        : "poll",
    },
    pricing: {
      contractKind: "pricing",
      contractVersion: integration.domainContracts.pricing.contractVersion,
      supportedFeatures: contract.supportedFeatures,
      currencyPolicyRef: policy?.id ?? null,
    },
    fulfillment: {
      contractKind: "fulfillment",
      contractVersion: integration.domainContracts.fulfillment.contractVersion,
      supportedFeatures: contract.supportedFeatures,
      handoffMode: marketplace.channelType === "hybrid" ? "plugin" : "marketplace_native",
    },
    status: {
      contractKind: "status",
      contractVersion: integration.domainContracts.status.contractVersion,
      supportedFeatures: contract.supportedFeatures,
      healthProbeSupported: featureSupported(contract.supportedFeatures, "health_probe"),
    },
  };
}
