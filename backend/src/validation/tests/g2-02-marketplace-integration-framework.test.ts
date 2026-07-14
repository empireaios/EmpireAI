import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MARKETPLACE_API_PROTOCOLS,
  MARKETPLACE_DOMAIN_CAPABILITIES,
  MARKETPLACE_INTEGRATION_LIFECYCLE,
  MARKETPLACE_INTEGRATION_VERSION,
  MarketplaceContractValidationError,
  advanceMarketplaceLifecycle,
  buildMarketplaceAdapterContract,
  canTransitionMarketplaceLifecycle,
  discoverMarketplaceCapabilitiesForBrain,
  discoverMarketplaces,
  getMarketplacePluginHost,
  listMarketplaceBrainDomainCapabilities,
  listMarketplaceEngineBindings,
  listMarketplaceIntegrationLifecyclePhases,
  provideMarketplaceCapabilityToAllEngines,
  provideMarketplaceCapabilityToEngine,
  resetInfrastructureCommerceForTests,
  resolveAllMarketplaceCapabilities,
  resolveMarketplaceRegistrySnapshot,
  transitionMarketplaceLifecycle,
  validateMarketplaceAdapterContract,
  validateMarketplaceIntegration,
  validateMarketplacePillowGovernance,
} from "../../orchestration/infrastructure-commerce/index.js";
import type { CommerceMarketplaceRow } from "../../registry/types/commerce-registry-types.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const TEST_CONTEXT = { workspaceId: "ws-foundation" } as const;
const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: "ws-foundation",
  pillowGovernance: true as const,
};

describe("G2-02 — Marketplace Integration Framework", () => {
  it("exposes universal marketplace integration lifecycle phases", () => {
    assert.deepEqual(listMarketplaceIntegrationLifecyclePhases(), MARKETPLACE_INTEGRATION_LIFECYCLE);
    assert.equal(MARKETPLACE_INTEGRATION_LIFECYCLE.length, 9);
  });

  it("supports future API protocols without hardcoded marketplace behaviour", () => {
    assert.ok(MARKETPLACE_API_PROTOCOLS.includes("rest"));
    assert.ok(MARKETPLACE_API_PROTOCOLS.includes("graphql"));
    assert.ok(MARKETPLACE_API_PROTOCOLS.includes("soap"));
    assert.ok(MARKETPLACE_API_PROTOCOLS.includes("sdk"));
    assert.ok(MARKETPLACE_API_PROTOCOLS.includes("webhook"));
    assert.ok(MARKETPLACE_API_PROTOCOLS.includes("event_driven"));
    assert.ok(MARKETPLACE_API_PROTOCOLS.includes("future_protocol"));
  });

  it("discovers marketplaces from REG-MARKETPLACE via registry integration", () => {
    resetInfrastructureCommerceForTests();
    const discovery = discoverMarketplaces(TEST_CONTEXT);
    assert.equal(discovery.discoverySource, "RegistryLoader:REG-MARKETPLACE");
    assert.ok(discovery.discoveredCount >= 2);
    assert.equal(discovery.marketplaces[0]?.marketplaceId, "mkt-foundation-primary-channel");
    assert.equal(discovery.marketplaces[0]?.discoverySource, "RegistryLoader:REG-MARKETPLACE");
  });

  it("resolves marketplace registry snapshot from required registries", () => {
    resetInfrastructureCommerceForTests();
    const snapshot = resolveMarketplaceRegistrySnapshot(TEST_CONTEXT);
    assert.ok(snapshot.marketplaces.length >= 2);
    assert.ok(snapshot.policies.length >= 1);
    assert.ok(snapshot.countryCommerce.length >= 1);
    assert.equal(
      snapshot.registrySource,
      "RegistryLoader:REG-MARKETPLACE|REG-COMMERCE-POLICY|REG-COUNTRY-COMMERCE",
    );
  });

  it("builds marketplace adapter contracts with required contract fields", () => {
    resetInfrastructureCommerceForTests();
    const row = resolveMarketplaceRegistrySnapshot(TEST_CONTEXT).marketplaces[0] as CommerceMarketplaceRow;
    const contract = buildMarketplaceAdapterContract(row);
    validateMarketplaceAdapterContract(contract);
    assert.equal(contract.version, "1.0.0");
    assert.ok(contract.capabilities.length >= 1);
    assert.ok(contract.supportedCountries.length >= 1);
    assert.ok(contract.supportedRegions.length >= 1);
    assert.ok(contract.supportedFeatures.length >= 1);
    assert.equal(contract.pluginCompatibility.allowPluginRegistration, true);
    assert.equal(contract.domainContracts.authentication.supported, true);
  });

  it("validates marketplace integration contracts from registry rows", () => {
    resetInfrastructureCommerceForTests();
    const result = validateMarketplaceIntegration(TEST_CONTEXT, "mkt-foundation-primary-channel");
    assert.equal(result.valid, true);
    assert.ok(result.contract);
    assert.equal(result.contract?.authenticationMethod, "oauth2");
    assert.equal(result.contract?.apiSpecification.protocol, "rest");
  });

  it("resolves marketplace domain capabilities dynamically", () => {
    resetInfrastructureCommerceForTests();
    const primary = resolveAllMarketplaceCapabilities(TEST_CONTEXT).find(
      (entry) => entry.marketplaceId === "mkt-foundation-primary-channel",
    );
    const secondary = resolveAllMarketplaceCapabilities(TEST_CONTEXT).find(
      (entry) => entry.marketplaceId === "mkt-foundation-secondary-channel",
    );
    assert.ok(primary);
    assert.ok(secondary);
    assert.equal(primary.registryBacked, true);
    assert.equal(primary.policyCompliant, true);
    assert.ok(primary.resolvedCapabilities.length >= 7);
    assert.ok(secondary.resolvedCapabilities.length < primary.resolvedCapabilities.length);
  });

  it("discovers marketplace capabilities for Brain through RegistryLoader only", () => {
    resetInfrastructureCommerceForTests();
    const brainCapabilities = discoverMarketplaceCapabilitiesForBrain(TEST_CONTEXT);
    assert.ok(brainCapabilities.length >= 2);
    for (const entry of brainCapabilities) {
      assert.equal(entry.discoverySource, "RegistryLoader:REG-MARKETPLACE");
      assert.ok(entry.capabilities.length >= 1);
    }
    assert.deepEqual(
      listMarketplaceBrainDomainCapabilities(),
      [...MARKETPLACE_DOMAIN_CAPABILITIES],
    );
  });

  it("provides marketplace capability envelopes to business engines", () => {
    resetInfrastructureCommerceForTests();
    const bindings = listMarketplaceEngineBindings();
    assert.ok(bindings.includes("marketplace-infrastructure-engine"));
    assert.ok(bindings.includes("storefront-assembly-engine"));
    assert.ok(bindings.includes("advertising-intelligence-engine"));

    const marketplaceEngine = provideMarketplaceCapabilityToEngine(
      TEST_CONTEXT,
      "marketplace-infrastructure-engine",
    );
    assert.ok(marketplaceEngine.length >= 2);
    assert.equal(marketplaceEngine[0]?.discoverySource, "RegistryLoader:marketplace-engine-bridge");

    const allEngines = provideMarketplaceCapabilityToAllEngines(TEST_CONTEXT);
    assert.ok(allEngines.length >= bindings.length);
  });

  it("enforces marketplace integration lifecycle transitions", () => {
    assert.equal(canTransitionMarketplaceLifecycle("discover", "validate"), true);
    assert.equal(canTransitionMarketplaceLifecycle("discover", "connect"), false);

    const approved = transitionMarketplaceLifecycle("discover", {
      marketplaceId: "mkt-foundation-primary-channel",
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      pillowGovernance: true,
      targetPhase: "validate",
    });
    assert.equal(approved.allowed, true);
    assert.equal(approved.currentPhase, "validate");
  });

  it("advances marketplace lifecycle under Pillow governance", () => {
    resetInfrastructureCommerceForTests();
    const result = advanceMarketplaceLifecycle({
      ...TEST_ACTOR,
      marketplaceId: "mkt-foundation-primary-channel",
      targetPhase: "validate",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.currentPhase, "validate");
  });

  it("registers marketplace plugins through framework host without core changes", () => {
    resetInfrastructureCommerceForTests();
    const host = getMarketplacePluginHost();
    const manifest = {
      pluginId: "g2-test-marketplace-plugin",
      pluginName: "G2 Test Marketplace Plugin",
      version: "0.1.0",
      marketplaceRegistryRowId: "mkt-foundation-primary-channel",
      supportedProtocols: ["rest" as const],
      supportedFeatures: ["health_probe" as const],
      pillowGovernance: true as const,
      extensions: { adapterProfile: "generic" },
    };
    const result = host.registerPlugin(TEST_ACTOR, manifest);
    assert.equal(result.accepted, true);
    assert.ok(host.listPlugins().some((plugin) => plugin.pluginId === manifest.pluginId));
  });

  it("passes Pillow marketplace governance checks", () => {
    resetInfrastructureCommerceForTests();
    const result = validateMarketplacePillowGovernance({
      ...TEST_ACTOR,
      marketplaceId: "mkt-foundation-primary-channel",
      operation: "discover",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.trustVerified, true);
    assert.equal(result.policyCompliant, true);
    assert.equal(result.workspaceIsolated, true);
  });

  it("rejects malformed marketplace integration configuration", () => {
    assert.throws(
      () =>
        buildMarketplaceAdapterContract({
          id: "mkt-bad-config",
          name: "Bad Config",
          description: "bad",
          status: "VALIDATED",
          version: "1.0.0",
          owner: "pillow:governance",
          dependencies: [],
          capabilities: ["connection"],
          configuration: {},
          supportedRegions: ["global"],
          supportedCountries: ["*"],
          validation: { schemaVersion: "g2-01-v1" },
          pluginSupport: { allowPluginRegistration: true },
          workspaceScope: { scope: "global" },
          futureCompatibility: { minSchemaVersion: "g2-01-v1" },
          channelType: "marketplace",
        }),
      MarketplaceContractValidationError,
    );
  });

  it("validates foundation marketplace contracts without hardcoded business entities", () => {
    resetInfrastructureCommerceForTests();
    const serialized = JSON.stringify(discoverMarketplaces(TEST_CONTEXT));
    const forbidden = ["amazon", "walmart", "lazada", "shopee", "ebay", "etsy", "Stripe", "PayPal"];
    for (const token of forbidden) {
      assert.equal(
        serialized.toLowerCase().includes(token.toLowerCase()),
        false,
        `marketplace framework must not hardcode business entity token: ${token}`,
      );
    }
    assert.equal(MARKETPLACE_INTEGRATION_VERSION, "g2-02-v1");
  });
});
