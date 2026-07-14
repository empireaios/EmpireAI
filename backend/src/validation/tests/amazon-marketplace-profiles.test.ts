import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AMAZON_MARKETPLACE_REGISTRY_IDS,
  getAmazonMarketplaceCredentialProfile,
  getAmazonMarketplaceProfile,
  hasAmazonMarketplaceEnvCredentials,
  hasAmazonSpApiEnvCredentials,
  resolveAmazonMarketplaceRegistryId,
  resolveAmazonSpApiEndpoint,
} from "../../orchestration/reality-integration/live-commerce/amazon-marketplace-profiles.js";

const SHARED_ENV: NodeJS.ProcessEnv = {
  AMAZON_SP_API_CLIENT_ID: "shared-client-id",
  AMAZON_SP_API_CLIENT_SECRET: "shared-client-secret",
};

describe("Amazon marketplace profiles (B6-01D)", () => {
  it("defines V1 Amazon US and SG profiles with distinct endpoints", () => {
    const us = getAmazonMarketplaceProfile("amazon-us");
    const sg = getAmazonMarketplaceProfile("amazon-sg");

    assert.equal(us.marketplaceId, "ATVPDKIKX0DER");
    assert.equal(sg.marketplaceId, "A19VAU5U5O7RUS");
    assert.notEqual(us.productionEndpoint, sg.productionEndpoint);
    assert.ok(us.sellerCentralAuthorizeBaseUrl.includes("sellercentral.amazon.com"));
    assert.ok(sg.sellerCentralAuthorizeBaseUrl.includes("sellercentral.amazon.sg"));
  });

  it("uses shared LWA credentials across marketplaces", () => {
    const us = getAmazonMarketplaceCredentialProfile("amazon-us", {
      ...SHARED_ENV,
      AMAZON_SP_API_REFRESH_TOKEN_NA: "na-token",
    });
    const sg = getAmazonMarketplaceCredentialProfile("amazon-sg", {
      ...SHARED_ENV,
      AMAZON_SP_API_REFRESH_TOKEN_FE: "fe-token",
    });

    assert.equal(us.shared.clientId, sg.shared.clientId);
    assert.equal(us.shared.clientSecret, sg.shared.clientSecret);
    assert.equal(us.refreshToken, "na-token");
    assert.equal(sg.refreshToken, "fe-token");
  });

  it("aliases legacy AMAZON_SP_API_REFRESH_TOKEN to NA only", () => {
    assert.equal(
      hasAmazonMarketplaceEnvCredentials("amazon-us", {
        ...SHARED_ENV,
        AMAZON_SP_API_REFRESH_TOKEN: "legacy-na",
      }),
      true,
    );
    assert.equal(
      hasAmazonMarketplaceEnvCredentials("amazon-sg", {
        ...SHARED_ENV,
        AMAZON_SP_API_REFRESH_TOKEN: "legacy-na",
      }),
      false,
    );
  });

  it("requires both region tokens for full Amazon SP-API readiness", () => {
    assert.equal(
      hasAmazonSpApiEnvCredentials({
        ...SHARED_ENV,
        AMAZON_SP_API_REFRESH_TOKEN_NA: "na-token",
      }),
      false,
    );
    assert.equal(
      hasAmazonSpApiEnvCredentials({
        ...SHARED_ENV,
        AMAZON_SP_API_REFRESH_TOKEN_NA: "na-token",
        AMAZON_SP_API_REFRESH_TOKEN_FE: "fe-token",
      }),
      true,
    );
  });

  it("resolves legacy amazon-seller provider id to amazon-us", () => {
    assert.equal(resolveAmazonMarketplaceRegistryId("amazon-seller"), "amazon-us");
    assert.equal(resolveAmazonMarketplaceRegistryId("amazon-us"), "amazon-us");
    assert.equal(resolveAmazonMarketplaceRegistryId("amazon-sg"), "amazon-sg");
    assert.equal(resolveAmazonMarketplaceRegistryId("ebay"), null);
  });

  it("routes sandbox vs production endpoints per profile", () => {
    const us = getAmazonMarketplaceProfile("amazon-us");
    assert.equal(
      resolveAmazonSpApiEndpoint(us, "production"),
      "https://sellingpartnerapi-na.amazon.com",
    );
    assert.equal(
      resolveAmazonSpApiEndpoint(us, "sandbox"),
      "https://sandbox.sellingpartnerapi-na.amazon.com",
    );
    assert.deepEqual(AMAZON_MARKETPLACE_REGISTRY_IDS, ["amazon-us", "amazon-sg"]);
  });
});
