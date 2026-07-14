import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COMMERCE_COORDINATION_CAPABILITIES,
  COMMERCE_ORCHESTRATION_EKLS_OBSERVATION_KINDS,
  COMMERCE_ORCHESTRATION_LIFECYCLE,
  COMMERCE_ORCHESTRATION_VERSION,
  COMMERCE_PARTICIPATING_COMPONENTS,
  CommerceOrchestrationValidationError,
  advanceCommerceOrchestrationLifecycle,
  buildCommerceOrchestrationContract,
  canTransitionCommerceOrchestrationLifecycle,
  coordinateCommerceEngines,
  discoverCommerceOrchestrationForBrain,
  discoverCommerceOrchestrationProfiles,
  exposeOperationalStateToExecutiveAi,
  getCommerceOrchestrationPluginHost,
  getOrchestrationStateSnapshot,
  listCommerceBrainCoordinationCapabilities,
  listCommerceOrchestrationEklsObservationKinds,
  listCommerceOrchestrationLifecyclePhases,
  listCoordinatedCommerceEngines,
  listExecutiveAiStateConsumers,
  prepareCommerceOrchestration,
  recordCommerceOrchestrationEklsObservation,
  resetInfrastructureCommerceForTests,
  resolveAllCommerceCoordinationCapabilities,
  resolveCommerceOrchestrationRegistrySnapshot,
  searchCommerceOrchestrationEklsObservations,
  transitionCommerceOrchestrationLifecycle,
  validateCommerceOrchestrationPillowGovernance,
  validateCommerceOrchestrationProfile,
  validateOrchestrationRequestGovernance,
} from "../../orchestration/infrastructure-commerce/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const TEST_CONTEXT = { workspaceId: "ws-foundation" } as const;
const TEST_ACTOR = {
  actorId: "grand-king",
  workspaceId: "ws-foundation",
  pillowGovernance: true as const,
  brainRouted: true as const,
};

describe("G2-08 — Commerce Orchestration Layer", () => {
  it("exposes universal commerce orchestration lifecycle phases", () => {
    assert.deepEqual(listCommerceOrchestrationLifecyclePhases(), COMMERCE_ORCHESTRATION_LIFECYCLE);
    assert.equal(COMMERCE_ORCHESTRATION_LIFECYCLE.length, 9);
  });

  it("supports participating commerce components without hardcoded business entities", () => {
    assert.ok(COMMERCE_PARTICIPATING_COMPONENTS.includes("marketplace"));
    assert.ok(COMMERCE_PARTICIPATING_COMPONENTS.includes("supplier"));
    assert.ok(COMMERCE_PARTICIPATING_COMPONENTS.includes("analytics"));
    assert.ok(COMMERCE_COORDINATION_CAPABILITIES.includes("workflow_coordination"));
    assert.ok(COMMERCE_COORDINATION_CAPABILITIES.includes("health_coordination"));
  });

  it("discovers orchestration profiles from registry-backed catalog", () => {
    resetInfrastructureCommerceForTests();
    const discovery = discoverCommerceOrchestrationProfiles(TEST_CONTEXT);
    assert.equal(discovery.discoverySource, "CommerceOrchestrationCatalog:registry-backed");
    assert.ok(discovery.discoveredCount >= 2);
    assert.equal(discovery.profiles[0]?.profileId, "orch-foundation-commerce-primary");
  });

  it("resolves orchestration registry snapshot from six commerce registries", () => {
    resetInfrastructureCommerceForTests();
    const snapshot = resolveCommerceOrchestrationRegistrySnapshot(TEST_CONTEXT);
    assert.ok(snapshot.profiles.length >= 2);
    assert.ok(snapshot.policies.length >= 1);
    assert.ok(snapshot.marketplaces.length >= 2);
    assert.ok(snapshot.suppliers.length >= 2);
    assert.ok(snapshot.storefronts.length >= 2);
    assert.ok(snapshot.payments.length >= 2);
    assert.ok(snapshot.logistics.length >= 2);
    assert.match(snapshot.registrySource, /REG-COMMERCE-POLICY/);
    assert.match(snapshot.registrySource, /REG-MARKETPLACE/);
  });

  it("validates orchestration profiles against registry references", () => {
    resetInfrastructureCommerceForTests();
    const primary = validateCommerceOrchestrationProfile(
      TEST_CONTEXT,
      "orch-foundation-commerce-primary",
    );
    assert.equal(primary.valid, true);
    assert.ok(primary.contract);
    assert.equal(primary.contract?.executionScope, "cross_component");
    assert.ok(primary.contract!.participatingComponents.length >= 5);
  });

  it("resolves commerce coordination capabilities dynamically", () => {
    resetInfrastructureCommerceForTests();
    const primary = resolveAllCommerceCoordinationCapabilities(TEST_CONTEXT).find(
      (entry) => entry.profileId === "orch-foundation-commerce-primary",
    );
    const secondary = resolveAllCommerceCoordinationCapabilities(TEST_CONTEXT).find(
      (entry) => entry.profileId === "orch-foundation-commerce-secondary",
    );
    assert.ok(primary);
    assert.ok(secondary);
    assert.equal(primary.registryBacked, true);
    assert.equal(primary.policyCompliant, true);
    assert.ok(primary.resolvedCapabilities.length >= 8);
    assert.ok(secondary.participatingComponents.length < primary.participatingComponents.length);
  });

  it("discovers orchestration capabilities for Brain with brainRouted flag", () => {
    resetInfrastructureCommerceForTests();
    const brain = discoverCommerceOrchestrationForBrain(TEST_CONTEXT);
    assert.ok(brain.length >= 2);
    for (const entry of brain) {
      assert.equal(entry.discoverySource, "CommerceOrchestrationCatalog:registry-backed");
      assert.equal(entry.brainRouted, true);
      assert.ok(entry.coordinationCapabilities.length >= 1);
    }
    assert.deepEqual(listCommerceBrainCoordinationCapabilities(), [
      ...COMMERCE_COORDINATION_CAPABILITIES,
    ]);
  });

  it("coordinates commerce engines without embedding engine logic", () => {
    resetInfrastructureCommerceForTests();
    const engines = listCoordinatedCommerceEngines();
    assert.ok(engines.includes("marketplace-infrastructure-engine"));
    assert.ok(engines.includes("live-payment-engine"));
    assert.ok(engines.includes("logistics-engine"));

    const envelopes = coordinateCommerceEngines(TEST_CONTEXT, "orch-foundation-commerce-primary");
    assert.ok(envelopes.length >= 5);
    assert.equal(envelopes[0]?.logicEmbedded, false);
    assert.equal(envelopes[0]?.discoverySource, "CommerceOrchestrationCatalog:engine-coordinator");
  });

  it("prepares commerce orchestration with full orchestration request contract", () => {
    resetInfrastructureCommerceForTests();
    const prepared = prepareCommerceOrchestration({
      context: TEST_CONTEXT,
      profileId: "orch-foundation-commerce-primary",
      workspaceId: TEST_ACTOR.workspaceId,
      commerceContext: "foundation-commerce-run",
      actorId: TEST_ACTOR.actorId,
      pillowGovernance: true,
      brainRouted: true,
    });
    assert.equal(prepared.accepted, true);
    assert.ok(prepared.orchestrationId);
    assert.ok(prepared.request);
    assert.equal(prepared.request?.brainRouted, true);
    assert.equal(prepared.request?.pillowGovernance, true);
    assert.ok(prepared.request!.registryReferences.length >= 5);
    assert.ok(prepared.request!.participatingComponents.length >= 5);

    const governance = validateOrchestrationRequestGovernance(
      TEST_CONTEXT,
      prepared.request!,
      "orch-foundation-commerce-primary",
    );
    assert.equal(governance.allowed, true);
  });

  it("manages cross-component orchestration state", () => {
    resetInfrastructureCommerceForTests();
    const prepared = prepareCommerceOrchestration({
      context: TEST_CONTEXT,
      profileId: "orch-foundation-commerce-primary",
      workspaceId: TEST_ACTOR.workspaceId,
      commerceContext: "state-test",
      actorId: TEST_ACTOR.actorId,
      pillowGovernance: true,
      brainRouted: true,
    });
    const snapshot = getOrchestrationStateSnapshot(prepared.orchestrationId!);
    assert.ok(snapshot);
    assert.equal(snapshot?.profileId, "orch-foundation-commerce-primary");
    assert.equal(snapshot?.lifecyclePhase, "prepare");
  });

  it("exposes operational state to Executive AI without executive reasoning", () => {
    resetInfrastructureCommerceForTests();
    const prepared = prepareCommerceOrchestration({
      context: TEST_CONTEXT,
      profileId: "orch-foundation-commerce-primary",
      workspaceId: TEST_ACTOR.workspaceId,
      commerceContext: "executive-state-test",
      actorId: TEST_ACTOR.actorId,
      pillowGovernance: true,
      brainRouted: true,
    });
    assert.ok(listExecutiveAiStateConsumers().includes("executive-intelligence-orchestrator"));

    const envelope = exposeOperationalStateToExecutiveAi({
      context: TEST_CONTEXT,
      consumerId: "product-intelligence-engine",
      profileId: "orch-foundation-commerce-primary",
      orchestrationId: prepared.orchestrationId!,
    });
    assert.ok(envelope);
    assert.equal(envelope?.operationalStateOnly, true);
    assert.equal(envelope?.reasoningEmbedded, false);
  });

  it("enforces commerce orchestration lifecycle transitions", () => {
    assert.equal(canTransitionCommerceOrchestrationLifecycle("discover", "validate"), true);
    assert.equal(canTransitionCommerceOrchestrationLifecycle("discover", "coordinate"), false);

    const denied = transitionCommerceOrchestrationLifecycle("discover", {
      profileId: "orch-foundation-commerce-primary",
      orchestrationId: "orch-test-001",
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      pillowGovernance: true,
      brainRouted: false,
      targetPhase: "validate",
    } as unknown as Parameters<typeof transitionCommerceOrchestrationLifecycle>[1]);
    assert.equal(denied.allowed, false);
    assert.match(denied.reason, /Brain-routed/i);
  });

  it("advances orchestration lifecycle under Pillow governance", () => {
    resetInfrastructureCommerceForTests();
    const prepared = prepareCommerceOrchestration({
      context: TEST_CONTEXT,
      profileId: "orch-foundation-commerce-primary",
      workspaceId: TEST_ACTOR.workspaceId,
      commerceContext: "lifecycle-test",
      actorId: TEST_ACTOR.actorId,
      pillowGovernance: true,
      brainRouted: true,
    });

    const validate = advanceCommerceOrchestrationLifecycle({
      ...TEST_ACTOR,
      profileId: "orch-foundation-commerce-primary",
      orchestrationId: prepared.orchestrationId!,
      targetPhase: "validate",
    });
    assert.equal(validate.allowed, true);
    assert.equal(validate.currentPhase, "validate");
  });

  it("registers orchestration plugins without modifying orchestration core", () => {
    resetInfrastructureCommerceForTests();
    const host = getCommerceOrchestrationPluginHost();
    const result = host.registerPlugin(TEST_ACTOR, {
      pluginId: "g2-test-orchestration-plugin",
      pluginName: "G2 Test Orchestration Plugin",
      version: "0.1.0",
      orchestrationProfileId: "orch-foundation-commerce-primary",
      pluginRole: "health_monitor",
      coordinationCapabilities: ["health_coordination"],
      pillowGovernance: true,
      extensions: { observerProfile: "generic" },
    });
    assert.equal(result.accepted, true);
    assert.ok(host.listPlugins().some((plugin) => plugin.pluginId === "g2-test-orchestration-plugin"));
  });

  it("passes Pillow commerce orchestration governance checks", () => {
    resetInfrastructureCommerceForTests();
    const result = validateCommerceOrchestrationPillowGovernance({
      ...TEST_ACTOR,
      profileId: "orch-foundation-commerce-primary",
      operation: "discover",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.executionAuthorized, true);
    assert.equal(result.policyCompliant, true);
    assert.equal(result.workspaceIsolated, true);
    assert.equal(result.operationalCompliant, true);
    assert.equal(result.eklsGoverned, true);
  });

  it("records commerce orchestration EKLS observations", () => {
    resetInfrastructureCommerceForTests();
    assert.deepEqual(listCommerceOrchestrationEklsObservationKinds(), [
      ...COMMERCE_ORCHESTRATION_EKLS_OBSERVATION_KINDS,
    ]);

    const recorded = recordCommerceOrchestrationEklsObservation({
      ...TEST_ACTOR,
      profileId: "orch-foundation-commerce-primary",
      orchestrationId: "orch-ekls-test-001",
      kind: "operational_coordination",
      signalValue: 1,
      signalUnit: "count",
      summary: "Foundation commerce coordination observation",
      evidenceRef: "evd-orch-foundation-001",
    });
    assert.equal(recorded.accepted, true);
    assert.ok(recorded.observationId);

    const search = searchCommerceOrchestrationEklsObservations({
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      profileId: "orch-foundation-commerce-primary",
      kind: "operational_coordination",
      pillowGovernance: true,
    });
    assert.equal(search.length, 1);
  });

  it("rejects malformed orchestration configuration", () => {
    assert.throws(
      () =>
        buildCommerceOrchestrationContract({
          id: "orch-bad",
          name: "Bad",
          description: "bad",
          status: "VALIDATED",
          version: "1.0.0",
          owner: "pillow:governance",
          dependencies: [],
          capabilities: ["coordinate"],
          configuration: {},
          pluginSupport: { allowPluginRegistration: true },
        }),
      CommerceOrchestrationValidationError,
    );
  });

  it("validates foundation orchestration without hardcoded business entities", () => {
    resetInfrastructureCommerceForTests();
    const serialized = JSON.stringify(discoverCommerceOrchestrationProfiles(TEST_CONTEXT));
    const forbidden = ["Amazon", "Shopify", "Stripe", "FedEx", "Walmart", "Alibaba"];
    for (const token of forbidden) {
      assert.equal(
        serialized.toLowerCase().includes(token.toLowerCase()),
        false,
        `orchestration layer must not hardcode: ${token}`,
      );
    }
    assert.equal(COMMERCE_ORCHESTRATION_VERSION, "g2-08-v1");
  });
});
