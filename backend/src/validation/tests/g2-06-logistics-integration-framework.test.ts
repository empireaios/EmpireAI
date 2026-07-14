import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  LOGISTICS_DOMAIN_CAPABILITIES,
  LOGISTICS_EKLS_OBSERVATION_KINDS,
  LOGISTICS_PROVIDER_KINDS,
  LOGISTICS_SHIPMENT_LIFECYCLE,
  LOGISTICS_INTEGRATION_VERSION,
  LogisticsContractValidationError,
  advanceLogisticsLifecycle,
  buildLogisticsAdapterContract,
  canTransitionLogisticsLifecycle,
  discoverLogisticsCapabilitiesForBrain,
  discoverLogisticsProviders,
  getLogisticsPluginHost,
  listLogisticsBrainDomainCapabilities,
  listLogisticsConsumerBindings,
  listLogisticsEklsObservationKinds,
  listLogisticsEngineBindings,
  listLogisticsShipmentLifecyclePhases,
  provideLogisticsCapabilityToAllConsumers,
  provideLogisticsCapabilityToConsumer,
  recordLogisticsEklsObservation,
  resetInfrastructureCommerceForTests,
  resolveAllLogisticsCapabilities,
  resolveLogisticsRegistrySnapshot,
  searchLogisticsEklsObservations,
  transitionLogisticsLifecycle,
  validateLogisticsIntegration,
  validateLogisticsPillowGovernance,
} from "../../orchestration/infrastructure-commerce/index.js";
import type { CommerceLogisticsRow } from "../../registry/types/commerce-registry-types.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const TEST_CONTEXT = { workspaceId: "ws-foundation" } as const;
const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: "ws-foundation",
  pillowGovernance: true as const,
};

describe("G2-06 — Logistics Integration Framework", () => {
  it("exposes universal logistics shipment lifecycle phases", () => {
    assert.deepEqual(listLogisticsShipmentLifecyclePhases(), LOGISTICS_SHIPMENT_LIFECYCLE);
    assert.equal(LOGISTICS_SHIPMENT_LIFECYCLE.length, 10);
  });

  it("supports future logistics provider kinds without hardcoded carrier names", () => {
    assert.ok(LOGISTICS_PROVIDER_KINDS.includes("postal"));
    assert.ok(LOGISTICS_PROVIDER_KINDS.includes("courier"));
    assert.ok(LOGISTICS_PROVIDER_KINDS.includes("freight"));
    assert.ok(LOGISTICS_PROVIDER_KINDS.includes("warehouse"));
    assert.ok(LOGISTICS_PROVIDER_KINDS.includes("3pl"));
    assert.ok(LOGISTICS_PROVIDER_KINDS.includes("cross_border"));
    assert.ok(LOGISTICS_PROVIDER_KINDS.includes("future_fulfilment"));
  });

  it("discovers logistics providers from REG-LOGISTICS via registry integration", () => {
    resetInfrastructureCommerceForTests();
    const discovery = discoverLogisticsProviders(TEST_CONTEXT);
    assert.equal(discovery.discoverySource, "RegistryLoader:REG-LOGISTICS");
    assert.ok(discovery.discoveredCount >= 2);
    assert.equal(discovery.providers[0]?.providerId, "log-foundation-carrier-primary");
  });

  it("resolves logistics registry snapshot from required registries", () => {
    resetInfrastructureCommerceForTests();
    const snapshot = resolveLogisticsRegistrySnapshot(TEST_CONTEXT);
    assert.ok(snapshot.logistics.length >= 2);
    assert.ok(snapshot.policies.length >= 1);
    assert.ok(snapshot.countryCommerce.length >= 1);
    assert.equal(
      snapshot.registrySource,
      "RegistryLoader:REG-LOGISTICS|REG-COUNTRY-COMMERCE|REG-COMMERCE-POLICY",
    );
  });

  it("builds logistics adapter contracts with required contract fields", () => {
    resetInfrastructureCommerceForTests();
    const row = resolveLogisticsRegistrySnapshot(TEST_CONTEXT).logistics[0] as CommerceLogisticsRow;
    const contract = buildLogisticsAdapterContract(row);
    assert.equal(contract.version, "1.0.0");
    assert.ok(contract.shippingServices.length >= 1);
    assert.ok(contract.trackingServices.length >= 1);
    assert.equal(contract.providerKind, "courier");
    assert.equal(contract.domainContracts.tracking.supported, true);
    assert.equal(contract.discoverySource, "RegistryLoader:REG-LOGISTICS");
  });

  it("validates logistics integration contracts from registry rows", () => {
    resetInfrastructureCommerceForTests();
    const result = validateLogisticsIntegration(TEST_CONTEXT, "log-foundation-carrier-primary");
    assert.equal(result.valid, true);
    assert.ok(result.contract);
    assert.equal(result.contract?.authenticationMethod, "oauth2");
    assert.ok(result.contract?.shippingServices.some((service) => service.supported));
  });

  it("resolves logistics domain capabilities dynamically", () => {
    resetInfrastructureCommerceForTests();
    const primary = resolveAllLogisticsCapabilities(TEST_CONTEXT).find(
      (entry) => entry.providerId === "log-foundation-carrier-primary",
    );
    const secondary = resolveAllLogisticsCapabilities(TEST_CONTEXT).find(
      (entry) => entry.providerId === "log-foundation-warehouse-secondary",
    );
    assert.ok(primary);
    assert.ok(secondary);
    assert.equal(primary.registryBacked, true);
    assert.equal(primary.policyCompliant, true);
    assert.ok(primary.resolvedCapabilities.length >= 6);
    assert.ok(secondary.resolvedCapabilities.length < primary.resolvedCapabilities.length);
    assert.ok(secondary.resolvedCapabilities.includes("warehouse"));
  });

  it("discovers logistics capabilities for Brain through RegistryLoader only", () => {
    resetInfrastructureCommerceForTests();
    const brainCapabilities = discoverLogisticsCapabilitiesForBrain(TEST_CONTEXT);
    assert.ok(brainCapabilities.length >= 2);
    for (const entry of brainCapabilities) {
      assert.equal(entry.discoverySource, "RegistryLoader:REG-LOGISTICS");
      assert.ok(entry.capabilities.length >= 1);
      assert.ok(entry.shippingServices.length >= 1);
    }
    assert.deepEqual(listLogisticsBrainDomainCapabilities(), [...LOGISTICS_DOMAIN_CAPABILITIES]);
  });

  it("provides logistics capability envelopes to business engines and automation", () => {
    resetInfrastructureCommerceForTests();
    const bindings = listLogisticsEngineBindings();
    assert.ok(bindings.includes("marketplace-infrastructure-engine"));
    assert.ok(bindings.includes("supplier-intelligence-engine"));
    assert.ok(bindings.includes("storefront-assembly-engine"));
    assert.ok(bindings.includes("analytics-intelligence-engine"));
    assert.ok(listLogisticsConsumerBindings().includes("logistics-engine"));
    assert.ok(listLogisticsConsumerBindings().includes("business-automation"));

    const logisticsEngine = provideLogisticsCapabilityToConsumer(TEST_CONTEXT, "logistics-engine");
    assert.ok(logisticsEngine.length >= 2);
    assert.equal(logisticsEngine[0]?.discoverySource, "RegistryLoader:logistics-engine-bridge");

    const automation = provideLogisticsCapabilityToConsumer(TEST_CONTEXT, "business-automation");
    assert.ok(automation.length >= 2);

    const allConsumers = provideLogisticsCapabilityToAllConsumers(TEST_CONTEXT);
    assert.ok(allConsumers.length >= bindings.length + 2);
  });

  it("enforces logistics shipment lifecycle transitions", () => {
    assert.equal(canTransitionLogisticsLifecycle("discover", "validate"), true);
    assert.equal(canTransitionLogisticsLifecycle("discover", "create_shipment"), false);

    const approved = transitionLogisticsLifecycle("discover", {
      providerId: "log-foundation-carrier-primary",
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      pillowGovernance: true,
      targetPhase: "validate",
    });
    assert.equal(approved.allowed, true);
    assert.equal(approved.currentPhase, "validate");
  });

  it("advances logistics lifecycle under Pillow governance", () => {
    resetInfrastructureCommerceForTests();
    const result = advanceLogisticsLifecycle({
      ...TEST_ACTOR,
      providerId: "log-foundation-carrier-primary",
      targetPhase: "validate",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.currentPhase, "validate");
  });

  it("registers logistics plugins through framework host without core changes", () => {
    resetInfrastructureCommerceForTests();
    const host = getLogisticsPluginHost();
    const manifest = {
      pluginId: "g2-test-logistics-plugin",
      pluginName: "G2 Test Logistics Plugin",
      version: "0.1.0",
      logisticsRegistryRowId: "log-foundation-carrier-primary",
      providerKind: "courier" as const,
      shippingServices: [{ serviceId: "ship-test", serviceKind: "courier" as const, supported: true }],
      pillowGovernance: true as const,
      extensions: { adapterProfile: "generic" },
    };
    const result = host.registerPlugin(TEST_ACTOR, manifest);
    assert.equal(result.accepted, true);
    assert.ok(host.listPlugins().some((plugin) => plugin.pluginId === manifest.pluginId));
  });

  it("passes Pillow logistics governance checks", () => {
    resetInfrastructureCommerceForTests();
    const result = validateLogisticsPillowGovernance({
      ...TEST_ACTOR,
      providerId: "log-foundation-carrier-primary",
      operation: "discover",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.trustVerified, true);
    assert.equal(result.policyCompliant, true);
    assert.equal(result.workspaceIsolated, true);
    assert.equal(result.shippingAuthorized, true);
    assert.equal(result.eklsGoverned, true);
  });

  it("records logistics EKLS observations through Pillow-governed channel", () => {
    resetInfrastructureCommerceForTests();
    assert.deepEqual(listLogisticsEklsObservationKinds(), [...LOGISTICS_EKLS_OBSERVATION_KINDS]);

    const recorded = recordLogisticsEklsObservation({
      ...TEST_ACTOR,
      providerId: "log-foundation-carrier-primary",
      kind: "carrier_performance",
      signalValue: 0.95,
      signalUnit: "ratio",
      summary: "Foundation carrier performance observation",
    });
    assert.equal(recorded.accepted, true);
    assert.ok(recorded.observationId);
    assert.equal(recorded.eklsGoverned, true);

    const search = searchLogisticsEklsObservations({
      ...TEST_ACTOR,
      providerId: "log-foundation-carrier-primary",
      kind: "carrier_performance",
    });
    assert.equal(search.length, 1);
    assert.equal(search[0]?.kind, "carrier_performance");
  });

  it("rejects malformed logistics integration configuration", () => {
    assert.throws(
      () =>
        buildLogisticsAdapterContract({
          id: "log-bad-config",
          name: "Bad Config",
          description: "bad",
          status: "VALIDATED",
          version: "1.0.0",
          owner: "pillow:governance",
          dependencies: [],
          capabilities: ["tracking"],
          configuration: {},
          supportedRegions: ["global"],
          supportedCountries: ["*"],
          validation: { schemaVersion: "g2-01-v1" },
          pluginSupport: { allowPluginRegistration: true },
          workspaceScope: { scope: "global" },
          futureCompatibility: { minSchemaVersion: "g2-01-v1" },
          logisticsKind: "carrier",
        }),
      LogisticsContractValidationError,
    );
  });

  it("validates foundation logistics contracts without hardcoded business entities", () => {
    resetInfrastructureCommerceForTests();
    const serialized = JSON.stringify(discoverLogisticsProviders(TEST_CONTEXT));
    const forbidden = ["FedEx", "UPS", "DHL", "USPS", "Royal Mail", "SF Express"];
    for (const token of forbidden) {
      assert.equal(
        serialized.toLowerCase().includes(token.toLowerCase()),
        false,
        `logistics framework must not hardcode business entity token: ${token}`,
      );
    }
    assert.equal(LOGISTICS_INTEGRATION_VERSION, "g2-06-v1");
  });
});
