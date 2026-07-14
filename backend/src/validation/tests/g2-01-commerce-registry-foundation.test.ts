import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COMMERCE_REGISTRY_IDS,
  CommerceRegistryValidationError,
  REG_COMMERCE_POLICY,
  REG_MARKETPLACE,
  REG_SUPPLIER,
  RegistryLoader,
  getRegistryLoader,
  resetCommerceRegistryBatchForTests,
  resetRegistryLoaderForTests,
  validateCommerceRegistryBatch,
  validateCommerceRegistryRows,
} from "../../registry/index.js";
import type { CommerceMarketplaceRow } from "../../registry/types/commerce-registry-types.js";
import {
  COMMERCE_BUSINESS_ENGINE_DOMAINS,
  discoverAllCommerceEngines,
  discoverCommerceCapabilitiesForBrain,
  discoverCommerceEngine,
  listCommerceRegistryIds,
  resolveAllCommerceRegistries,
  resolveCommerceRegistry,
  resetInfrastructureCommerceForTests,
  validateCommerceRegistryGovernance,
} from "../../orchestration/infrastructure-commerce/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const TEST_WORKSPACE = { workspaceId: "ws-foundation" } as const;

describe("G2-01 — Commerce Registry Foundation", () => {
  it("exposes all ten commerce registry ids for dynamic discovery", () => {
    assert.equal(COMMERCE_REGISTRY_IDS.length, 10);
    assert.deepEqual(listCommerceRegistryIds(), COMMERCE_REGISTRY_IDS);
  });

  it("marks commerce registries as wired in foundation status", () => {
    const loader = getRegistryLoader();
    const status = loader.listFoundationStatus();
    for (const registryId of COMMERCE_REGISTRY_IDS) {
      const entry = status.find((item) => item.registryId === registryId);
      assert.ok(entry, `missing foundation status for ${registryId}`);
      assert.equal(entry.wired, true, `${registryId} should be wired`);
    }
  });

  it("loads foundation marketplace rows via RegistryLoader", () => {
    resetRegistryLoaderForTests();
    resetInfrastructureCommerceForTests();
    const result = getRegistryLoader().resolve({}, REG_MARKETPLACE);
    assert.equal(result.meta.wired, true);
    assert.equal(result.meta.version, "g2-01-v1");
    assert.equal(result.meta.tier, "platform_catalog");
    assert.ok(result.rows.length >= 1);
    const marketplace = result.rows[0] as CommerceMarketplaceRow;
    assert.equal(marketplace.id, "mkt-foundation-primary-channel");
    assert.equal(marketplace.channelType, "marketplace");
  });

  it("filters commerce rows by countryCode and registryRowId query", () => {
    resetRegistryLoaderForTests();
    resetInfrastructureCommerceForTests();
    const byCountry = getRegistryLoader().resolve({}, REG_MARKETPLACE, { countryCode: "US" });
    const ids = byCountry.rows.map((row) => (row as { id: string }).id);
    assert.ok(ids.includes("mkt-foundation-primary-channel"));
    assert.ok(ids.includes("mkt-foundation-secondary-channel"));

    const byId = getRegistryLoader().resolve({}, REG_SUPPLIER, {
      registryRowId: "sup-foundation-primary-fulfillment",
    });
    assert.equal(byId.rows.length, 1);
    assert.equal((byId.rows[0] as { id: string }).id, "sup-foundation-primary-fulfillment");
  });

  it("resolves all commerce registries through infrastructure-commerce resolver", () => {
    resetRegistryLoaderForTests();
    resetInfrastructureCommerceForTests();
    const catalog = resolveAllCommerceRegistries(TEST_WORKSPACE);
    for (const registryId of COMMERCE_REGISTRY_IDS) {
      assert.ok(catalog[registryId]);
      assert.equal(catalog[registryId].meta.wired, true);
      assert.ok(catalog[registryId].rows.length >= 1);
    }
  });

  it("discovers commerce capabilities for Brain through RegistryLoader only", () => {
    resetRegistryLoaderForTests();
    resetInfrastructureCommerceForTests();
    const capabilities = discoverCommerceCapabilitiesForBrain(TEST_WORKSPACE);
    assert.equal(capabilities.length, 10);
    for (const entry of capabilities) {
      assert.equal(entry.wired, true);
      assert.ok(entry.rowCount >= 1);
      assert.ok(entry.capabilities.length >= 1);
    }
  });

  it("discovers all seven business engines without embedded business logic", () => {
    resetRegistryLoaderForTests();
    resetInfrastructureCommerceForTests();
    const engines = discoverAllCommerceEngines(TEST_WORKSPACE);
    assert.equal(engines.length, COMMERCE_BUSINESS_ENGINE_DOMAINS.length);
    for (const snapshot of engines) {
      assert.equal(snapshot.discoverySource, "RegistryLoader:commerce-engine-discovery");
      assert.ok(snapshot.capabilityIds.length >= 1);
      assert.ok(Object.keys(snapshot.registries).length >= 1);
    }
    const marketplace = discoverCommerceEngine("marketplace", TEST_WORKSPACE);
    assert.equal(marketplace.engineModule, "marketplace-infrastructure-engine");
    assert.ok(marketplace.registries[REG_MARKETPLACE]);
  });

  it("caches commerce registry resolves within policy TTL", () => {
    resetRegistryLoaderForTests();
    resetInfrastructureCommerceForTests();
    const loader = new RegistryLoader();
    const first = loader.resolve({}, REG_COMMERCE_POLICY);
    const second = loader.resolve({}, REG_COMMERCE_POLICY);
    assert.equal(first.meta.contentHash, second.meta.contentHash);
    assert.equal(first.meta.loadedAt, second.meta.loadedAt);
  });

  it("accepts commerce plugin manifest registration", () => {
    resetRegistryLoaderForTests();
    const loader = getRegistryLoader();
    const result = loader.registerPlugin({
      pluginId: "g2-test-marketplace-plugin",
      kind: "commerce_marketplace",
      targetRegistryId: REG_MARKETPLACE,
      tier: "platform_catalog",
      version: "0.0.1",
      description: "G2-01 plugin registration test",
      extensions: { channelType: "marketplace" },
    });
    assert.equal(result.accepted, true);
  });

  it("rejects duplicate commerce registry row ids", () => {
    assert.throws(
      () =>
        validateCommerceRegistryRows(REG_MARKETPLACE, [
          {
            id: "dup-id",
            name: "A",
            description: "A",
            status: "VALIDATED",
            version: "1.0.0",
            owner: "pillow:governance",
            dependencies: [],
            capabilities: [],
            configuration: {},
            supportedRegions: ["global"],
            supportedCountries: ["*"],
            validation: { schemaVersion: "g2-01-v1" },
            pluginSupport: { allowPluginRegistration: true },
            workspaceScope: { scope: "global" },
            futureCompatibility: { minSchemaVersion: "g2-01-v1" },
            channelType: "marketplace",
          },
          {
            id: "dup-id",
            name: "B",
            description: "B",
            status: "VALIDATED",
            version: "1.0.0",
            owner: "pillow:governance",
            dependencies: [],
            capabilities: [],
            configuration: {},
            supportedRegions: ["global"],
            supportedCountries: ["*"],
            validation: { schemaVersion: "g2-01-v1" },
            pluginSupport: { allowPluginRegistration: true },
            workspaceScope: { scope: "global" },
            futureCompatibility: { minSchemaVersion: "g2-01-v1" },
            channelType: "marketplace",
          },
        ]),
      CommerceRegistryValidationError,
    );
  });

  it("rejects malformed commerce registry rows", () => {
    assert.throws(
      () => validateCommerceRegistryRows(REG_MARKETPLACE, [{ id: "bad" }]),
      CommerceRegistryValidationError,
    );
  });

  it("rejects unknown cross-registry dependencies", () => {
    assert.throws(
      () =>
        validateCommerceRegistryBatch({
          "REG-MARKETPLACE": [
            {
              id: "mkt-bad-dep",
              name: "Bad Marketplace",
              description: "bad dep",
              status: "VALIDATED",
              version: "1.0.0",
              owner: "pillow:governance",
              dependencies: ["missing-policy-ref"],
              capabilities: [],
              configuration: {},
              supportedRegions: ["global"],
              supportedCountries: ["*"],
              validation: { schemaVersion: "g2-01-v1" },
              pluginSupport: { allowPluginRegistration: true },
              workspaceScope: { scope: "global" },
              futureCompatibility: { minSchemaVersion: "g2-01-v1" },
              channelType: "marketplace",
            },
          ],
          "REG-SUPPLIER": [],
          "REG-STOREFRONT": [],
          "REG-PAYMENT": [],
          "REG-LOGISTICS": [],
          "REG-COUNTRY-COMMERCE": [],
          "REG-CATEGORY": [],
          "REG-BRAND": [],
          "REG-PRODUCT-SOURCE": [],
          "REG-COMMERCE-POLICY": [],
        } as unknown as Parameters<typeof validateCommerceRegistryBatch>[0]),
      CommerceRegistryValidationError,
    );
  });

  it("validates foundation seed batch without hardcoded business entities", () => {
    resetInfrastructureCommerceForTests();
    const catalog = resolveAllCommerceRegistries(TEST_WORKSPACE);
    const serialized = JSON.stringify(catalog);
    const forbidden = [
      "amazon-us",
      "walmart-us",
      "CJ Dropshipping",
      "Stripe",
      "PayPal",
      "Shopify",
      "lazada",
      "shopee",
    ];
    for (const token of forbidden) {
      assert.equal(
        serialized.includes(token),
        false,
        `foundation seed must not hardcode business entity token: ${token}`,
      );
    }
  });

  it("passes Pillow commerce registry governance for wired registries", () => {
    resetRegistryLoaderForTests();
    resetInfrastructureCommerceForTests();
    const result = validateCommerceRegistryGovernance({
      actorId: "grand-king",
      workspaceId: "ws-foundation",
      registryId: REG_MARKETPLACE,
    });
    assert.equal(result.eligible, true);
    assert.equal(result.policyCompliant, true);
    assert.equal(result.workspaceIsolated, true);
  });

  it("resolves commerce registry through infrastructure-commerce resolver", () => {
    resetRegistryLoaderForTests();
    resetInfrastructureCommerceForTests();
    const result = resolveCommerceRegistry({}, REG_COMMERCE_POLICY);
    assert.ok(result.rows.length >= 1);
    assert.equal((result.rows[0] as { id: string }).id, "pol-foundation-commerce-default");
  });
});
