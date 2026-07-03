/**
 * Canonical Marketplace / Channel Registry — deployment configuration.
 * ADR-052 · V1_MARKETPLACE_CHANNEL_REGISTRY.md
 *
 * V1 channel identities live here as registry rows, not inside Intelligence Engine logic.
 * Future marketplaces append profiles — engines discover them at runtime.
 */

export type MarketplaceChannelType = "marketplace" | "storefront" | "supplier";

export type MarketplaceV1Role =
  | "mandatory_live"
  | "mandatory_architecture"
  | "expansion";

export type MarketplaceLaunchReadiness =
  | "architecture_only"
  | "configured"
  | "verified"
  | "live";

export type MarketplaceChannelProfile = {
  registryId: string;
  displayName: string;
  countryCode: string;
  channelType: MarketplaceChannelType;
  platformFamily: string;
  v1Role: MarketplaceV1Role | null;
  launchReadiness: MarketplaceLaunchReadiness;
  connectorRef: string | null;
  /** Link to global-commerce-registry provider row when present. */
  globalCommerceProviderId: string | null;
  notes: string;
};

/**
 * Version 1 deployment registrations — governance source mirrored in runtime config.
 * Adding Lazada, TikTok Shop, etc. means inserting a row here (+ global-commerce row).
 */
export const MARKETPLACE_CHANNEL_DEPLOYMENT_PROFILES: readonly MarketplaceChannelProfile[] = [
  {
    registryId: "amazon-us",
    displayName: "Amazon US",
    countryCode: "US",
    channelType: "marketplace",
    platformFamily: "amazon",
    v1Role: "mandatory_live",
    launchReadiness: "architecture_only",
    connectorRef: "amazon-us",
    globalCommerceProviderId: "amazon-us",
    notes: "B6-01a SP-API NA region slot",
  },
  {
    registryId: "amazon-sg",
    displayName: "Amazon Singapore",
    countryCode: "SG",
    channelType: "marketplace",
    platformFamily: "amazon",
    v1Role: "mandatory_live",
    launchReadiness: "architecture_only",
    connectorRef: "amazon-sg",
    globalCommerceProviderId: "amazon-sg",
    notes: "B6-01b SP-API FE region slot",
  },
  {
    registryId: "shopee-sg",
    displayName: "Shopee Singapore",
    countryCode: "SG",
    channelType: "marketplace",
    platformFamily: "shopee",
    v1Role: "mandatory_live",
    launchReadiness: "architecture_only",
    connectorRef: null,
    globalCommerceProviderId: "shopee-sg",
    notes: "B6-01c Shopee Open Platform slot",
  },
  {
    registryId: "shopify",
    displayName: "Shopify",
    countryCode: "GLOBAL",
    channelType: "storefront",
    platformFamily: "shopify",
    v1Role: "mandatory_architecture",
    launchReadiness: "architecture_only",
    connectorRef: null,
    globalCommerceProviderId: "shopify-us",
    notes: "V1 architecture provision — store-scoped channel pattern",
  },
];

export const SUPPLIER_CHANNEL_DEPLOYMENT_PROFILES: readonly MarketplaceChannelProfile[] = [
  {
    registryId: "cj-dropshipping",
    displayName: "CJ Dropshipping",
    countryCode: "GLOBAL",
    channelType: "supplier",
    platformFamily: "cj",
    v1Role: "mandatory_live",
    launchReadiness: "configured",
    connectorRef: "cj-dropshipping",
    globalCommerceProviderId: "cj-global",
    notes: "Sole V1 live fulfilment supplier",
  },
];

export function listDeploymentChannelProfiles(): MarketplaceChannelProfile[] {
  return [...MARKETPLACE_CHANNEL_DEPLOYMENT_PROFILES, ...SUPPLIER_CHANNEL_DEPLOYMENT_PROFILES];
}

export function getDeploymentChannelProfile(registryId: string): MarketplaceChannelProfile | undefined {
  return listDeploymentChannelProfiles().find((p) => p.registryId === registryId);
}

export function listV1MandatoryChannels(): MarketplaceChannelProfile[] {
  return listDeploymentChannelProfiles().filter((p) => p.v1Role !== null && p.v1Role !== "expansion");
}
