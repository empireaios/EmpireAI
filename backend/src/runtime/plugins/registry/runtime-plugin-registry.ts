import type { IRuntimePlugin } from "../framework/i-runtime-plugin.js";
import type {
  RuntimePluginCapability,
  RuntimePluginCategory,
  RuntimePluginCertificationState,
  RuntimePluginHealth,
  RuntimePluginManifest,
} from "../framework/runtime-plugin-types.js";
import {
  CRT_OPERATION_TO_MARKETPLACE_CAPABILITY,
  MARKETPLACE_LOOKUP_CAPABILITIES,
  type MarketplacePluginCapability,
} from "../marketplace/marketplace-capabilities.js";
import { createShopifyRuntimePlugin } from "../marketplace/shopify/shopify-runtime-plugin.js";
import { createAmazonRuntimePlugin } from "../marketplace/amazon/amazon-runtime-plugin.js";

type RegistryEntry = {
  plugin: IRuntimePlugin;
  enabled: boolean;
};

/** B-004 — Runtime plugin registry. */
export class RuntimePluginRegistry {
  private readonly entries = new Map<string, RegistryEntry>();

  constructor(seedDefaults = true) {
    if (seedDefaults) {
      this.register(createShopifyRuntimePlugin());
      this.enable("shopify");
      this.register(createAmazonRuntimePlugin());
    }
  }

  register(plugin: IRuntimePlugin): RuntimePluginManifest {
    const { pluginId } = plugin.manifest;
    if (this.entries.has(pluginId)) {
      throw new Error(`Plugin already registered: ${pluginId}`);
    }
    plugin.onRegister?.();
    this.entries.set(pluginId, { plugin, enabled: false });
    return plugin.manifest;
  }

  unregister(pluginId: string): boolean {
    const entry = this.entries.get(pluginId);
    if (!entry) return false;
    entry.plugin.onUnregister?.();
    this.entries.delete(pluginId);
    return true;
  }

  enable(pluginId: string): boolean {
    const entry = this.entries.get(pluginId);
    if (!entry) return false;
    entry.enabled = true;
    entry.plugin.manifest.lifecycle = "ENABLED";
    entry.plugin.onEnable?.();
    return true;
  }

  disable(pluginId: string): boolean {
    const entry = this.entries.get(pluginId);
    if (!entry) return false;
    entry.enabled = false;
    entry.plugin.manifest.lifecycle = "DISABLED";
    entry.plugin.onDisable?.();
    return true;
  }

  getPlugin(pluginId: string): IRuntimePlugin | null {
    return this.entries.get(pluginId)?.plugin ?? null;
  }

  listPlugins(): RuntimePluginManifest[] {
    return [...this.entries.values()].map((e) => e.plugin.manifest);
  }

  listEnabledPlugins(): RuntimePluginManifest[] {
    return [...this.entries.values()]
      .filter((e) => e.enabled)
      .map((e) => e.plugin.manifest);
  }

  getHealth(pluginId: string): RuntimePluginHealth | null {
    const entry = this.entries.get(pluginId);
    if (!entry) return null;
    return entry.plugin.getHealth();
  }

  getAllHealth(): Array<{ pluginId: string; health: RuntimePluginHealth }> {
    return [...this.entries.entries()].map(([pluginId, entry]) => ({
      pluginId,
      health: entry.plugin.getHealth(),
    }));
  }

  lookupByCategory(category: RuntimePluginCategory): RuntimePluginManifest[] {
    return this.listPlugins().filter((m) => m.category === category);
  }

  lookupByVersion(pluginId: string, version: string): RuntimePluginManifest | null {
    const manifest = this.getPlugin(pluginId)?.manifest;
    return manifest?.version === version ? manifest : null;
  }

  lookupByCertification(state: RuntimePluginCertificationState): RuntimePluginManifest[] {
    return this.listPlugins().filter((m) => m.certificationState === state);
  }

  lookupByCapability(capabilityId: string): Array<{
    pluginId: string;
    displayName: string;
    support: RuntimePluginCapability["support"];
    enabled: boolean;
  }> {
    const results: Array<{
      pluginId: string;
      displayName: string;
      support: RuntimePluginCapability["support"];
      enabled: boolean;
    }> = [];

    for (const [pluginId, entry] of this.entries) {
      const cap = entry.plugin.declareCapabilities().find((c) => c.capabilityId === capabilityId);
      if (cap && cap.support !== "UNSUPPORTED") {
        results.push({
          pluginId,
          displayName: entry.plugin.manifest.displayName,
          support: cap.support,
          enabled: entry.enabled,
        });
      }
    }
    return results;
  }

  /** Answer: which plugins support Publish Product, Inventory, Orders, etc. */
  buildCapabilityCoverage(): Array<{
    capabilityId: string;
    displayName: string;
    plugins: Array<{ pluginId: string; support: string; enabled: boolean }>;
  }> {
    return MARKETPLACE_LOOKUP_CAPABILITIES.map((capId) => {
      const plugins = this.lookupByCapability(capId);
      return {
        capabilityId: capId,
        displayName: capId.replace(/_/g, " "),
        plugins: plugins.map((p) => ({
          pluginId: p.pluginId,
          support: p.support,
          enabled: p.enabled,
        })),
      };
    });
  }

  resolvePluginForCrtOperation(operation: string, preferredPluginId?: string): {
    plugin: IRuntimePlugin | null;
    capabilityId: MarketplacePluginCapability | null;
    reason: string;
  } {
    const capabilityId = CRT_OPERATION_TO_MARKETPLACE_CAPABILITY[operation] ?? null;
    if (!capabilityId) {
      return { plugin: null, capabilityId: null, reason: `No marketplace capability mapping for operation: ${operation}` };
    }

    if (preferredPluginId) {
      const plugin = this.getPlugin(preferredPluginId);
      if (!plugin) return { plugin: null, capabilityId, reason: `Plugin not found: ${preferredPluginId}` };
      if (!plugin.supportsCapability(capabilityId)) {
        return { plugin: null, capabilityId, reason: `Plugin ${preferredPluginId} does not support ${capabilityId}` };
      }
      const entry = this.entries.get(preferredPluginId);
      if (!entry?.enabled) {
        return { plugin: null, capabilityId, reason: `Plugin ${preferredPluginId} is not enabled` };
      }
      return { plugin, capabilityId, reason: "Resolved via preferred plugin" };
    }

    const matches = this.lookupByCapability(capabilityId).filter((m) => m.enabled);
    if (matches.length === 0) {
      return { plugin: null, capabilityId, reason: `No enabled plugin supports ${capabilityId}` };
    }
    const first = matches[0]!;
    return {
      plugin: this.getPlugin(first.pluginId),
      capabilityId,
      reason: `Resolved to ${first.pluginId}`,
    };
  }
}

let registryInstance: RuntimePluginRegistry | null = null;

export function getRuntimePluginRegistry(): RuntimePluginRegistry {
  registryInstance ??= new RuntimePluginRegistry(true);
  return registryInstance;
}

export function resetRuntimePluginRegistry(): void {
  registryInstance = null;
}
