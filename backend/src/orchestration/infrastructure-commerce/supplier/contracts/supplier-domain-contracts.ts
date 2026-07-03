/**
 * G2-03 — Supplier domain contract definitions (framework contracts only).
 */

import type {
  SupplierApiProtocol,
  SupplierAuthenticationMethod,
  SupplierDomainCapability,
  SupplierFeatureFlag,
  SupplierFulfilmentMode,
  SupplierInventoryFeature,
  SupplierTrackingFeature,
} from "./supplier-integration-types.js";

export type SupplierAuthenticationContract = {
  contractKind: "authentication";
  contractVersion: string;
  authenticationMethod: SupplierAuthenticationMethod;
  supportedProtocols: SupplierApiProtocol[];
  credentialBindingRef: string | null;
  pillowGoverned: true;
};

export type SupplierCatalogueContract = {
  contractKind: "catalogue";
  contractVersion: string;
  supportedFeatures: SupplierFeatureFlag[];
  syncMode: "pull" | "push" | "hybrid";
};

export type SupplierInventoryContract = {
  contractKind: "inventory";
  contractVersion: string;
  supportedFeatures: SupplierFeatureFlag[];
  inventoryFeatures: SupplierInventoryFeature[];
  reconciliationMode: "event" | "poll" | "hybrid";
};

export type SupplierPricingContract = {
  contractKind: "pricing";
  contractVersion: string;
  supportedFeatures: SupplierFeatureFlag[];
  currencyPolicyRef: string | null;
};

export type SupplierOrderContract = {
  contractKind: "orders";
  contractVersion: string;
  supportedFeatures: SupplierFeatureFlag[];
  idempotencyRequired: boolean;
};

export type SupplierFulfillmentContract = {
  contractKind: "fulfillment";
  contractVersion: string;
  supportedFeatures: SupplierFeatureFlag[];
  fulfilmentModes: SupplierFulfilmentMode[];
};

export type SupplierTrackingContract = {
  contractKind: "tracking";
  contractVersion: string;
  supportedFeatures: SupplierFeatureFlag[];
  trackingFeatures: SupplierTrackingFeature[];
  healthProbeSupported: boolean;
};

export type SupplierDomainContractBundle = {
  authentication: SupplierAuthenticationContract;
  catalogue: SupplierCatalogueContract;
  inventory: SupplierInventoryContract;
  pricing: SupplierPricingContract;
  orders: SupplierOrderContract;
  fulfillment: SupplierFulfillmentContract;
  tracking: SupplierTrackingContract;
};

export const SUPPLIER_DOMAIN_CONTRACT_KINDS: SupplierDomainCapability[] = [
  "authentication",
  "catalogue",
  "inventory",
  "pricing",
  "orders",
  "fulfillment",
  "tracking",
];

export function listSupplierDomainContractKinds(): readonly SupplierDomainCapability[] {
  return SUPPLIER_DOMAIN_CONTRACT_KINDS;
}
