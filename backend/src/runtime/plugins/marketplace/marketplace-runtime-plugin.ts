import { BaseRuntimePlugin } from "../framework/i-runtime-plugin.js";
import type {
  RuntimePluginCapability,
  RuntimePluginExecutionMode,
  RuntimePluginManifest,
} from "../framework/runtime-plugin-types.js";
import {
  MARKETPLACE_CAPABILITY_LABELS,
  MarketplacePluginCapabilitySchema,
  type MarketplacePluginCapability,
} from "./marketplace-capabilities.js";

export type MarketplaceCapabilityDeclaration = {
  capability: MarketplacePluginCapability;
  support: "DECLARED" | "PARTIAL" | "UNSUPPORTED";
  executionMode?: RuntimePluginExecutionMode;
};

/** B-002 — Base class for marketplace runtime plugins. Capability declaration only. */
export abstract class MarketplaceRuntimePlugin extends BaseRuntimePlugin {
  protected abstract declareMarketplaceCapabilities(): MarketplaceCapabilityDeclaration[];

  declareCapabilities(): RuntimePluginCapability[] {
    return this.declareMarketplaceCapabilities().map((entry) => ({
      capabilityId: entry.capability,
      displayName: MARKETPLACE_CAPABILITY_LABELS[entry.capability],
      support: entry.support,
      executionMode: entry.executionMode ?? "ARCHITECTURE_ONLY",
    }));
  }

  buildManifest(partial: Omit<RuntimePluginManifest, "category" | "capabilities">): RuntimePluginManifest {
    const capabilities = this.declareCapabilities();
    return {
      ...partial,
      category: "marketplace",
      capabilities,
    };
  }

  supportsMarketplaceCapability(capability: MarketplacePluginCapability): boolean {
    return this.supportsCapability(capability);
  }

  static isMarketplaceCapability(value: string): value is MarketplacePluginCapability {
    return MarketplacePluginCapabilitySchema.safeParse(value).success;
  }
}
