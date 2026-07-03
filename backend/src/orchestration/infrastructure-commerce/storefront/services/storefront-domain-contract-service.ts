/**
 * G2-04 — Storefront domain contract builder from registry-backed adapter contracts.
 */

import type { CommerceStorefrontRow } from "../../../../registry/types/commerce-registry-types.js";
import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import type { StorefrontDomainContractBundle } from "../contracts/storefront-domain-contracts.js";
import {
  buildStorefrontAdapterContract,
  parseStorefrontIntegrationConfiguration,
} from "../validation/storefront-contract-validator.js";
import {
  resolveBrandForStorefront,
  resolveCategoryForStorefront,
  resolvePolicyForStorefront,
} from "../registry/storefront-registry-resolver.js";

export function buildStorefrontDomainContractBundle(
  context: RegistryLoaderContext,
  storefront: CommerceStorefrontRow,
): StorefrontDomainContractBundle {
  const contract = buildStorefrontAdapterContract(storefront);
  const integration = parseStorefrontIntegrationConfiguration(storefront.configuration);
  const policy = resolvePolicyForStorefront(context, storefront);
  const brand = resolveBrandForStorefront(context, integration.brandRef);
  const category = resolveCategoryForStorefront(context, integration.categoryRef);

  return {
    provisioning: {
      contractKind: "provisioning",
      contractVersion: integration.domainContracts.provisioning.contractVersion,
      channelModel: integration.channelModel,
      deploymentRef: storefront.deploymentRef ?? null,
      pillowGoverned: true,
    },
    brandAssignment: {
      contractKind: "brand_assignment",
      contractVersion: integration.domainContracts.brand_assignment.contractVersion,
      brandRef: brand?.id ?? integration.brandRef ?? null,
      workspaceScoped: true,
    },
    themeAssignment: {
      contractKind: "theme_assignment",
      contractVersion: integration.domainContracts.theme_assignment.contractVersion,
      themeCapabilities: contract.themeCapabilities,
    },
    productPublishing: {
      contractKind: "product_publishing",
      contractVersion: integration.domainContracts.product_publishing.contractVersion,
      publishingCapabilities: contract.publishingCapabilities,
      publishingAuthorityRequired: true,
    },
    collectionManagement: {
      contractKind: "collection_management",
      contractVersion: integration.domainContracts.collection_management.contractVersion,
      collectionCapabilities: contract.collectionCapabilities,
    },
    navigationManagement: {
      contractKind: "navigation_management",
      contractVersion: integration.domainContracts.navigation_management.contractVersion,
      publishingCapabilities: contract.publishingCapabilities.filter((cap) =>
        cap.includes("navigation"),
      ),
    },
    contentSynchronisation: {
      contractKind: "content_synchronisation",
      contractVersion: integration.domainContracts.content_synchronisation.contractVersion,
      contentCapabilities: contract.contentCapabilities,
      syncMode: contract.contentCapabilities.includes("content_sync") ? "hybrid" : "pull",
    },
  };
}
