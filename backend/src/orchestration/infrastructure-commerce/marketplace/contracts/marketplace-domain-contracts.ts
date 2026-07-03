/**
 * G2-02 — Marketplace domain contract definitions (framework contracts only).
 */

import type {
  MarketplaceApiProtocol,
  MarketplaceAuthenticationMethod,
  MarketplaceDomainCapability,
  MarketplaceFeatureFlag,
} from "./marketplace-integration-types.js";

export type MarketplaceAuthenticationContract = {
  contractKind: "authentication";
  contractVersion: string;
  authenticationMethod: MarketplaceAuthenticationMethod;
  supportedProtocols: MarketplaceApiProtocol[];
  credentialBindingRef: string | null;
  pillowGoverned: true;
};

export type MarketplaceCatalogueContract = {
  contractKind: "catalogue";
  contractVersion: string;
  supportedFeatures: MarketplaceFeatureFlag[];
  syncMode: "pull" | "push" | "hybrid";
};

export type MarketplaceOrderContract = {
  contractKind: "orders";
  contractVersion: string;
  supportedFeatures: MarketplaceFeatureFlag[];
  idempotencyRequired: boolean;
};

export type MarketplaceInventoryContract = {
  contractKind: "inventory";
  contractVersion: string;
  supportedFeatures: MarketplaceFeatureFlag[];
  reconciliationMode: "event" | "poll" | "hybrid";
};

export type MarketplacePricingContract = {
  contractKind: "pricing";
  contractVersion: string;
  supportedFeatures: MarketplaceFeatureFlag[];
  currencyPolicyRef: string | null;
};

export type MarketplaceFulfillmentContract = {
  contractKind: "fulfillment";
  contractVersion: string;
  supportedFeatures: MarketplaceFeatureFlag[];
  handoffMode: "marketplace_native" | "supplier" | "3pl" | "plugin";
};

export type MarketplaceStatusContract = {
  contractKind: "status";
  contractVersion: string;
  supportedFeatures: MarketplaceFeatureFlag[];
  healthProbeSupported: boolean;
};

export type MarketplaceDomainContractBundle = {
  authentication: MarketplaceAuthenticationContract;
  catalogue: MarketplaceCatalogueContract;
  orders: MarketplaceOrderContract;
  inventory: MarketplaceInventoryContract;
  pricing: MarketplacePricingContract;
  fulfillment: MarketplaceFulfillmentContract;
  status: MarketplaceStatusContract;
};

export const MARKETPLACE_DOMAIN_CONTRACT_KINDS: MarketplaceDomainCapability[] = [
  "authentication",
  "catalogue",
  "orders",
  "inventory",
  "pricing",
  "fulfillment",
  "status",
];

export function listMarketplaceDomainContractKinds(): readonly MarketplaceDomainCapability[] {
  return MARKETPLACE_DOMAIN_CONTRACT_KINDS;
}
