import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  COMMERCE_PLUGIN_CATEGORIES,
  COMMERCE_PLUGIN_EKLS_OBSERVATION_KINDS,
  COMMERCE_PLUGIN_INTEGRATION_VERSION,
  COMMERCE_PLUGIN_LIFECYCLE,
  COMMERCE_PLUGIN_FRAMEWORK_SOURCE,
  advanceCommercePluginLifecycle,
  canTransitionCommercePluginLifecycle,
  discoverCommercePluginCapabilitiesForBrain,
  discoverCommercePluginSlots,
  dispatchValidatedCommercePluginCapability,
  getCommercePluginHealthSnapshot,
  listCommercePluginBrainCategories,
  listCommercePluginEklsObservationKinds,
  listCommercePluginEngineBindings,
  listCommercePluginLifecyclePhases,
  listCommercePluginRecords,
  listCommercePluginsFromFramework,
  provideCommercePluginExtensionsToEngine,
  recordCommercePluginEklsObservation,
  registerCommercePlugin,
  resetInfrastructureCommerceForTests,
  resolveAllCommercePluginCapabilities,
  resolveCommercePluginRegistrySnapshot,
  searchCommercePluginEklsObservations,
  transitionCommercePluginLifecycle,
  validateCommercePluginCompatibility,
  validateCommercePluginPillowGovernance,
  validateCommercePluginSlot,
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

const TEST_MANIFEST = {
  pluginId: "cplugin-test-foundation-marketplace",
  pluginName: "Foundation Test Marketplace Plugin",
  pluginVersion: "1.0.0",
  pluginOwner: "internal:foundation",
  category: "marketplace_plugins" as const,
  slotId: "cplugin-slot-foundation-marketplace",
  supportedCapabilities: ["connection", "publish-route"],
  provenance: "internal" as const,
  pillowGovernance: true as const,
  brainRouted: true as const,
  extensions: { testHarness: true },
};

describe("G2-09 — Commerce Plugin Integration", () => {
  it("exposes universal commerce plugin lifecycle phases", () => {
    assert.deepEqual(listCommercePluginLifecyclePhases(), COMMERCE_PLUGIN_LIFECYCLE);
    assert.equal(COMMERCE_PLUGIN_LIFECYCLE.length, 11);
  });

  it("supports ten commerce plugin categories without hardcoded providers", () => {
    assert.equal(COMMERCE_PLUGIN_CATEGORIES.length, 10);
    assert.ok(COMMERCE_PLUGIN_CATEGORIES.includes("marketplace_plugins"));
    assert.ok(COMMERCE_PLUGIN_CATEGORIES.includes("future_commerce_plugins"));
    assert.deepEqual(listCommercePluginBrainCategories(), [...COMMERCE_PLUGIN_CATEGORIES]);
  });

  it("discovers plugin slots from registry-backed catalog", () => {
    resetInfrastructureCommerceForTests();
    const discovery = discoverCommercePluginSlots(TEST_CONTEXT);
    assert.equal(discovery.discoverySource, "EmpireAIPluginFramework:commerce-plugin-integration");
    assert.equal(discovery.discoveredCount, 10);
    assert.equal(discovery.slots[0]?.id, "cplugin-slot-foundation-marketplace");
    assert.equal(discovery.plugins[0]?.status, "draft");
  });

  it("resolves plugin registry snapshot from six commerce registries", () => {
    resetInfrastructureCommerceForTests();
    const snapshot = resolveCommercePluginRegistrySnapshot(TEST_CONTEXT);
    assert.ok(snapshot.slots.length >= 10);
    assert.ok(snapshot.policies.length >= 1);
    assert.ok(snapshot.marketplaces.length >= 2);
    assert.ok(snapshot.suppliers.length >= 2);
    assert.ok(snapshot.storefronts.length >= 2);
    assert.ok(snapshot.payments.length >= 2);
    assert.ok(snapshot.logistics.length >= 2);
    assert.match(snapshot.registrySource, /REG-COMMERCE-POLICY/);
    assert.match(snapshot.registrySource, /REG-MARKETPLACE/);
  });

  it("validates plugin slots against registry references", () => {
    resetInfrastructureCommerceForTests();
    const primary = validateCommercePluginSlot(
      TEST_CONTEXT,
      "cplugin-slot-foundation-marketplace",
    );
    assert.equal(primary.valid, true);

    const missing = validateCommercePluginSlot(TEST_CONTEXT, "cplugin-slot-unknown");
    assert.equal(missing.valid, false);
  });

  it("registers commerce plugins exclusively through Plugin Framework", () => {
    resetInfrastructureCommerceForTests();
    const result = registerCommercePlugin({
      context: TEST_CONTEXT,
      manifest: TEST_MANIFEST,
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
    });
    assert.equal(result.accepted, true);
    assert.equal(result.frameworkSource, COMMERCE_PLUGIN_FRAMEWORK_SOURCE);

    const frameworkPlugins = listCommercePluginsFromFramework();
    assert.ok(
      frameworkPlugins.some((plugin) => plugin.pluginId === TEST_MANIFEST.pluginId),
    );
    assert.ok(listCommercePluginRecords().some((plugin) => plugin.pluginId === TEST_MANIFEST.pluginId));
  });

  it("resolves plugin capabilities dynamically after registration", () => {
    resetInfrastructureCommerceForTests();
    registerCommercePlugin({
      context: TEST_CONTEXT,
      manifest: TEST_MANIFEST,
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
    });

    const resolved = resolveAllCommercePluginCapabilities(TEST_CONTEXT).find(
      (entry) => entry.pluginId === TEST_MANIFEST.pluginId,
    );
    assert.ok(resolved);
    assert.equal(resolved.registryBacked, true);
    assert.equal(resolved.policyCompliant, true);
    assert.ok(resolved.resolvedCapabilities.includes("connection"));
  });

  it("validates plugin compatibility and isolation", () => {
    resetInfrastructureCommerceForTests();
    registerCommercePlugin({
      context: TEST_CONTEXT,
      manifest: TEST_MANIFEST,
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
    });

    const record = listCommercePluginRecords().find(
      (entry) => entry.pluginId === TEST_MANIFEST.pluginId,
    );
    assert.ok(record);
    const compatibility = validateCommercePluginCompatibility(record!);
    assert.equal(compatibility.compatible, true);
    assert.equal(compatibility.isolationVerified, true);
  });

  it("discovers Brain capabilities only for validated registered plugins", () => {
    resetInfrastructureCommerceForTests();
    assert.equal(discoverCommercePluginCapabilitiesForBrain(TEST_CONTEXT).length, 0);

    registerCommercePlugin({
      context: TEST_CONTEXT,
      manifest: TEST_MANIFEST,
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
    });

    assert.equal(discoverCommercePluginCapabilitiesForBrain(TEST_CONTEXT).length, 0);

    advanceCommercePluginLifecycle({
      context: TEST_CONTEXT,
      ...TEST_ACTOR,
      pluginId: TEST_MANIFEST.pluginId,
      targetPhase: "load",
    });
    advanceCommercePluginLifecycle({
      context: TEST_CONTEXT,
      ...TEST_ACTOR,
      pluginId: TEST_MANIFEST.pluginId,
      targetPhase: "enable",
    });

    const brain = discoverCommercePluginCapabilitiesForBrain(TEST_CONTEXT);
    assert.equal(brain.length, 1);
    assert.equal(brain[0]?.brainRouted, true);
    assert.equal(brain[0]?.validated, true);
    assert.equal(brain[0]?.discoverySource, "EmpireAIPluginFramework:commerce-plugin-integration");
  });

  it("dispatches only validated Brain-routed plugin capabilities", () => {
    resetInfrastructureCommerceForTests();
    registerCommercePlugin({
      context: TEST_CONTEXT,
      manifest: TEST_MANIFEST,
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
    });

    const deniedRouting = dispatchValidatedCommercePluginCapability({
      pluginId: TEST_MANIFEST.pluginId,
      capabilityId: "connection",
      brainRouted: false as unknown as true,
    });
    assert.equal(deniedRouting.dispatched, false);
    assert.match(deniedRouting.reason, /Brain routing/i);

    advanceCommercePluginLifecycle({
      context: TEST_CONTEXT,
      ...TEST_ACTOR,
      pluginId: TEST_MANIFEST.pluginId,
      targetPhase: "load",
    });
    advanceCommercePluginLifecycle({
      context: TEST_CONTEXT,
      ...TEST_ACTOR,
      pluginId: TEST_MANIFEST.pluginId,
      targetPhase: "enable",
    });

    const dispatched = dispatchValidatedCommercePluginCapability({
      pluginId: TEST_MANIFEST.pluginId,
      capabilityId: "connection",
      brainRouted: true,
    });
    assert.equal(dispatched.dispatched, true);
  });

  it("extends Business Engines without modifying core", () => {
    resetInfrastructureCommerceForTests();
    registerCommercePlugin({
      context: TEST_CONTEXT,
      manifest: TEST_MANIFEST,
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
    });

    const engines = listCommercePluginEngineBindings("marketplace_plugins");
    assert.ok(engines.includes("marketplace-infrastructure-engine"));

    const envelopes = provideCommercePluginExtensionsToEngine(
      TEST_CONTEXT,
      "marketplace-infrastructure-engine",
      TEST_MANIFEST.pluginId,
    );
    assert.equal(envelopes.length, 1);
    assert.equal(envelopes[0]?.coreModified, false);
    assert.equal(envelopes[0]?.discoverySource, "EmpireAIPluginFramework:commerce-plugin-engine-bridge");
    assert.ok(envelopes[0]?.capabilityIds.some((id) => id.includes("connection")));
  });

  it("enforces commerce plugin lifecycle transitions", () => {
    assert.equal(canTransitionCommercePluginLifecycle("discover", "validate"), true);
    assert.equal(canTransitionCommercePluginLifecycle("discover", "enable"), false);

    const denied = transitionCommercePluginLifecycle("discover", {
      pluginId: TEST_MANIFEST.pluginId,
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      pillowGovernance: true,
      brainRouted: false,
      targetPhase: "validate",
    } as unknown as Parameters<typeof transitionCommercePluginLifecycle>[1]);
    assert.equal(denied.allowed, false);
    assert.match(denied.reason, /Brain-routed/i);
  });

  it("advances plugin lifecycle under Pillow governance", () => {
    resetInfrastructureCommerceForTests();
    registerCommercePlugin({
      context: TEST_CONTEXT,
      manifest: TEST_MANIFEST,
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
    });

    const load = advanceCommercePluginLifecycle({
      context: TEST_CONTEXT,
      ...TEST_ACTOR,
      pluginId: TEST_MANIFEST.pluginId,
      targetPhase: "load",
    });
    assert.equal(load.allowed, true);
    assert.equal(load.currentPhase, "load");

    const health = getCommercePluginHealthSnapshot(TEST_CONTEXT, TEST_MANIFEST.pluginId);
    assert.equal(health.frameworkRegistered, true);
    assert.equal(health.lifecyclePhase, "load");
  });

  it("passes Pillow commerce plugin governance checks", () => {
    resetInfrastructureCommerceForTests();
    const result = validateCommercePluginPillowGovernance({
      ...TEST_ACTOR,
      slotId: "cplugin-slot-foundation-marketplace",
      operation: "discover",
    });
    assert.equal(result.allowed, true);
    assert.equal(result.pluginApproved, true);
    assert.equal(result.trustVerified, true);
    assert.equal(result.permissionsGranted, true);
    assert.equal(result.isolationVerified, true);
    assert.equal(result.policyCompliant, true);
    assert.equal(result.eklsGoverned, true);
  });

  it("records commerce plugin EKLS observations", () => {
    resetInfrastructureCommerceForTests();
    assert.deepEqual(listCommercePluginEklsObservationKinds(), [
      ...COMMERCE_PLUGIN_EKLS_OBSERVATION_KINDS,
    ]);

    registerCommercePlugin({
      context: TEST_CONTEXT,
      manifest: TEST_MANIFEST,
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
    });

    const recorded = recordCommercePluginEklsObservation({
      ...TEST_ACTOR,
      pluginId: TEST_MANIFEST.pluginId,
      kind: "plugin_registration",
      signalValue: 1,
      signalUnit: "count",
      summary: "Foundation commerce plugin registration observation",
    });
    assert.equal(recorded.accepted, true);
    assert.ok(recorded.observationId);

    const search = searchCommercePluginEklsObservations({
      actorId: TEST_ACTOR.actorId,
      workspaceId: TEST_ACTOR.workspaceId,
      pluginId: TEST_MANIFEST.pluginId,
      kind: "plugin_registration",
      pillowGovernance: true,
    });
    assert.equal(search.length, 1);
  });

  it("validates foundation plugin integration without hardcoded business entities", () => {
    resetInfrastructureCommerceForTests();
    const serialized = JSON.stringify(discoverCommercePluginSlots(TEST_CONTEXT));
    const forbidden = ["Amazon", "Shopify", "Stripe", "FedEx", "Walmart", "Alibaba"];
    for (const token of forbidden) {
      assert.equal(
        serialized.toLowerCase().includes(token.toLowerCase()),
        false,
        `commerce plugin integration must not hardcode: ${token}`,
      );
    }
    assert.equal(COMMERCE_PLUGIN_INTEGRATION_VERSION, "g2-09-v1");
  });
});
