/** REAL-002B — Live Commerce Integration configuration. */

import {
  AMAZON_MARKETPLACE_REGISTRY_IDS,
  type AmazonMarketplaceRegistryId,
  getAmazonMarketplaceCredentialProfile,
  getAmazonMarketplaceProfile,
  getAmazonSpApiSharedCredentials,
  hasAmazonSpApiSharedCredentials,
  listAmazonMarketplaceProfiles,
  resolveAmazonSpApiEndpoint,
} from "./amazon-marketplace-profiles.js";

export type LiveCommerceIntegrationMode = "disabled" | "sandbox" | "production";

export function isLiveCommerceIntegrationEnabled(): boolean {
  return resolveLiveCommerceIntegrationMode() !== "disabled";
}

export function resolveLiveCommerceIntegrationMode(): LiveCommerceIntegrationMode {
  const raw = (process.env.LIVE_COMMERCE_INTEGRATION_MODE ?? "sandbox").toLowerCase();
  if (raw === "disabled" || raw === "off" || raw === "false") return "disabled";
  if (raw === "production" || raw === "live") return "production";
  return "sandbox";
}

export function isProductionLiveCommerce(): boolean {
  return resolveLiveCommerceIntegrationMode() === "production";
}

/** V1 Amazon marketplaces — ADR-052 / B6-01D. Shopee + Shopify added in later missions. */
export const LIVE_COMMERCE_PROVIDER_IDS = {
  marketplaces: [...AMAZON_MARKETPLACE_REGISTRY_IDS] as readonly AmazonMarketplaceRegistryId[],
  suppliers: ["cj-dropshipping"] as const,
};

export {
  AMAZON_MARKETPLACE_REGISTRY_IDS,
  getAmazonMarketplaceCredentialProfile,
  getAmazonMarketplaceProfile,
  getAmazonSpApiSharedCredentials,
  hasAmazonSpApiSharedCredentials,
  listAmazonMarketplaceProfiles,
};

/** @deprecated Use getAmazonMarketplaceCredentialProfile(registryId) — B6-01D multi-region. */
export function getAmazonSpApiConfig(registryId: AmazonMarketplaceRegistryId = "amazon-us") {
  const profile = getAmazonMarketplaceProfile(registryId);
  const credentialProfile = getAmazonMarketplaceCredentialProfile(registryId);
  return {
    registryId,
    clientId: credentialProfile.shared.clientId,
    clientSecret: credentialProfile.shared.clientSecret,
    refreshToken: credentialProfile.refreshToken,
    region: profile.spApiRegion.toLowerCase(),
    marketplaceId: profile.marketplaceId,
    sandboxEndpoint: profile.sandboxEndpoint,
    productionEndpoint: profile.productionEndpoint,
    sellerCentralAuthorizeBaseUrl: profile.sellerCentralAuthorizeBaseUrl,
    resolveEndpoint: (mode: "sandbox" | "production") =>
      resolveAmazonSpApiEndpoint(profile, mode),
  };
}

export function getSupplierApiConfig(providerId: string) {
  if (providerId === "cj-dropshipping") {
    return {
      apiKey: process.env.CJ_DROPSHIPPING_API_KEY ?? "",
      baseUrl:
        process.env.CJ_DROPSHIPPING_API_BASE ??
        "https://developers.cjdropshipping.com/api2.0/v1",
    };
  }
  return { apiKey: "", baseUrl: "" };
}
