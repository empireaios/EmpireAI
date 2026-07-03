/**
 * G2-04 — Storefront domain contract definitions (framework contracts only).
 */

import type {
  StorefrontAuthenticationMethod,
  StorefrontChannelModel,
  StorefrontCollectionCapability,
  StorefrontContentCapability,
  StorefrontDomainCapability,
  StorefrontPublishingCapability,
  StorefrontThemeCapability,
} from "./storefront-integration-types.js";

export type StorefrontProvisioningContract = {
  contractKind: "provisioning";
  contractVersion: string;
  channelModel: StorefrontChannelModel;
  deploymentRef: string | null;
  pillowGoverned: true;
};

export type StorefrontBrandAssignmentContract = {
  contractKind: "brand_assignment";
  contractVersion: string;
  brandRef: string | null;
  workspaceScoped: true;
};

export type StorefrontThemeAssignmentContract = {
  contractKind: "theme_assignment";
  contractVersion: string;
  themeCapabilities: StorefrontThemeCapability[];
};

export type StorefrontProductPublishingContract = {
  contractKind: "product_publishing";
  contractVersion: string;
  publishingCapabilities: StorefrontPublishingCapability[];
  publishingAuthorityRequired: true;
};

export type StorefrontCollectionManagementContract = {
  contractKind: "collection_management";
  contractVersion: string;
  collectionCapabilities: StorefrontCollectionCapability[];
};

export type StorefrontNavigationManagementContract = {
  contractKind: "navigation_management";
  contractVersion: string;
  publishingCapabilities: StorefrontPublishingCapability[];
};

export type StorefrontContentSynchronisationContract = {
  contractKind: "content_synchronisation";
  contractVersion: string;
  contentCapabilities: StorefrontContentCapability[];
  syncMode: "push" | "pull" | "hybrid";
};

export type StorefrontDomainContractBundle = {
  provisioning: StorefrontProvisioningContract;
  brandAssignment: StorefrontBrandAssignmentContract;
  themeAssignment: StorefrontThemeAssignmentContract;
  productPublishing: StorefrontProductPublishingContract;
  collectionManagement: StorefrontCollectionManagementContract;
  navigationManagement: StorefrontNavigationManagementContract;
  contentSynchronisation: StorefrontContentSynchronisationContract;
};

export const STOREFRONT_DOMAIN_CONTRACT_KINDS: StorefrontDomainCapability[] = [
  "provisioning",
  "brand_assignment",
  "theme_assignment",
  "product_publishing",
  "collection_management",
  "navigation_management",
  "content_synchronisation",
];

export function listStorefrontDomainContractKinds(): readonly StorefrontDomainCapability[] {
  return STOREFRONT_DOMAIN_CONTRACT_KINDS;
}

export type StorefrontAuthenticationContract = {
  contractKind: "authentication";
  authenticationMethod: StorefrontAuthenticationMethod;
  pillowGoverned: true;
};
