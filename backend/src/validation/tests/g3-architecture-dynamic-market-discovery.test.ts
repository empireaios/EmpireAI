import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildIntelligenceMarketDiscoverySnapshot,
  listAvailableCountries,
  listAvailableMarketplacesByCountry,
  listExpansionMarketplaces,
  resolveIntelligenceSources,
} from "../../intelligence/shared/intelligence-market-discovery.js";
import {
  getDeploymentChannelProfile,
  listV1MandatoryChannels,
} from "../../intelligence/shared/marketplace-channel-registry.js";
import { buildProductIntelligenceEngineArchitecture } from "../../intelligence/product-intelligence-engine/engine-architecture.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

describe("G3 — Dynamic market discovery architecture", () => {
  it("walks discovery chain: registry → countries → marketplaces → channels", () => {
    const snapshot = buildIntelligenceMarketDiscoverySnapshot();
    assert.ok(snapshot.countries.length >= 10);
    assert.ok(snapshot.deploymentChannels.length >= 5);
    assert.ok(snapshot.intelligenceSources.length >= 5);
    assert.equal(snapshot.registrySource, "RegistryLoader:DERIVED-DISCOVERY-SNAPSHOT");

    const sgMarketplaces = snapshot.marketplacesByCountry.SG ?? [];
    assert.ok(sgMarketplaces.some((m) => m.providerId === "shopee-sg"));
    assert.ok(sgMarketplaces.some((m) => m.providerId === "lazada-sg"));
  });

  it("lists V1 mandatory channels as deployment config rows", () => {
    const mandatory = listV1MandatoryChannels();
    const ids = mandatory.map((c) => c.registryId);
    assert.ok(ids.includes("amazon-us"));
    assert.ok(ids.includes("amazon-sg"));
    assert.ok(ids.includes("shopee-sg"));
    assert.ok(ids.includes("shopify"));
    assert.ok(ids.includes("cj-dropshipping"));
  });

  it("exposes expansion marketplaces without engine code changes", () => {
    const expansion = listExpansionMarketplaces();
    const expansionIds = expansion.map((p) => p.providerId);
    assert.ok(expansionIds.includes("lazada-sg"));
    assert.ok(expansionIds.includes("tiktok-shop-us"));
    assert.ok(expansionIds.includes("walmart-us"));
    assert.ok(expansionIds.includes("etsy-us"));
    assert.ok(expansionIds.includes("ebay-us"));
    assert.ok(expansionIds.includes("rakuten-jp"));
    assert.ok(expansionIds.includes("mercado-livre-br"));
  });

  it("Product Intelligence Engine sources are registry-derived", () => {
    const arch = buildProductIntelligenceEngineArchitecture();
    const registrySources = resolveIntelligenceSources();
    assert.deepEqual(arch.sources.map((s) => s.id), registrySources.map((s) => s.id));
    assert.ok(!arch.futureExpansion.some((item) => item === "Shopee SG live connector"));
    assert.ok(arch.futureExpansion.some((item) => item.includes("lazada-sg") || item.includes("Lazada")));
  });

  it("resolves country-scoped marketplace lists from global commerce registry", () => {
    const us = listAvailableMarketplacesByCountry("US");
    const usIds = us.map((p) => p.providerId);
    assert.ok(usIds.includes("amazon-us"));
    assert.ok(usIds.includes("walmart-us"));
    assert.ok(listAvailableCountries().some((c) => c.countryCode === "US"));
  });

  it("does not require engine edits when a deployment profile exists", () => {
    const lazada = getDeploymentChannelProfile("lazada-sg");
    assert.equal(lazada, undefined);
    const sgProviders = listAvailableMarketplacesByCountry("SG");
    assert.ok(sgProviders.some((p) => p.providerId === "lazada-sg"));
  });
});
