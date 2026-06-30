import type { AmazonCapabilityProfile } from "../models/amazon-capability-profile.js";
import { AMAZON_DOMAIN_DEFINITIONS, AMAZON_REGIONAL_MARKETPLACES } from "../models/amazon-capability-profile.js";

/** RS-001 — Amazon Capability Profile builder. */
export function buildAmazonCapabilityProfile(): AmazonCapabilityProfile {
  return {
    providerId: "amazon-seller",
    displayName: "Amazon Seller",
    authenticationMethod: "oauth2",
    documentationUrl: "https://developer.amazonservices.com",
    domains: [...AMAZON_DOMAIN_DEFINITIONS],
    regionalMarketplaces: [...AMAZON_REGIONAL_MARKETPLACES],
    computedAt: new Date().toISOString(),
  };
}

export function getAmazonCapabilityDomain(domain: string) {
  return AMAZON_DOMAIN_DEFINITIONS.find((d) => d.domain === domain);
}
