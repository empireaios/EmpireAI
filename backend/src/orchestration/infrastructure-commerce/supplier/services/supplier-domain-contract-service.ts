/**
 * G2-03 — Supplier domain contract builder from registry-backed adapter contracts.
 */

import type { CommerceSupplierRow } from "../../../../registry/types/commerce-registry-types.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type { SupplierDomainContractBundle } from "../contracts/supplier-domain-contracts.js";
import type { SupplierFeatureFlag } from "../contracts/supplier-integration-types.js";
import {
  buildSupplierAdapterContract,
  parseSupplierIntegrationConfiguration,
  resolveProductSourceRefsForSupplier,
} from "../validation/supplier-contract-validator.js";
import {
  resolvePolicyForSupplier,
  resolveSupplierRegistrySnapshot,
} from "../registry/supplier-registry-resolver.js";

function featureSupported(features: SupplierFeatureFlag[], feature: SupplierFeatureFlag): boolean {
  return features.includes(feature);
}

export function buildSupplierDomainContractBundle(
  context: RegistryLoaderContext,
  supplier: CommerceSupplierRow,
): SupplierDomainContractBundle {
  const snapshot = resolveSupplierRegistrySnapshot(context);
  const productSourceRefs = resolveProductSourceRefsForSupplier(
    supplier.id,
    snapshot.productSources,
  );
  const contract = buildSupplierAdapterContract(supplier, productSourceRefs);
  const integration = parseSupplierIntegrationConfiguration(supplier.configuration);
  const policy = resolvePolicyForSupplier(context, supplier);

  return {
    authentication: {
      contractKind: "authentication",
      contractVersion: integration.domainContracts.authentication.contractVersion,
      authenticationMethod: contract.authenticationMethod,
      supportedProtocols: [contract.apiSpecification.protocol],
      credentialBindingRef: supplier.providerRef ?? null,
      pillowGoverned: true,
    },
    catalogue: {
      contractKind: "catalogue",
      contractVersion: integration.domainContracts.catalogue.contractVersion,
      supportedFeatures: contract.supportedFeatures,
      syncMode: featureSupported(contract.supportedFeatures, "catalogue_sync") ? "hybrid" : "pull",
    },
    inventory: {
      contractKind: "inventory",
      contractVersion: integration.domainContracts.inventory.contractVersion,
      supportedFeatures: contract.supportedFeatures,
      inventoryFeatures: contract.inventoryFeatures,
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
    orders: {
      contractKind: "orders",
      contractVersion: integration.domainContracts.orders.contractVersion,
      supportedFeatures: contract.supportedFeatures,
      idempotencyRequired: policy?.enforcement === "blocking",
    },
    fulfillment: {
      contractKind: "fulfillment",
      contractVersion: integration.domainContracts.fulfillment.contractVersion,
      supportedFeatures: contract.supportedFeatures,
      fulfilmentModes: contract.fulfilmentModes,
    },
    tracking: {
      contractKind: "tracking",
      contractVersion: integration.domainContracts.tracking.contractVersion,
      supportedFeatures: contract.supportedFeatures,
      trackingFeatures: contract.trackingFeatures,
      healthProbeSupported: featureSupported(contract.supportedFeatures, "health_probe"),
    },
  };
}
