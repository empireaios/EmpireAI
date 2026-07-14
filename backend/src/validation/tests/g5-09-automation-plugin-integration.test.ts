import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AUTOMATION_PLUGIN_LIFECYCLE_STATES,
  createBusinessAutomationModuleContract,
  disableAutomationPlugin,
  enableAutomationPlugin,
  getAutomationPluginHost,
  listAutomationPluginCapabilities,
  listAutomationPlugins,
  listPluginAuditEvents,
  loadAutomationCentreView,
  orchestratorPluginRegistry,
  previewAutomationPluginRegistryPolicy,
  registerAutomationPlugin,
  resetBusinessAutomationHarnessForTests,
  unloadAutomationPlugin,
} from "../../orchestration/business-automation/index.js";
import { getRegistryLoader, resetAutomationRegistryBatchForTests, resetRegistryLoaderForTests } from "../../registry/index.js";
import { configureValidationEnvironment } from "../harness.js";

configureValidationEnvironment();

function resetG509Harness(): void {
  resetRegistryLoaderForTests();
  resetAutomationRegistryBatchForTests();
  resetBusinessAutomationHarnessForTests();
}

function buildTestManifest(pluginId: string) {
  return {
    pluginId,
    pluginName: "G509 Test Orchestrator Plugin",
    version: "1.0.0",
    owner: "test:g509",
    category: "automation_execution" as const,
    capabilities: ["validate_step"],
    supportedInterfaces: ["orchestrator.validator"],
    dependencies: [],
    registryReferences: ["exec-foundation-brain-dispatch"],
    configuration: { sandboxed: true },
    permissions: ["business-automation.execute"],
    compatibility: { minFrameworkVersion: "1.0.0" },
    trustLevel: "standard" as const,
  };
}

describe("G5-09 — Automation Plugin Integration", () => {
  it("resolves plugin registry policy from REG-AUTOMATION-EXECUTOR without hardcoded discovery", () => {
    resetG509Harness();
    const policy = previewAutomationPluginRegistryPolicy({
      pluginId: "plugin-g509-policy",
      category: "automation_execution",
      registryReferences: ["exec-foundation-brain-dispatch"],
    });

    assert.equal(policy.allowed, true);
    assert.ok(policy.executorRegistryIds.includes("exec-foundation-brain-dispatch"));
  });

  it("registers plugin through Plugin Framework and domain router under Pillow governance", () => {
    resetG509Harness();
    const result = registerAutomationPlugin({
      manifest: buildTestManifest("plugin-g509-register"),
      actorId: "actor_g509",
      workspaceId: "ws_g509",
      hooks: {
        orchestratorValidator: {
          pluginId: "plugin-g509-register",
          validate: () => ({ valid: true, reason: "Plugin validation passed" }),
        },
      },
    });

    assert.equal(result.accepted, true);
    assert.equal(result.lifecycleState, "enabled");
    assert.ok(orchestratorPluginRegistry.listValidators().some((v) => v.pluginId === "plugin-g509-register"));

    const frameworkPlugins = getRegistryLoader().listRegisteredPlugins();
    assert.ok(frameworkPlugins.some((p) => p.pluginId === "plugin-g509-register"));

    const auditEvents = listPluginAuditEvents("ws_g509");
    assert.ok(auditEvents.some((e) => e.eventType === "plugin_registered"));
    assert.ok(auditEvents.some((e) => e.eventType === "plugin_activated"));
  });

  it("fulfills plugin contract and module capabilities for G5-09", () => {
    resetG509Harness();
    assert.ok(AUTOMATION_PLUGIN_LIFECYCLE_STATES.includes("discovered"));
    assert.ok(AUTOMATION_PLUGIN_LIFECYCLE_STATES.includes("enabled"));
    assert.ok(AUTOMATION_PLUGIN_LIFECYCLE_STATES.includes("retired"));

    const contract = createBusinessAutomationModuleContract();
    assert.equal(contract.missionId, "G5-10");
    assert.ok(contract.capabilities.includes("business-automation.discover_plugins"));
    assert.ok(contract.capabilities.includes("business-automation.register_plugin"));
    assert.ok(contract.capabilities.includes("business-automation.plugin_capabilities"));
  });

  it("manages plugin lifecycle enable, disable, and unload", () => {
    resetG509Harness();
    registerAutomationPlugin({
      manifest: buildTestManifest("plugin-g509-lifecycle"),
      actorId: "actor_g509",
      workspaceId: "ws_g509_lifecycle",
      hooks: {
        orchestratorValidator: {
          pluginId: "plugin-g509-lifecycle",
          validate: () => ({ valid: true, reason: "ok" }),
        },
      },
    });

    const disabled = disableAutomationPlugin({
      pluginId: "plugin-g509-lifecycle",
      actorId: "actor_g509",
      workspaceId: "ws_g509_lifecycle",
    });
    assert.equal(disabled.lifecycleState, "disabled");

    const enabled = enableAutomationPlugin({
      pluginId: "plugin-g509-lifecycle",
      actorId: "actor_g509",
      workspaceId: "ws_g509_lifecycle",
    });
    assert.equal(enabled.lifecycleState, "enabled");

    getAutomationPluginHost().recordExecution({
      pluginId: "plugin-g509-lifecycle",
      actorId: "actor_g509",
      workspaceId: "ws_g509_lifecycle",
      success: false,
      reason: "Simulated plugin failure",
    });

    const unloaded = unloadAutomationPlugin({
      pluginId: "plugin-g509-lifecycle",
      actorId: "actor_g509",
      workspaceId: "ws_g509_lifecycle",
    });
    assert.equal(unloaded.lifecycleState, "unloaded");
    assert.equal(
      orchestratorPluginRegistry.listValidators().some((v) => v.pluginId === "plugin-g509-lifecycle"),
      false,
    );
  });

  it("lists enabled plugin capabilities for Brain dispatch discovery", () => {
    resetG509Harness();
    registerAutomationPlugin({
      manifest: buildTestManifest("plugin-g509-capabilities"),
      actorId: "actor_g509",
      workspaceId: "ws_g509_cap",
    });

    const capabilities = listAutomationPluginCapabilities();
    assert.ok(capabilities.totalCount >= 1);
    assert.ok(
      capabilities.capabilities.some(
        (entry) => entry.pluginId === "plugin-g509-capabilities" && entry.enabled,
      ),
    );
  });

  it("exposes Brain automation plugin tools for discovery, list, and registry preview", async () => {
    resetG509Harness();
    registerAutomationPlugin({
      manifest: buildTestManifest("plugin-g509-brain"),
      actorId: "actor_g509",
      workspaceId: "ws_g509_brain",
    });

    const { automationPluginTools } = await import(
      "../../orchestration/business-automation/tools/automation-plugin-tools.js"
    );

    const listTool = automationPluginTools.find((tool) => tool.name === "business_automation.list_plugins");
    const previewTool = automationPluginTools.find(
      (tool) => tool.name === "business_automation.plugin_registry_preview",
    );
    const capabilitiesTool = automationPluginTools.find(
      (tool) => tool.name === "business_automation.plugin_capabilities",
    );

    assert.ok(listTool && previewTool && capabilitiesTool);

    const listed = (await listTool!.handler({}, {
      workspaceId: "ws_g509_brain",
      agentId: "actor_g509",
      correlationId: "corr-g509",
    })) as { totalCount: number };
    assert.ok(listed.totalCount >= 1);

    const preview = (await previewTool!.handler(
      {
        pluginId: "plugin-g509-brain",
        category: "automation_execution",
        registryReferences: ["exec-foundation-brain-dispatch"],
      },
      { workspaceId: "ws_g509_brain", agentId: "actor_g509", correlationId: "corr-g509" },
    )) as { executorRegistryIds: string[] };
    assert.ok(preview.executorRegistryIds.includes("exec-foundation-brain-dispatch"));
  });

  it("records plugin lifecycle events through Pillow-governed EKLS audit", () => {
    resetG509Harness();
    registerAutomationPlugin({
      manifest: buildTestManifest("plugin-g509-ekls"),
      actorId: "actor_g509",
      workspaceId: "ws_g509_ekls",
    });

    const events = listPluginAuditEvents("ws_g509_ekls");
    assert.ok(events.length >= 2);
    assert.ok(events.every((event) => event.pillowGovernance === true));
  });

  it("exposes installed plugins in Cockpit automation centre view", () => {
    resetG509Harness();
    registerAutomationPlugin({
      manifest: buildTestManifest("plugin-g509-cockpit"),
      actorId: "actor_g509",
      workspaceId: "ws_g509_cockpit",
    });

    const view = loadAutomationCentreView("ws_g509_cockpit");
    assert.ok(Array.isArray(view.installedPlugins));
    assert.ok(view.installedPlugins.some((plugin) => plugin.pluginId === "plugin-g509-cockpit"));
    assert.equal(view.installedPlugins.find((p) => p.pluginId === "plugin-g509-cockpit")?.healthStatus, "healthy");
  });

  it("supports cockpit widget hooks without modifying automation centre core", () => {
    resetG509Harness();
    registerAutomationPlugin({
      manifest: {
        ...buildTestManifest("plugin-g509-widget"),
        category: "automation_monitoring",
        registryReferences: ["mon-foundation-run-health"],
      },
      actorId: "actor_g509",
      workspaceId: "ws_g509_widget",
      hooks: {
        cockpitWidget: {
          pluginId: "plugin-g509-widget",
          title: "Plugin Monitor",
          buildSummary: () => ({ summary: "Plugin health nominal" }),
        },
      },
    });

    const view = loadAutomationCentreView("ws_g509_widget");
    assert.ok(view.pluginWidgets.some((widget) => widget.pluginId === "plugin-g509-widget"));
    assert.ok(listAutomationPlugins("ws_g509_widget").totalCount >= 1);
  });

  it("rejects invalid plugin manifest structure", () => {
    resetG509Harness();
    const result = registerAutomationPlugin({
      manifest: {
        ...buildTestManifest("plugin-g509-invalid"),
        version: "not-semver",
      },
      actorId: "actor_g509",
      workspaceId: "ws_g509",
    });
    assert.equal(result.accepted, false);
    assert.ok(result.reason.includes("semver"));
  });
});
