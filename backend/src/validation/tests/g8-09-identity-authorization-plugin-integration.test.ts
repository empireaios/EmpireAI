import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  IDENTITY_PLUGIN_LIFECYCLE_STATES,
  assertNoSecretsInIdentityPluginPayload,
  buildIdentityPluginCockpitView,
  checkIdentityPluginHealth,
  createIdentityPluginIntegrationModuleContract,
  disableIdentityPlugin,
  enableIdentityPlugin,
  getIdentityPluginDetail,
  identityPluginTools,
  listIdentityPluginCapabilities,
  listIdentityPlugins,
  previewIdentityPluginRegistryPolicy,
  redactIdentityPluginSecrets,
  registerIdentityPlugin,
  resetIdentityAuthorizationPlatformHarnessForTests,
  searchIdentityPluginEklsObservations,
  validateIdentityPlugin,
  validateIdentityPluginLifecycleGovernance,
  type IdentityPluginCategory,
  type IdentityPluginManifest,
} from "../../orchestration/identity-authorization-platform/index.js";
import { getRegistryLoader } from "../../registry/index.js";
import { listAuthorizationFrameworkPlugins } from "../../orchestration/identity-authorization-platform/authorization-framework/plugins/authorization-framework-plugin-host.js";
import { loadAuthorizationCentreView } from "../../orchestration/identity-authorization-platform/authorization-centre/cockpit/authorization-centre-view-loader.js";
import type { ToolContext } from "../../brain/types.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

const CANONICAL_WORKSPACE_ID = "ws_empire_1";
const OTHER_WORKSPACE_ID = "ws_customer_2";

const TEST_ACTOR = {
  actorId: "grand-king",
  ownerId: "grand-king",
  accountHolderId: "grand-king",
  pillowGovernance: true as const,
};

function resetG809Harness(): void {
  resetIdentityAuthorizationPlatformHarnessForTests();
}

function buildTestManifest(
  pluginId: string,
  category: IdentityPluginCategory = "oauth_strategy_plugin",
): IdentityPluginManifest {
  return {
    pluginId,
    pluginName: `G809 Test ${pluginId}`,
    pluginVersion: "1.0.0",
    pluginOwner: "test:g809",
    pluginCategory: category,
    supportedProviders: ["stripe"],
    supportedConnectionTypes: ["oauth2"],
    supportedCredentialTypes: ["oauth_token"],
    capabilities: ["oauth_authorize"],
    requiredPermissions: ["identity-authorization.oauth"],
    registryReferences: [],
    configurationSchema: { type: "object" },
    healthCheck: { checkType: "ping", intervalMs: 60000 },
    compatibilityMatrix: { minFrameworkVersion: "1.0.0" },
    lifecycleHooks: { onEnable: true },
    governanceState: "pillow-governed",
    pillowGovernance: true,
  };
}

function toolContext(workspaceId = CANONICAL_WORKSPACE_ID): ToolContext {
  return {
    agentId: "test-agent",
    correlationId: "test-correlation-g809",
    workspaceId,
  };
}

describe("G8-09 — Identity & Authorization Plugin Integration", () => {
  it("resolves plugin registry policy from identity registries without hardcoded discovery", () => {
    resetG809Harness();
    const policy = previewIdentityPluginRegistryPolicy({
      pluginId: "plugin-g809-policy",
      category: "oauth_strategy_plugin",
      registryReferences: [],
    });

    assert.equal(policy.allowed, true);
    assert.equal(policy.category, "oauth_strategy_plugin");
  });

  it("registers plugin through Plugin Framework and domain router under Pillow governance", () => {
    resetG809Harness();
    const result = registerIdentityPlugin({
      manifest: buildTestManifest("plugin-g809-register"),
      ...TEST_ACTOR,
      workspaceId: CANONICAL_WORKSPACE_ID,
    });

    assert.equal(result.accepted, true);
    assert.equal(result.lifecycleState, "enabled");

    const frameworkPlugins = getRegistryLoader().listRegisteredPlugins();
    assert.ok(frameworkPlugins.some((entry) => entry.pluginId === "plugin-g809-register"));

    const authFrameworkPlugins = listAuthorizationFrameworkPlugins();
    assert.ok(authFrameworkPlugins.some((entry) => entry.pluginId === "plugin-g809-register"));

    const eklsEvents = searchIdentityPluginEklsObservations({
      workspaceId: CANONICAL_WORKSPACE_ID,
      pillowGovernance: true,
    });
    assert.ok(eklsEvents.some((event) => event.kind === "identity_plugin_registered"));
    assert.ok(eklsEvents.some((event) => event.kind === "identity_plugin_enabled"));
  });

  it("fulfills plugin contract and module capabilities for G8-09", () => {
    resetG809Harness();
    assert.ok(IDENTITY_PLUGIN_LIFECYCLE_STATES.includes("discovered"));
    assert.ok(IDENTITY_PLUGIN_LIFECYCLE_STATES.includes("enabled"));
    assert.ok(IDENTITY_PLUGIN_LIFECYCLE_STATES.includes("retired"));

    const contract = createIdentityPluginIntegrationModuleContract();
    assert.equal(contract.missionId, "G8-09");
    assert.ok(contract.capabilities.includes("plugin_lifecycle_manager"));
    assert.ok(contract.capabilities.includes("plugin_framework_integration"));
    assert.ok(contract.brainTools.includes("identity_plugin_list"));
    assert.ok(contract.brainTools.includes("identity_plugin_capabilities"));
  });

  it("manages plugin lifecycle enable and disable", () => {
    resetG809Harness();
    registerIdentityPlugin({
      manifest: buildTestManifest("plugin-g809-lifecycle"),
      ...TEST_ACTOR,
      workspaceId: CANONICAL_WORKSPACE_ID,
      autoEnable: false,
    });

    const disabled = disableIdentityPlugin({
      pluginId: "plugin-g809-lifecycle",
      actorId: TEST_ACTOR.actorId,
      ownerId: TEST_ACTOR.ownerId,
      workspaceId: CANONICAL_WORKSPACE_ID,
      pillowGovernance: true,
    });
    assert.equal(disabled.lifecycleState, "disabled");

    const enabled = enableIdentityPlugin({
      pluginId: "plugin-g809-lifecycle",
      actorId: TEST_ACTOR.actorId,
      ownerId: TEST_ACTOR.ownerId,
      workspaceId: CANONICAL_WORKSPACE_ID,
      pillowGovernance: true,
    });
    assert.equal(enabled.lifecycleState, "enabled");
    assert.equal(enabled.accepted, true);
  });

  it("validates plugin compatibility and registry policy", () => {
    resetG809Harness();
    const valid = validateIdentityPlugin({
      manifest: buildTestManifest("plugin-g809-validate"),
      workspaceId: CANONICAL_WORKSPACE_ID,
    });
    assert.equal(valid.valid, true);
    assert.equal(valid.compatibilityPassed, true);
    assert.equal(valid.registryPolicyPassed, true);

    const invalid = validateIdentityPlugin({
      manifest: {
        ...buildTestManifest("plugin-g809-invalid"),
        pluginVersion: "not-semver",
      },
      workspaceId: CANONICAL_WORKSPACE_ID,
    });
    assert.equal(invalid.valid, false);
  });

  it("resolves plugin capabilities from registry bindings", () => {
    resetG809Harness();
    registerIdentityPlugin({
      manifest: buildTestManifest("plugin-g809-capabilities", "health_check_plugin"),
      ...TEST_ACTOR,
      workspaceId: CANONICAL_WORKSPACE_ID,
    });

    const capabilities = listIdentityPluginCapabilities({
      actorId: TEST_ACTOR.actorId,
      ownerId: TEST_ACTOR.ownerId,
      workspaceId: CANONICAL_WORKSPACE_ID,
      pillowGovernance: true,
    });

    assert.ok(capabilities.some((entry) => entry.pluginId === "plugin-g809-capabilities"));
    const capabilityEntry = capabilities.find((entry) => entry.pluginId === "plugin-g809-capabilities");
    assert.ok(capabilityEntry);
    assert.ok(capabilityEntry.capabilities.length > 0);
  });

  it("exposes Brain tools without secrets", async () => {
    resetG809Harness();
    registerIdentityPlugin({
      manifest: buildTestManifest("plugin-g809-brain"),
      ...TEST_ACTOR,
      workspaceId: CANONICAL_WORKSPACE_ID,
    });

    const listTool = identityPluginTools.find((tool) => tool.name === "identity_plugin_list");
    const detailTool = identityPluginTools.find((tool) => tool.name === "identity_plugin_detail");
    const healthTool = identityPluginTools.find((tool) => tool.name === "identity_plugin_health");
    assert.ok(listTool && detailTool && healthTool);

    const listed = await listTool.handler({}, toolContext());
    assert.ok(Array.isArray(listed));
    assert.ok((listed as Array<{ pluginId: string }>).some((entry) => entry.pluginId === "plugin-g809-brain"));

    const detail = await detailTool.handler({ pluginId: "plugin-g809-brain" }, toolContext());
    assert.equal((detail as { found: boolean }).found, true);

    const health = await healthTool.handler({ pluginId: "plugin-g809-brain" }, toolContext());
    assert.equal((health as { pluginId: string }).pluginId, "plugin-g809-brain");
    assertNoSecretsInIdentityPluginPayload(health);
  });

  it("enforces Pillow governance for plugin lifecycle operations", () => {
    resetG809Harness();
    const denied = validateIdentityPluginLifecycleGovernance({
      pillowGovernance: true,
      actorId: "",
      workspaceId: CANONICAL_WORKSPACE_ID,
      ownerId: TEST_ACTOR.ownerId,
      operation: "register",
    });
    assert.equal(denied.allowed, false);
  });

  it("blocks cross-workspace plugin access", () => {
    resetG809Harness();
    registerIdentityPlugin({
      manifest: buildTestManifest("plugin-g809-isolation"),
      ...TEST_ACTOR,
      workspaceId: CANONICAL_WORKSPACE_ID,
    });

    const detail = getIdentityPluginDetail({
      pluginId: "plugin-g809-isolation",
      actorId: TEST_ACTOR.actorId,
      ownerId: TEST_ACTOR.ownerId,
      workspaceId: OTHER_WORKSPACE_ID,
      pillowGovernance: true,
    });
    assert.equal(detail, null);

    const disableAttempt = disableIdentityPlugin({
      pluginId: "plugin-g809-isolation",
      actorId: TEST_ACTOR.actorId,
      ownerId: TEST_ACTOR.ownerId,
      workspaceId: OTHER_WORKSPACE_ID,
      pillowGovernance: true,
    });
    assert.equal(disableAttempt.accepted, false);
    assert.match(disableAttempt.reason, /Cross-workspace/);
  });

  it("records EKLS plugin lifecycle events without secrets", () => {
    resetG809Harness();
    registerIdentityPlugin({
      manifest: buildTestManifest("plugin-g809-ekls"),
      ...TEST_ACTOR,
      workspaceId: CANONICAL_WORKSPACE_ID,
    });

    checkIdentityPluginHealth({
      pluginId: "plugin-g809-ekls",
      actorId: TEST_ACTOR.actorId,
      ownerId: TEST_ACTOR.ownerId,
      workspaceId: CANONICAL_WORKSPACE_ID,
      pillowGovernance: true,
    });

    const events = searchIdentityPluginEklsObservations({
      workspaceId: CANONICAL_WORKSPACE_ID,
      pluginId: "plugin-g809-ekls",
      pillowGovernance: true,
    });
    assert.ok(events.length >= 2);
    for (const event of events) {
      assertNoSecretsInIdentityPluginPayload(event);
    }
  });

  it("exposes Cockpit plugin integration summary on Authorization Centre", () => {
    resetG809Harness();
    registerIdentityPlugin({
      manifest: buildTestManifest("plugin-g809-cockpit"),
      ...TEST_ACTOR,
      workspaceId: CANONICAL_WORKSPACE_ID,
    });

    const cockpitView = loadAuthorizationCentreView(CANONICAL_WORKSPACE_ID);
    assert.ok(cockpitView.pluginIntegrationSummary);
    assert.ok(cockpitView.pluginIntegrationSummary.installedPluginCount >= 1);
    assert.ok(cockpitView.pluginIntegrationSummary.enabledPluginCount >= 1);

    const pluginView = buildIdentityPluginCockpitView({
      workspaceId: CANONICAL_WORKSPACE_ID,
      actorId: TEST_ACTOR.actorId,
      ownerId: TEST_ACTOR.ownerId,
      pillowGovernance: true,
    });
    assert.ok(pluginView.capabilityList.length > 0);
    assert.ok(pluginView.providerCoverage.includes("stripe"));
  });

  it("redacts secrets from plugin payloads", () => {
    resetG809Harness();
    const redacted = redactIdentityPluginSecrets({
      pluginId: "plugin-secret-test",
      secret: "sk_live_abc123",
      token: "oauth_refresh_token_value",
    }) as Record<string, unknown>;

    assert.equal(redacted.secret, "[REDACTED]");
    assert.equal(redacted.token, "[REDACTED]");
    assertNoSecretsInIdentityPluginPayload(redacted);
  });

  it("routes plugin categories to subsystem hosts", () => {
    resetG809Harness();
    const categories: IdentityPluginCategory[] = [
      "credential_handler_plugin",
      "readiness_rule_plugin",
      "isolation_policy_plugin",
      "reauthorization_plugin",
    ];

    for (const category of categories) {
      const pluginId = `plugin-g809-${category}`;
      const result = registerIdentityPlugin({
        manifest: buildTestManifest(pluginId, category),
        ...TEST_ACTOR,
        workspaceId: CANONICAL_WORKSPACE_ID,
      });
      assert.equal(result.accepted, true, `Expected ${category} registration to succeed`);
    }
  });
});
