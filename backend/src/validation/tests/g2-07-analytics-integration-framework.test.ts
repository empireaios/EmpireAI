import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  ANALYTICS_AGGREGATION_MODES,
  ANALYTICS_CATEGORIES,
  ANALYTICS_DOMAIN_CAPABILITIES,
  ANALYTICS_EKLS_OBSERVATION_KINDS,
  ANALYTICS_INTEGRATION_VERSION,
  ANALYTICS_METRIC_LIFECYCLE,
  AnalyticsContractValidationError,
  advanceAnalyticsLifecycle,
  buildAnalyticsAdapterContract,
  canTransitionAnalyticsLifecycle,
  discoverAnalyticsCapabilitiesForBrain,
  discoverAnalyticsProviders,
  getAnalyticsPluginHost,
  listAnalyticsBrainDomainCapabilities,
  listAnalyticsEklsObservationKinds,
  listAnalyticsEventSourceConsumers,
  listAnalyticsEventSourceEngines,
  listAnalyticsMetricLifecyclePhases,
  listExecutiveAiConsumers,
  provideAnalyticsInputToAllExecutiveAiConsumers,
  provideAnalyticsInputToExecutiveAi,
  receiveOperationalEventFromEngine,
  recordAnalyticsEklsObservation,
  resetInfrastructureCommerceForTests,
  resolveAllAnalyticsCapabilities,
  resolveAnalyticsRegistrySnapshot,
  searchAnalyticsEklsObservations,
  transitionAnalyticsLifecycle,
  validateAnalyticsIntegration,
  validateAnalyticsMetricRef,
  validateAnalyticsPillowGovernance,
} from "../../orchestration/infrastructure-commerce/index.js";
import type { AnalyticsProviderRow } from "../../orchestration/infrastructure-commerce/analytics/contracts/analytics-integration-types.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const TEST_CONTEXT = { workspaceId: "ws-foundation" } as const;
const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: "ws-foundation",
  pillowGovernance: true as const,
};

describe("G2-07 — Analytics Integration Framework", () => {
  it("exposes universal analytics metric lifecycle phases", () => {
    assert.deepEqual(listAnalyticsMetricLifecyclePhases(), ANALYTICS_METRIC_LIFECYCLE);
    assert.equal(ANALYTICS_METRIC_LIFECYCLE.length, 7);
  });

  it("supports analytics categories and aggregation modes without hardcoded KPIs", () => {
    assert.ok(ANALYTICS_CATEGORIES.includes("commerce_metrics"));
    assert.ok(ANALYTICS_CATEGORIES.includes("executive_metrics"));
    assert.ok(ANALYTICS_AGGREGATION_MODES.includes("real_time"));
    assert.ok(ANALYTICS_AGGREGATION_MODES.includes("streaming"));
    assert.ok(ANALYTICS_AGGREGATION_MODES.includes("warehouse"));
    assert.ok(ANALYTICS_AGGREGATION_MODES.includes("future_technology"));
  });

  it("discovers analytics providers from dynamic catalog with registry context", () => {
    resetInfrastructureCommerceForTests();
    const discovery = discoverAnalyticsProviders(TEST_CONTEXT);
    assert.equal(discovery.discoverySource, "AnalyticsProviderCatalog:dynamic");
    assert.ok(discovery.discoveredCount >= 2);
    assert.equal(discovery.providers[0]?.analyticsId, "analytics-foundation-operational-primary");
  });

  it("resolves analytics registry snapshot from required registries", () => {
    resetInfrastructureCommerceForTests();
    const snapshot = resolveAnalyticsRegistrySnapshot(TEST_CONTEXT);
    assert.ok(snapshot.providers.length >= 2);
    assert.ok(snapshot.policies.length >= 1);
    assert.ok(snapshot.countryCommerce.length >= 1);
    assert.equal(
      snapshot.registrySource,
      "REG-COMMERCE-POLICY|REG-COUNTRY-COMMERCE|AnalyticsProviderCatalog:dynamic",
    );
  });

  it("builds analytics adapter contracts with required contract fields", () => {
    resetInfrastructureCommerceForTests();
    const row = resolveAnalyticsRegistrySnapshot(TEST_CONTEXT)
      .providers[0] as AnalyticsProviderRow;
    const contract = buildAnalyticsAdapterContract(row);
    assert.equal(contract.version, "1.0.0");
    assert.ok(contract.supportedMetrics.length >= 1);
    assert.ok(contract.supportedEvents.length >= 1);
    assert.ok(contract.aggregationModes.length >= 1);
    assert.equal(contract.retentionPolicy.retentionDays, 90);
    assert.equal(contract.discoverySource, "AnalyticsProviderCatalog:dynamic");
  });

  it("validates analytics integration contracts from provider rows", () => {
    resetInfrastructureCommerceForTests();
    const result = validateAnalyticsIntegration(
      TEST_CONTEXT,
      "analytics-foundation-operational-primary",
    );
    assert.equal(result.valid, true);
    assert.ok(result.contract);
    assert.ok(result.contract?.aggregationModes.includes("real_time"));
    assert.equal(result.contract?.domainContracts.metric_collection.supported, true);
  });

  it("validates analytics metric refs without executive reasoning", () => {
    resetInfrastructureCommerceForTests();
    const contract = buildAnalyticsAdapterContract(
      resolveAnalyticsRegistrySnapshot(TEST_CONTEXT).providers[0] as AnalyticsProviderRow,
    );
    const valid = validateAnalyticsMetricRef(
      contract,
      "mtr-foundation-commerce-ops",
      "commerce_metrics",
    );
    const invalid = validateAnalyticsMetricRef(contract, "mtr-unknown", "commerce_metrics");
    assert.equal(valid.valid, true);
    assert.equal(invalid.valid, false);
    assert.match(valid.reason, /no executive reasoning/i);
  });

  it("resolves analytics domain capabilities dynamically", () => {
    resetInfrastructureCommerceForTests();
    const primary = resolveAllAnalyticsCapabilities(TEST_CONTEXT).find(
      (entry) => entry.analyticsId === "analytics-foundation-operational-primary",
    );
    const executive = resolveAllAnalyticsCapabilities(TEST_CONTEXT).find(
      (entry) => entry.analyticsId === "analytics-foundation-executive-secondary",
    );
    assert.ok(primary);
    assert.ok(executive);
    assert.equal(primary.registryBacked, true);
    assert.equal(primary.policyCompliant, true);
    assert.ok(primary.resolvedCapabilities.length >= 6);
    assert.ok(executive.resolvedCapabilities.includes("executive_metric_publication"));
    assert.ok(executive.resolvedCapabilities.length < primary.resolvedCapabilities.length);
  });

  it("discovers analytics capabilities for Brain through dynamic catalog only", () => {
    resetInfrastructureCommerceForTests();
    const brainCapabilities = discoverAnalyticsCapabilitiesForBrain(TEST_CONTEXT);
    assert.ok(brainCapabilities.length >= 2);
    for (const entry of brainCapabilities) {
      assert.equal(entry.discoverySource, "AnalyticsProviderCatalog:dynamic");
      assert.ok(entry.capabilities.length >= 1);
      assert.ok(entry.categories.length >= 1);
    }
    assert.deepEqual(listAnalyticsBrainDomainCapabilities(), [...ANALYTICS_DOMAIN_CAPABILITIES]);
  });

  it("provides data-only analytics inputs to Executive AI consumers", () => {
    resetInfrastructureCommerceForTests();
    const consumers = listExecutiveAiConsumers();
    assert.ok(consumers.includes("product-intelligence-engine"));
    assert.ok(consumers.includes("executive-intelligence-orchestrator"));

    const productIntel = provideAnalyticsInputToExecutiveAi(
      TEST_CONTEXT,
      "product-intelligence-engine",
    );
    assert.ok(productIntel.length >= 2);
    assert.equal(productIntel[0]?.dataOnly, true);
    assert.equal(productIntel[0]?.discoverySource, "AnalyticsProviderCatalog:executive-ai-bridge");
    assert.ok(productIntel[0]?.metricRefs.length >= 1);

    const allConsumers = provideAnalyticsInputToAllExecutiveAiConsumers(TEST_CONTEXT);
    assert.ok(allConsumers.length >= consumers.length);
  });

  it("receives operational events from business engines without embedding business logic", () => {
    resetInfrastructureCommerceForTests();
    const engines = listAnalyticsEventSourceEngines();
    assert.ok(engines.includes("marketplace-infrastructure-engine"));
    assert.ok(engines.includes("live-payment-engine"));
    assert.ok(listAnalyticsEventSourceConsumers().includes("business-automation"));

    const events = receiveOperationalEventFromEngine({
      context: TEST_CONTEXT,
      sourceEngineId: "marketplace-infrastructure-engine",
      eventRef: "evt-foundation-marketplace-signal",
    });
    assert.ok(events.length >= 1);
    assert.equal(events[0]?.category, "marketplace_metrics");
    assert.equal(events[0]?.discoverySource, "AnalyticsProviderCatalog:engine-event-bridge");
  });

  it("enforces analytics metric lifecycle transitions", () => {
    assert.equal(canTransitionAnalyticsLifecycle("capture", "validate"), true);
    assert.equal(canTransitionAnalyticsLifecycle("capture", "publish"), false);

    const approved = transitionAnalyticsLifecycle("capture", {
      analyticsId: "analytics-foundation-operational-primary",
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      pillowGovernance: true,
      targetPhase: "validate",
    });
    assert.equal(approved.allowed, true);
    assert.equal(approved.currentPhase, "validate");
  });

  it("advances analytics lifecycle under Pillow governance", () => {
    resetInfrastructureCommerceForTests();
    const result = advanceAnalyticsLifecycle({
      ...TEST_ACTOR,
      analyticsId: "analytics-foundation-operational-primary",
      targetPhase: "validate",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.currentPhase, "validate");
  });

  it("registers analytics plugins through framework host without core changes", () => {
    resetInfrastructureCommerceForTests();
    const host = getAnalyticsPluginHost();
    const manifest = {
      pluginId: "g2-test-analytics-plugin",
      pluginName: "G2 Test Analytics Plugin",
      version: "0.1.0",
      analyticsProviderRowId: "analytics-foundation-operational-primary",
      aggregationModes: ["batch" as const],
      supportedMetrics: [
        { metricRef: "mtr-plugin-test", category: "operational_metrics" as const, supported: true },
      ],
      pillowGovernance: true as const,
      extensions: { adapterProfile: "generic" },
    };
    const result = host.registerPlugin(TEST_ACTOR, manifest);
    assert.equal(result.accepted, true);
    assert.ok(host.listPlugins().some((plugin) => plugin.pluginId === manifest.pluginId));
    assert.ok(
      discoverAnalyticsProviders(TEST_CONTEXT).discoveredCount >= 3,
      "plugin registration adds dynamic analytics provider",
    );
  });

  it("passes Pillow analytics governance checks", () => {
    resetInfrastructureCommerceForTests();
    const result = validateAnalyticsPillowGovernance({
      ...TEST_ACTOR,
      analyticsId: "analytics-foundation-operational-primary",
      operation: "discover",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.metricIntegrityVerified, true);
    assert.equal(result.policyCompliant, true);
    assert.equal(result.workspaceIsolated, true);
    assert.equal(result.retentionCompliant, true);
    assert.equal(result.eklsGoverned, true);
  });

  it("records analytics EKLS observations through Pillow-governed channel", () => {
    resetInfrastructureCommerceForTests();
    assert.deepEqual(listAnalyticsEklsObservationKinds(), [...ANALYTICS_EKLS_OBSERVATION_KINDS]);

    const recorded = recordAnalyticsEklsObservation({
      ...TEST_ACTOR,
      analyticsId: "analytics-foundation-operational-primary",
      kind: "operational_trend",
      signalValue: 0.88,
      signalUnit: "ratio",
      summary: "Foundation operational trend observation",
      evidenceRef: "evd-foundation-analytics-001",
    });
    assert.equal(recorded.accepted, true);
    assert.ok(recorded.observationId);
    assert.equal(recorded.eklsGoverned, true);

    const search = searchAnalyticsEklsObservations({
      ...TEST_ACTOR,
      analyticsId: "analytics-foundation-operational-primary",
      kind: "operational_trend",
    });
    assert.equal(search.length, 1);
    assert.equal(search[0]?.kind, "operational_trend");
  });

  it("rejects malformed analytics integration configuration", () => {
    assert.throws(
      () =>
        buildAnalyticsAdapterContract({
          id: "analytics-bad-config",
          name: "Bad Config",
          description: "bad",
          status: "VALIDATED",
          version: "1.0.0",
          owner: "pillow:governance",
          dependencies: [],
          capabilities: ["collect"],
          configuration: {},
          supportedRegions: ["global"],
          supportedCountries: ["*"],
          pluginSupport: { allowPluginRegistration: true },
        }),
      AnalyticsContractValidationError,
    );
  });

  it("validates foundation analytics contracts without hardcoded business entities", () => {
    resetInfrastructureCommerceForTests();
    const serialized = JSON.stringify(discoverAnalyticsProviders(TEST_CONTEXT));
    const forbidden = ["Google Analytics", "Mixpanel", "Amplitude", "Segment", "Looker", "Tableau"];
    for (const token of forbidden) {
      assert.equal(
        serialized.toLowerCase().includes(token.toLowerCase()),
        false,
        `analytics framework must not hardcode business entity token: ${token}`,
      );
    }
    assert.equal(ANALYTICS_INTEGRATION_VERSION, "g2-07-v1");
  });
});
