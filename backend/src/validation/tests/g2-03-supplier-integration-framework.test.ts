import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  SUPPLIER_API_PROTOCOLS,
  SUPPLIER_DOMAIN_CAPABILITIES,
  SUPPLIER_EKLS_OBSERVATION_KINDS,
  SUPPLIER_FULFILMENT_MODES,
  SUPPLIER_INTEGRATION_LIFECYCLE,
  SUPPLIER_INTEGRATION_VERSION,
  SupplierContractValidationError,
  advanceSupplierLifecycle,
  buildSupplierAdapterContract,
  canTransitionSupplierLifecycle,
  discoverSupplierCapabilitiesForBrain,
  discoverSuppliers,
  getSupplierPluginHost,
  listSupplierBrainDomainCapabilities,
  listSupplierEklsObservationKinds,
  listSupplierEngineBindings,
  listSupplierIntegrationLifecyclePhases,
  provideSupplierCapabilityToAllEngines,
  provideSupplierCapabilityToEngine,
  recordSupplierEklsObservation,
  resetInfrastructureCommerceForTests,
  resolveAllSupplierCapabilities,
  resolveSupplierRegistrySnapshot,
  searchSupplierEklsObservations,
  transitionSupplierLifecycle,
  validateSupplierIntegration,
  validateSupplierPillowGovernance,
} from "../../orchestration/infrastructure-commerce/index.js";
import type { CommerceSupplierRow } from "../../registry/types/commerce-registry-types.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const TEST_CONTEXT = { workspaceId: "ws-foundation" } as const;
const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: "ws-foundation",
  pillowGovernance: true as const,
};

describe("G2-03 — Supplier Integration Framework", () => {
  it("exposes universal supplier integration lifecycle phases", () => {
    assert.deepEqual(listSupplierIntegrationLifecyclePhases(), SUPPLIER_INTEGRATION_LIFECYCLE);
    assert.equal(SUPPLIER_INTEGRATION_LIFECYCLE.length, 12);
  });

  it("supports future supplier categories without hardcoded supplier behaviour", () => {
    assert.ok(SUPPLIER_FULFILMENT_MODES.includes("dropship"));
    assert.ok(SUPPLIER_FULFILMENT_MODES.includes("wholesale"));
    assert.ok(SUPPLIER_FULFILMENT_MODES.includes("manufacturer"));
    assert.ok(SUPPLIER_FULFILMENT_MODES.includes("print_on_demand"));
    assert.ok(SUPPLIER_FULFILMENT_MODES.includes("warehouse"));
    assert.ok(SUPPLIER_FULFILMENT_MODES.includes("3pl"));
    assert.ok(SUPPLIER_FULFILMENT_MODES.includes("private"));
    assert.ok(SUPPLIER_FULFILMENT_MODES.includes("future_category"));
    assert.ok(SUPPLIER_API_PROTOCOLS.includes("rest"));
    assert.ok(SUPPLIER_API_PROTOCOLS.includes("graphql"));
    assert.ok(SUPPLIER_API_PROTOCOLS.includes("event_driven"));
  });

  it("discovers suppliers from REG-SUPPLIER via registry integration", () => {
    resetInfrastructureCommerceForTests();
    const discovery = discoverSuppliers(TEST_CONTEXT);
    assert.equal(discovery.discoverySource, "RegistryLoader:REG-SUPPLIER");
    assert.ok(discovery.discoveredCount >= 2);
    assert.equal(discovery.suppliers[0]?.supplierId, "sup-foundation-primary-fulfillment");
  });

  it("resolves supplier registry snapshot from required registries", () => {
    resetInfrastructureCommerceForTests();
    const snapshot = resolveSupplierRegistrySnapshot(TEST_CONTEXT);
    assert.ok(snapshot.suppliers.length >= 2);
    assert.ok(snapshot.productSources.length >= 1);
    assert.ok(snapshot.policies.length >= 1);
    assert.ok(snapshot.countryCommerce.length >= 1);
    assert.equal(
      snapshot.registrySource,
      "RegistryLoader:REG-SUPPLIER|REG-PRODUCT-SOURCE|REG-COMMERCE-POLICY|REG-COUNTRY-COMMERCE",
    );
  });

  it("builds supplier adapter contracts with required contract fields", () => {
    resetInfrastructureCommerceForTests();
    const row = resolveSupplierRegistrySnapshot(TEST_CONTEXT).suppliers[0] as CommerceSupplierRow;
    const contract = buildSupplierAdapterContract(row, ["psrc-foundation-channel-source"]);
    assert.equal(contract.version, "1.0.0");
    assert.ok(contract.fulfilmentModes.length >= 1);
    assert.ok(contract.inventoryFeatures.length >= 1);
    assert.ok(contract.trackingFeatures.length >= 1);
    assert.ok(contract.productSourceRefs.includes("psrc-foundation-channel-source"));
    assert.equal(contract.domainContracts.authentication.supported, true);
  });

  it("validates supplier integration contracts from registry rows", () => {
    resetInfrastructureCommerceForTests();
    const result = validateSupplierIntegration(TEST_CONTEXT, "sup-foundation-primary-fulfillment");
    assert.equal(result.valid, true);
    assert.ok(result.contract);
    assert.equal(result.contract?.authenticationMethod, "api_key");
    assert.equal(result.contract?.apiSpecification.protocol, "rest");
  });

  it("resolves supplier domain capabilities dynamically", () => {
    resetInfrastructureCommerceForTests();
    const primary = resolveAllSupplierCapabilities(TEST_CONTEXT).find(
      (entry) => entry.supplierId === "sup-foundation-primary-fulfillment",
    );
    const secondary = resolveAllSupplierCapabilities(TEST_CONTEXT).find(
      (entry) => entry.supplierId === "sup-foundation-secondary-wholesale",
    );
    assert.ok(primary);
    assert.ok(secondary);
    assert.equal(primary.registryBacked, true);
    assert.equal(primary.policyCompliant, true);
    assert.ok(primary.resolvedCapabilities.length >= 7);
    assert.ok(secondary.resolvedCapabilities.length < primary.resolvedCapabilities.length);
  });

  it("discovers supplier capabilities for Brain through RegistryLoader only", () => {
    resetInfrastructureCommerceForTests();
    const brainCapabilities = discoverSupplierCapabilitiesForBrain(TEST_CONTEXT);
    assert.ok(brainCapabilities.length >= 2);
    for (const entry of brainCapabilities) {
      assert.equal(entry.discoverySource, "RegistryLoader:REG-SUPPLIER");
      assert.ok(entry.capabilities.length >= 1);
    }
    assert.deepEqual(listSupplierBrainDomainCapabilities(), [...SUPPLIER_DOMAIN_CAPABILITIES]);
  });

  it("provides supplier capability envelopes to business engines", () => {
    resetInfrastructureCommerceForTests();
    const bindings = listSupplierEngineBindings();
    assert.ok(bindings.includes("supplier-intelligence-engine"));
    assert.ok(bindings.includes("marketplace-infrastructure-engine"));
    assert.ok(bindings.includes("order-execution-bridge"));

    const supplierEngine = provideSupplierCapabilityToEngine(
      TEST_CONTEXT,
      "supplier-intelligence-engine",
    );
    assert.ok(supplierEngine.length >= 2);
    assert.equal(supplierEngine[0]?.discoverySource, "RegistryLoader:supplier-engine-bridge");

    const allEngines = provideSupplierCapabilityToAllEngines(TEST_CONTEXT);
    assert.ok(allEngines.length >= bindings.length);
  });

  it("enforces supplier integration lifecycle transitions", () => {
    assert.equal(canTransitionSupplierLifecycle("discover", "validate"), true);
    assert.equal(canTransitionSupplierLifecycle("discover", "submit_order"), false);

    const approved = transitionSupplierLifecycle("discover", {
      supplierId: "sup-foundation-primary-fulfillment",
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      pillowGovernance: true,
      targetPhase: "validate",
    });
    assert.equal(approved.allowed, true);
    assert.equal(approved.currentPhase, "validate");
  });

  it("advances supplier lifecycle under Pillow governance", () => {
    resetInfrastructureCommerceForTests();
    const result = advanceSupplierLifecycle({
      ...TEST_ACTOR,
      supplierId: "sup-foundation-primary-fulfillment",
      targetPhase: "validate",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.currentPhase, "validate");
  });

  it("registers supplier plugins through framework host without core changes", () => {
    resetInfrastructureCommerceForTests();
    const host = getSupplierPluginHost();
    const manifest = {
      pluginId: "g2-test-supplier-plugin",
      pluginName: "G2 Test Supplier Plugin",
      version: "0.1.0",
      supplierRegistryRowId: "sup-foundation-primary-fulfillment",
      supportedProtocols: ["rest" as const],
      supportedFeatures: ["health_probe" as const],
      pillowGovernance: true as const,
      extensions: { adapterProfile: "generic" },
    };
    const result = host.registerPlugin(TEST_ACTOR, manifest);
    assert.equal(result.accepted, true);
    assert.ok(host.listPlugins().some((plugin) => plugin.pluginId === manifest.pluginId));
  });

  it("passes Pillow supplier governance checks", () => {
    resetInfrastructureCommerceForTests();
    const result = validateSupplierPillowGovernance({
      ...TEST_ACTOR,
      supplierId: "sup-foundation-primary-fulfillment",
      operation: "discover",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.trustVerified, true);
    assert.equal(result.policyCompliant, true);
    assert.equal(result.workspaceIsolated, true);
    assert.equal(result.healthGoverned, true);
  });

  it("records supplier EKLS observations through Pillow-governed channel", () => {
    resetInfrastructureCommerceForTests();
    assert.deepEqual(listSupplierEklsObservationKinds(), [...SUPPLIER_EKLS_OBSERVATION_KINDS]);

    const recorded = recordSupplierEklsObservation({
      ...TEST_ACTOR,
      supplierId: "sup-foundation-primary-fulfillment",
      kind: "supplier_reliability",
      signalValue: 0.92,
      signalUnit: "score",
      summary: "Foundation supplier reliability observation",
    });
    assert.equal(recorded.accepted, true);
    assert.ok(recorded.observationId);
    assert.equal(recorded.eklsGoverned, true);

    const search = searchSupplierEklsObservations({
      ...TEST_ACTOR,
      supplierId: "sup-foundation-primary-fulfillment",
      kind: "supplier_reliability",
    });
    assert.equal(search.length, 1);
    assert.equal(search[0]?.kind, "supplier_reliability");
  });

  it("rejects malformed supplier integration configuration", () => {
    assert.throws(
      () =>
        buildSupplierAdapterContract({
          id: "sup-bad-config",
          name: "Bad Config",
          description: "bad",
          status: "VALIDATED",
          version: "1.0.0",
          owner: "pillow:governance",
          dependencies: [],
          capabilities: ["catalog-sync"],
          configuration: {},
          supportedRegions: ["global"],
          supportedCountries: ["*"],
          validation: { schemaVersion: "g2-01-v1" },
          pluginSupport: { allowPluginRegistration: true },
          workspaceScope: { scope: "global" },
          futureCompatibility: { minSchemaVersion: "g2-01-v1" },
          fulfillmentModel: "dropship",
        }),
      SupplierContractValidationError,
    );
  });

  it("validates foundation supplier contracts without hardcoded business entities", () => {
    resetInfrastructureCommerceForTests();
    const serialized = JSON.stringify(discoverSuppliers(TEST_CONTEXT));
    const forbidden = ["CJ", "AliExpress", "Spocket", "Printful", "Oberlo", "Amazon", "Walmart"];
    for (const token of forbidden) {
      assert.equal(
        serialized.toLowerCase().includes(token.toLowerCase()),
        false,
        `supplier framework must not hardcode business entity token: ${token}`,
      );
    }
    assert.equal(SUPPLIER_INTEGRATION_VERSION, "g2-03-v1");
  });
});
