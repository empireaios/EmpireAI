import type { MarketplaceConnectorAssessment } from "./types.js";

/** P8-03 canonical connector registry — replaceable implementations. */
export const MARKETPLACE_CONNECTOR_REGISTRY: MarketplaceConnectorAssessment[] = [
  {
    connectorId: "amazon",
    displayName: "Amazon",
    integrationQuality: "good",
    providerStability: "stable",
    commercialOpportunity: "Primary V1 revenue channel · SP-API live path",
    improvement: "Complete publish gate after King credential approval",
  },
  {
    connectorId: "shopify",
    displayName: "Shopify",
    integrationQuality: "architecture_ready",
    providerStability: "stable",
    commercialOpportunity: "Owned storefront + marketplace channel bundle",
    improvement: "Activate shopify-runtime-plugin beyond stub",
  },
  {
    connectorId: "tiktok-shop",
    displayName: "TikTok Shop",
    integrationQuality: "architecture_ready",
    providerStability: "emerging",
    commercialOpportunity: "Social commerce growth channel",
    improvement: "Register REG-MARKETPLACE row · OAuth scaffold",
  },
  {
    connectorId: "meta-commerce",
    displayName: "Meta Commerce",
    integrationQuality: "architecture_ready",
    providerStability: "stable",
    commercialOpportunity: "Instagram/Facebook Shops audience",
    improvement: "Wire advertising-engine catalog sync",
  },
  {
    connectorId: "woocommerce",
    displayName: "WooCommerce",
    integrationQuality: "architecture_ready",
    providerStability: "stable",
    commercialOpportunity: "Self-hosted merchant segment",
    improvement: "REST webhook ingress validation",
  },
  {
    connectorId: "cj-dropshipping",
    displayName: "CJ Dropshipping",
    integrationQuality: "good",
    providerStability: "stable",
    commercialOpportunity: "Dropship fulfilment backbone",
    improvement: "Deepen supplier-integration handoff metrics",
  },
  {
    connectorId: "aliexpress",
    displayName: "AliExpress",
    integrationQuality: "architecture_ready",
    providerStability: "stable",
    commercialOpportunity: "Sourcing and catalogue import",
    improvement: "Product discovery import pipeline",
  },
  {
    connectorId: "temu",
    displayName: "Temu",
    integrationQuality: "architecture_ready",
    providerStability: "emerging",
    commercialOpportunity: "Emerging marketplace expansion",
    improvement: "Registry-first onboarding · manual King gate",
  },
];
