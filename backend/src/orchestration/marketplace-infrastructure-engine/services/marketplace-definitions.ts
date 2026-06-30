import type { MarketplaceConnectionGuide, MarketplaceId } from "../models/marketplace-connection.js";

/** Official marketplace profiles — EA never stores passwords; OAuth where supported. */
export const MARKETPLACE_DEFINITIONS: Record<MarketplaceId, MarketplaceConnectionGuide> = {
  amazon: {
    marketplaceId: "amazon",
    displayName: "Amazon",
    philosophy: "Connect Once. EA Operates Forever.",
    accountCreationSteps: [
      "Create a Seller Central account at sellercentral.amazon.com",
      "Complete identity verification and tax interview",
      "Register for SP-API developer access in Seller Central",
    ],
    oauthSupported: true,
    requiredHumanSteps: ["Complete Seller Central registration", "Authorize SP-API OAuth in EA"],
    availableApis: ["catalog_sync", "order_fulfillment", "inventory"],
    neverStoresPasswords: true,
  },
  walmart: {
    marketplaceId: "walmart",
    displayName: "Walmart Marketplace",
    philosophy: "Connect Once. EA Operates Forever.",
    accountCreationSteps: [
      "Apply for Walmart Marketplace seller account",
      "Complete business verification",
      "Request Marketplace API credentials",
    ],
    oauthSupported: true,
    requiredHumanSteps: ["Complete Walmart seller application", "Authorize Marketplace API OAuth"],
    availableApis: ["catalog_sync", "order_fulfillment"],
    neverStoresPasswords: true,
  },
  shopify: {
    marketplaceId: "shopify",
    displayName: "Shopify",
    philosophy: "Connect Once. EA Operates Forever.",
    accountCreationSteps: [
      "Create a Shopify store at shopify.com",
      "Install the EmpireAI app or create a custom app for OAuth",
    ],
    oauthSupported: true,
    requiredHumanSteps: ["Create Shopify store", "Authorize Shopify Admin API OAuth"],
    availableApis: ["checkout", "catalog_sync", "order_fulfillment"],
    neverStoresPasswords: true,
  },
  "tiktok-shop": {
    marketplaceId: "tiktok-shop",
    displayName: "TikTok Shop",
    philosophy: "Connect Once. EA Operates Forever.",
    accountCreationSteps: [
      "Register TikTok Shop Seller Center account",
      "Complete business verification for target region",
    ],
    oauthSupported: true,
    requiredHumanSteps: ["Complete TikTok Shop seller registration", "Authorize TikTok Shop API"],
    availableApis: ["catalog_sync", "order_fulfillment", "checkout"],
    neverStoresPasswords: true,
  },
  ebay: {
    marketplaceId: "ebay",
    displayName: "eBay",
    philosophy: "Connect Once. EA Operates Forever.",
    accountCreationSteps: [
      "Create an eBay seller account",
      "Register for eBay Developer Program",
      "Create OAuth application credentials",
    ],
    oauthSupported: true,
    requiredHumanSteps: ["Create eBay seller account", "Authorize eBay OAuth consent flow"],
    availableApis: ["catalog_sync", "order_fulfillment"],
    neverStoresPasswords: true,
  },
  "google-merchant": {
    marketplaceId: "google-merchant",
    displayName: "Google Merchant Center",
    philosophy: "Connect Once. EA Operates Forever.",
    accountCreationSteps: [
      "Create Google Merchant Center account",
      "Verify and claim your store domain",
      "Link Google Ads account if running Shopping ads",
    ],
    oauthSupported: true,
    requiredHumanSteps: ["Verify domain in Merchant Center", "Authorize Content API OAuth"],
    availableApis: ["catalog_sync", "metrics_import"],
    neverStoresPasswords: true,
  },
  "facebook-shop": {
    marketplaceId: "facebook-shop",
    displayName: "Facebook Shop",
    philosophy: "Connect Once. EA Operates Forever.",
    accountCreationSteps: [
      "Create Facebook Business Manager account",
      "Set up Commerce Manager catalog",
      "Connect Facebook Page and Instagram account",
    ],
    oauthSupported: true,
    requiredHumanSteps: ["Complete Business Manager setup", "Authorize Meta Commerce OAuth"],
    availableApis: ["catalog_sync", "checkout"],
    neverStoresPasswords: true,
  },
  "instagram-shop": {
    marketplaceId: "instagram-shop",
    displayName: "Instagram Shop",
    philosophy: "Connect Once. EA Operates Forever.",
    accountCreationSteps: [
      "Convert Instagram account to Business/Creator",
      "Connect to Facebook Commerce Manager catalog",
    ],
    oauthSupported: true,
    requiredHumanSteps: ["Link Instagram to Commerce Manager", "Authorize Meta Commerce OAuth"],
    availableApis: ["catalog_sync", "checkout"],
    neverStoresPasswords: true,
  },
};

export function getMarketplaceDefinition(marketplaceId: MarketplaceId): MarketplaceConnectionGuide {
  return MARKETPLACE_DEFINITIONS[marketplaceId];
}

/** Maps marketplace IDs to existing connector catalog IDs where applicable. */
export const MARKETPLACE_CONNECTOR_MAP: Partial<Record<MarketplaceId, string>> = {
  amazon: "amazon",
  shopify: "shopify",
  ebay: "ebay",
  "facebook-shop": "meta-ads",
  "instagram-shop": "meta-ads",
};
