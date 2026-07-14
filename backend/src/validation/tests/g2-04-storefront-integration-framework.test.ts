import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  STOREFRONT_CHANNEL_MODELS,
  STOREFRONT_DOMAIN_CAPABILITIES,
  STOREFRONT_EKLS_OUTCOME_KINDS,
  STOREFRONT_INTEGRATION_LIFECYCLE,
  STOREFRONT_INTEGRATION_VERSION,
  StorefrontContractValidationError,
  advanceStorefrontLifecycle,
  buildStorefrontAdapterContract,
  canTransitionStorefrontLifecycle,
  discoverStorefrontCapabilitiesForBrain,
  discoverStorefronts,
  getStorefrontPluginHost,
  listStorefrontBrainDomainCapabilities,
  listStorefrontEklsOutcomeKinds,
  listStorefrontEngineBindings,
  listStorefrontIntegrationLifecyclePhases,
  provideStorefrontCapabilityToAllEngines,
  provideStorefrontCapabilityToEngine,
  recordStorefrontEklsOutcome,
  resetInfrastructureCommerceForTests,
  resolveAllStorefrontCapabilities,
  resolveStorefrontRegistrySnapshot,
  searchStorefrontEklsOutcomes,
  transitionStorefrontLifecycle,
  validateStorefrontIntegration,
  validateStorefrontPillowGovernance,
  validateStorefrontProvisioning,
} from "../../orchestration/infrastructure-commerce/index.js";
import type { CommerceStorefrontRow } from "../../registry/types/commerce-registry-types.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const TEST_CONTEXT = { workspaceId: "ws-foundation" } as const;
const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: "ws-foundation",
  pillowGovernance: true as const,
};

describe("G2-04 — Storefront Integration Framework", () => {
  it("exposes universal storefront integration lifecycle phases", () => {
    assert.deepEqual(listStorefrontIntegrationLifecyclePhases(), STOREFRONT_INTEGRATION_LIFECYCLE);
    assert.equal(STOREFRONT_INTEGRATION_LIFECYCLE.length, 11);
  });

  it("supports future commerce channel models without hardcoded storefront providers", () => {
    assert.ok(STOREFRONT_CHANNEL_MODELS.includes("hosted"));
    assert.ok(STOREFRONT_CHANNEL_MODELS.includes("self_hosted"));
    assert.ok(STOREFRONT_CHANNEL_MODELS.includes("marketplace_storefront"));
    assert.ok(STOREFRONT_CHANNEL_MODELS.includes("headless"));
    assert.ok(STOREFRONT_CHANNEL_MODELS.includes("native_mobile"));
    assert.ok(STOREFRONT_CHANNEL_MODELS.includes("future_channel"));
  });

  it("discovers storefronts from REG-STOREFRONT via registry integration", () => {
    resetInfrastructureCommerceForTests();
    const discovery = discoverStorefronts(TEST_CONTEXT);
    assert.equal(discovery.discoverySource, "RegistryLoader:REG-STOREFRONT");
    assert.ok(discovery.discoveredCount >= 2);
    assert.equal(discovery.storefronts[0]?.storefrontId, "sto-foundation-managed-storefront");
  });

  it("resolves storefront registry snapshot from required registries", () => {
    resetInfrastructureCommerceForTests();
    const snapshot = resolveStorefrontRegistrySnapshot(TEST_CONTEXT);
    assert.ok(snapshot.storefronts.length >= 2);
    assert.ok(snapshot.brands.length >= 1);
    assert.ok(snapshot.categories.length >= 1);
    assert.ok(snapshot.policies.length >= 1);
    assert.equal(
      snapshot.registrySource,
      "RegistryLoader:REG-STOREFRONT|REG-BRAND|REG-CATEGORY|REG-COMMERCE-POLICY",
    );
  });

  it("builds storefront adapter contracts with required contract fields", () => {
    resetInfrastructureCommerceForTests();
    const row = resolveStorefrontRegistrySnapshot(TEST_CONTEXT).storefronts[0] as CommerceStorefrontRow;
    const contract = buildStorefrontAdapterContract(row);
    assert.equal(contract.version, "1.0.0");
    assert.ok(contract.publishingCapabilities.length >= 1);
    assert.ok(contract.themeCapabilities.length >= 1);
    assert.ok(contract.collectionCapabilities.length >= 1);
    assert.ok(contract.contentCapabilities.length >= 1);
    assert.equal(contract.brandRef, "brd-foundation-template");
    assert.equal(contract.domainContracts.provisioning.supported, true);
  });

  it("validates storefront integration contracts from registry rows", () => {
    resetInfrastructureCommerceForTests();
    const result = validateStorefrontIntegration(TEST_CONTEXT, "sto-foundation-managed-storefront");
    assert.equal(result.valid, true);
    assert.ok(result.contract);
    assert.equal(result.contract?.authenticationMethod, "oauth2");
    assert.ok(result.contract?.publishingCapabilities.includes("product_publish"));
  });

  it("validates storefront provisioning with brand and category assignment", () => {
    resetInfrastructureCommerceForTests();
    const primary = validateStorefrontProvisioning(TEST_CONTEXT, "sto-foundation-managed-storefront");
    const headless = validateStorefrontProvisioning(TEST_CONTEXT, "sto-foundation-headless-storefront");
    assert.equal(primary.valid, true);
    assert.equal(primary.brandAssigned, true);
    assert.equal(primary.categoryAssigned, true);
    assert.equal(primary.provisioningReady, true);
    assert.equal(headless.provisioningReady, false);
  });

  it("resolves storefront domain capabilities dynamically", () => {
    resetInfrastructureCommerceForTests();
    const primary = resolveAllStorefrontCapabilities(TEST_CONTEXT).find(
      (entry) => entry.storefrontId === "sto-foundation-managed-storefront",
    );
    const headless = resolveAllStorefrontCapabilities(TEST_CONTEXT).find(
      (entry) => entry.storefrontId === "sto-foundation-headless-storefront",
    );
    assert.ok(primary);
    assert.ok(headless);
    assert.equal(primary.registryBacked, true);
    assert.equal(primary.policyCompliant, true);
    assert.ok(primary.resolvedCapabilities.length >= 7);
    assert.ok(headless.resolvedCapabilities.length < primary.resolvedCapabilities.length);
  });

  it("discovers storefront capabilities for Brain through RegistryLoader only", () => {
    resetInfrastructureCommerceForTests();
    const brainCapabilities = discoverStorefrontCapabilitiesForBrain(TEST_CONTEXT);
    assert.ok(brainCapabilities.length >= 2);
    for (const entry of brainCapabilities) {
      assert.equal(entry.discoverySource, "RegistryLoader:REG-STOREFRONT");
      assert.ok(entry.capabilities.length >= 1);
    }
    assert.deepEqual(listStorefrontBrainDomainCapabilities(), [...STOREFRONT_DOMAIN_CAPABILITIES]);
  });

  it("provides storefront capability envelopes to business engines", () => {
    resetInfrastructureCommerceForTests();
    const bindings = listStorefrontEngineBindings();
    assert.ok(bindings.includes("storefront-assembly-engine"));
    assert.ok(bindings.includes("marketplace-infrastructure-engine"));
    assert.ok(bindings.includes("analytics-intelligence-engine"));

    const storefrontEngine = provideStorefrontCapabilityToEngine(
      TEST_CONTEXT,
      "storefront-assembly-engine",
    );
    assert.ok(storefrontEngine.length >= 2);
    assert.equal(storefrontEngine[0]?.discoverySource, "RegistryLoader:storefront-engine-bridge");

    const allEngines = provideStorefrontCapabilityToAllEngines(TEST_CONTEXT);
    assert.ok(allEngines.length >= bindings.length);
  });

  it("enforces storefront integration lifecycle transitions", () => {
    assert.equal(canTransitionStorefrontLifecycle("discover", "validate"), true);
    assert.equal(canTransitionStorefrontLifecycle("discover", "publish"), false);

    const approved = transitionStorefrontLifecycle("discover", {
      storefrontId: "sto-foundation-managed-storefront",
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      pillowGovernance: true,
      targetPhase: "validate",
    });
    assert.equal(approved.allowed, true);
    assert.equal(approved.currentPhase, "validate");
  });

  it("advances storefront lifecycle under Pillow governance", () => {
    resetInfrastructureCommerceForTests();
    const result = advanceStorefrontLifecycle({
      ...TEST_ACTOR,
      storefrontId: "sto-foundation-managed-storefront",
      targetPhase: "validate",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.currentPhase, "validate");
  });

  it("registers storefront plugins through framework host without core changes", () => {
    resetInfrastructureCommerceForTests();
    const host = getStorefrontPluginHost();
    const manifest = {
      pluginId: "g2-test-storefront-plugin",
      pluginName: "G2 Test Storefront Plugin",
      version: "0.1.0",
      storefrontRegistryRowId: "sto-foundation-managed-storefront",
      channelModel: "hosted" as const,
      publishingCapabilities: ["product_publish" as const],
      pillowGovernance: true as const,
      extensions: { adapterProfile: "generic" },
    };
    const result = host.registerPlugin(TEST_ACTOR, manifest);
    assert.equal(result.accepted, true);
    assert.ok(host.listPlugins().some((plugin) => plugin.pluginId === manifest.pluginId));
  });

  it("passes Pillow storefront governance checks", () => {
    resetInfrastructureCommerceForTests();
    const result = validateStorefrontPillowGovernance({
      ...TEST_ACTOR,
      storefrontId: "sto-foundation-managed-storefront",
      operation: "discover",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.provisioningAuthorized, true);
    assert.equal(result.policyCompliant, true);
    assert.equal(result.workspaceIsolated, true);
    assert.equal(result.publishingAuthorized, true);
  });

  it("records storefront EKLS outcomes through Pillow-governed channel", () => {
    resetInfrastructureCommerceForTests();
    assert.deepEqual(listStorefrontEklsOutcomeKinds(), [...STOREFRONT_EKLS_OUTCOME_KINDS]);

    const recorded = recordStorefrontEklsOutcome({
      ...TEST_ACTOR,
      storefrontId: "sto-foundation-managed-storefront",
      kind: "publishing_history",
      signalValue: 12,
      signalUnit: "count",
      summary: "Foundation storefront publishing history outcome",
    });
    assert.equal(recorded.accepted, true);
    assert.ok(recorded.outcomeId);
    assert.equal(recorded.eklsGoverned, true);

    const search = searchStorefrontEklsOutcomes({
      ...TEST_ACTOR,
      storefrontId: "sto-foundation-managed-storefront",
      kind: "publishing_history",
    });
    assert.equal(search.length, 1);
    assert.equal(search[0]?.kind, "publishing_history");
  });

  it("rejects malformed storefront integration configuration", () => {
    assert.throws(
      () =>
        buildStorefrontAdapterContract({
          id: "sto-bad-config",
          name: "Bad Config",
          description: "bad",
          status: "VALIDATED",
          version: "1.0.0",
          owner: "pillow:governance",
          dependencies: [],
          capabilities: ["deploy"],
          configuration: {},
          supportedRegions: ["global"],
          supportedCountries: ["*"],
          validation: { schemaVersion: "g2-01-v1" },
          pluginSupport: { allowPluginRegistration: true },
          workspaceScope: { scope: "global" },
          futureCompatibility: { minSchemaVersion: "g2-01-v1" },
          hostingModel: "managed",
        }),
      StorefrontContractValidationError,
    );
  });

  it("validates foundation storefront contracts without hardcoded business entities", () => {
    resetInfrastructureCommerceForTests();
    const serialized = JSON.stringify(discoverStorefronts(TEST_CONTEXT));
    const forbidden = ["Shopify", "WooCommerce", "BigCommerce", "Magento", "Squarespace", "Wix"];
    for (const token of forbidden) {
      assert.equal(
        serialized.toLowerCase().includes(token.toLowerCase()),
        false,
        `storefront framework must not hardcode business entity token: ${token}`,
      );
    }
    assert.equal(STOREFRONT_INTEGRATION_VERSION, "g2-04-v1");
  });
});
