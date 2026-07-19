/** R1-14 — Marketplace health fixtures (structural — no live HTTP). */

import type { ApiAvailabilityStatus } from "./types.js";
import { SUPPORTED_MARKETPLACE_IDENTIFIERS } from "./paths.js";

export type MarketplaceHealthFixture = {
  marketplaceIdentifier: string;
  authenticationStatus: string;
  apiAvailability: ApiAvailabilityStatus;
  apiLatencyMs: number;
  apiErrorRate: number;
  productSynchronizationStatus: string;
  orderSynchronizationStatus: string;
  rateLimitStatus: string;
  activeAlerts: string[];
  recoveryStatus: string;
};

export function getFixtureForMarketplace(marketplaceIdentifier: string): MarketplaceHealthFixture {
  const defaults: Record<string, MarketplaceHealthFixture> = {
    amazon: {
      marketplaceIdentifier: "amazon",
      authenticationStatus: "authenticated",
      apiAvailability: "available",
      apiLatencyMs: 320,
      apiErrorRate: 0.01,
      productSynchronizationStatus: "synced",
      orderSynchronizationStatus: "synced",
      rateLimitStatus: "normal",
      activeAlerts: [],
      recoveryStatus: "none",
    },
    walmart: {
      marketplaceIdentifier: "walmart",
      authenticationStatus: "authenticated",
      apiAvailability: "available",
      apiLatencyMs: 450,
      apiErrorRate: 0.02,
      productSynchronizationStatus: "synced",
      orderSynchronizationStatus: "idle",
      rateLimitStatus: "normal",
      activeAlerts: [],
      recoveryStatus: "none",
    },
    etsy: {
      marketplaceIdentifier: "etsy",
      authenticationStatus: "authenticated",
      apiAvailability: "degraded",
      apiLatencyMs: 1800,
      apiErrorRate: 0.04,
      productSynchronizationStatus: "degraded",
      orderSynchronizationStatus: "idle",
      rateLimitStatus: "normal",
      activeAlerts: ["Elevated API latency"],
      recoveryStatus: "monitoring",
    },
    ebay: {
      marketplaceIdentifier: "ebay",
      authenticationStatus: "authenticated",
      apiAvailability: "available",
      apiLatencyMs: 510,
      apiErrorRate: 0.03,
      productSynchronizationStatus: "synced",
      orderSynchronizationStatus: "synced",
      rateLimitStatus: "normal",
      activeAlerts: [],
      recoveryStatus: "none",
    },
    "tiktok-shop": {
      marketplaceIdentifier: "tiktok-shop",
      authenticationStatus: "pending",
      apiAvailability: "degraded",
      apiLatencyMs: 1200,
      apiErrorRate: 0.06,
      productSynchronizationStatus: "idle",
      orderSynchronizationStatus: "idle",
      rateLimitStatus: "throttled",
      activeAlerts: ["Rate limit events detected"],
      recoveryStatus: "monitoring",
    },
    shopify: {
      marketplaceIdentifier: "shopify",
      authenticationStatus: "authenticated",
      apiAvailability: "available",
      apiLatencyMs: 280,
      apiErrorRate: 0.01,
      productSynchronizationStatus: "synced",
      orderSynchronizationStatus: "synced",
      rateLimitStatus: "normal",
      activeAlerts: [],
      recoveryStatus: "none",
    },
    woocommerce: {
      marketplaceIdentifier: "woocommerce",
      authenticationStatus: "authenticated",
      apiAvailability: "available",
      apiLatencyMs: 390,
      apiErrorRate: 0.02,
      productSynchronizationStatus: "synced",
      orderSynchronizationStatus: "synced",
      rateLimitStatus: "normal",
      activeAlerts: [],
      recoveryStatus: "none",
    },
  };

  return (
    defaults[marketplaceIdentifier] ?? {
      marketplaceIdentifier,
      authenticationStatus: "unauthenticated",
      apiAvailability: "unavailable",
      apiLatencyMs: 0,
      apiErrorRate: 1,
      productSynchronizationStatus: "unknown",
      orderSynchronizationStatus: "unknown",
      rateLimitStatus: "unknown",
      activeAlerts: ["Connector not registered"],
      recoveryStatus: "none",
    }
  );
}

export function getAllMarketplaceFixtures(): MarketplaceHealthFixture[] {
  return SUPPORTED_MARKETPLACE_IDENTIFIERS.map((id) => getFixtureForMarketplace(id));
}

export function getDegradedFixture(): MarketplaceHealthFixture {
  return {
    marketplaceIdentifier: "amazon",
    authenticationStatus: "failed",
    apiAvailability: "unavailable",
    apiLatencyMs: 5000,
    apiErrorRate: 0.25,
    productSynchronizationStatus: "failed",
    orderSynchronizationStatus: "failed",
    rateLimitStatus: "throttled",
    activeAlerts: ["Authentication failure", "API unavailable"],
    recoveryStatus: "recovery_attempted",
  };
}
