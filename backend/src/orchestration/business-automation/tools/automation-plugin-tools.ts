/**
 * G5-09 — Automation Plugin Integration Brain tools.
 */

import type { RegisteredTool } from "../../../brain/types.js";
import type { AutomationPluginManifest } from "../contracts/automation-plugin-types.js";
import {
  disableAutomationPlugin,
  discoverAutomationPlugins,
  enableAutomationPlugin,
  getAutomationPlugin,
  listAutomationPluginCapabilities,
  listAutomationPlugins,
  previewAutomationPluginRegistryPolicy,
  registerAutomationPlugin,
  unloadAutomationPlugin,
} from "../services/automation-plugin-service.js";

export const automationPluginTools: RegisteredTool[] = [
  {
    name: "business_automation.discover_plugins",
    description: "Discover automation plugins registered through the EmpireAI Plugin Framework",
    module: "business-automation",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
      },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args, context) =>
      discoverAutomationPlugins({
        workspaceId: args.workspaceId ? String(args.workspaceId) : context.workspaceId,
        actorId: args.actorId ? String(args.actorId) : context.agentId,
      }),
  },
  {
    name: "business_automation.register_plugin",
    description: "Register automation plugin through Pillow-governed Plugin Framework integration",
    module: "business-automation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        manifest: { type: "object" },
        workspaceId: { type: "string" },
        actorId: { type: "string" },
      },
      required: ["manifest", "workspaceId", "actorId"],
    },
    handler: async (args) =>
      registerAutomationPlugin({
        manifest: args.manifest as AutomationPluginManifest,
        workspaceId: String(args.workspaceId),
        actorId: String(args.actorId),
      }),
  },
  {
    name: "business_automation.list_plugins",
    description: "List installed automation plugins with health and lifecycle status",
    module: "business-automation",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
      },
    },
    handler: async (args, context) =>
      listAutomationPlugins(
        args.workspaceId ? String(args.workspaceId) : context.workspaceId,
      ),
  },
  {
    name: "business_automation.get_plugin",
    description: "Retrieve automation plugin record by plugin ID",
    module: "business-automation",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        pluginId: { type: "string" },
      },
      required: ["pluginId"],
    },
    handler: async (args) => getAutomationPlugin(String(args.pluginId)),
  },
  {
    name: "business_automation.enable_plugin",
    description: "Enable registered automation plugin under Pillow governance",
    module: "business-automation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        pluginId: { type: "string" },
        workspaceId: { type: "string" },
        actorId: { type: "string" },
      },
      required: ["pluginId", "workspaceId", "actorId"],
    },
    handler: async (args) =>
      enableAutomationPlugin({
        pluginId: String(args.pluginId),
        workspaceId: String(args.workspaceId),
        actorId: String(args.actorId),
      }),
  },
  {
    name: "business_automation.disable_plugin",
    description: "Disable automation plugin under Pillow governance",
    module: "business-automation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        pluginId: { type: "string" },
        workspaceId: { type: "string" },
        actorId: { type: "string" },
      },
      required: ["pluginId", "workspaceId", "actorId"],
    },
    handler: async (args) =>
      disableAutomationPlugin({
        pluginId: String(args.pluginId),
        workspaceId: String(args.workspaceId),
        actorId: String(args.actorId),
      }),
  },
  {
    name: "business_automation.unload_plugin",
    description: "Unload automation plugin hooks from domain registries",
    module: "business-automation",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        pluginId: { type: "string" },
        workspaceId: { type: "string" },
        actorId: { type: "string" },
      },
      required: ["pluginId", "workspaceId", "actorId"],
    },
    handler: async (args) =>
      unloadAutomationPlugin({
        pluginId: String(args.pluginId),
        workspaceId: String(args.workspaceId),
        actorId: String(args.actorId),
      }),
  },
  {
    name: "business_automation.plugin_capabilities",
    description: "List validated automation capabilities from enabled plugins for Brain dispatch",
    module: "business-automation",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => listAutomationPluginCapabilities(),
  },
  {
    name: "business_automation.plugin_registry_preview",
    description: "Preview REG-AUTOMATION-EXECUTOR/WORKFLOW/POLICY/MONITOR plugin resolution",
    module: "business-automation",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        pluginId: { type: "string" },
        category: { type: "string" },
        registryReferences: { type: "array", items: { type: "string" } },
      },
      required: ["pluginId", "category"],
    },
    handler: async (args) =>
      previewAutomationPluginRegistryPolicy({
        pluginId: String(args.pluginId),
        category: String(args.category) as AutomationPluginManifest["category"],
        registryReferences: Array.isArray(args.registryReferences)
          ? args.registryReferences.map(String)
          : [],
      }),
  },
];
