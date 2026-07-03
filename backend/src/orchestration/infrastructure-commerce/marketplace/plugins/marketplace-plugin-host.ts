/**
 * G2-02 — Marketplace plugin host (registry + framework registration only).
 */

import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import type { RegistryPluginKind } from "../../../../registry/types/plugin-manifest.js";
import { REG_MARKETPLACE } from "../../../../registry/types/registry-ids.js";
import type {
  MarketplaceHealthStatus,
  MarketplacePluginManifest,
  MarketplacePluginRecord,
} from "../contracts/marketplace-integration-types.js";
import {
  validateMarketplacePluginManifestStructure,
  validateMarketplacePillowGovernance,
} from "../governance/marketplace-pillow-governance.js";
import { resolveMarketplaceRowById } from "../registry/marketplace-registry-resolver.js";

const MARKETPLACE_PLUGIN_KIND: RegistryPluginKind = "commerce_marketplace";

function nowIso(): string {
  return new Date().toISOString();
}

export class MarketplacePluginHost {
  private readonly records = new Map<string, MarketplacePluginRecord>();

  discoverPlugins(input: {
    actorId: string;
    workspaceId: string;
    pillowGovernance: true;
  }): { discoveredCount: number; plugins: MarketplacePluginRecord[]; generatedAt: string } {
    const governance = validateMarketplacePillowGovernance({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      marketplaceId: "mkt-foundation-primary-channel",
      operation: "discover",
      pillowGovernance: true,
    });

    if (!governance.allowed) {
      return { discoveredCount: 0, plugins: [], generatedAt: nowIso() };
    }

    const frameworkPlugins = getRegistryLoader()
      .listRegisteredPlugins()
      .filter((manifest) => manifest.kind === MARKETPLACE_PLUGIN_KIND);

    for (const manifest of frameworkPlugins) {
      if (this.records.has(manifest.pluginId)) continue;
      this.records.set(manifest.pluginId, {
        pluginId: manifest.pluginId,
        pluginName: manifest.description,
        version: manifest.version,
        marketplaceRegistryRowId:
          typeof manifest.extensions.marketplaceRegistryRowId === "string"
            ? manifest.extensions.marketplaceRegistryRowId
            : "mkt-foundation-primary-channel",
        supportedProtocols: ["rest"],
        supportedFeatures: ["health_probe"],
        pillowGovernance: true,
        extensions: manifest.extensions,
        lifecyclePhase: "discover",
        healthStatus: "unknown" as MarketplaceHealthStatus,
        registeredAt: manifest.registeredAt ?? nowIso(),
      });
    }

    return {
      discoveredCount: this.records.size,
      plugins: [...this.records.values()],
      generatedAt: nowIso(),
    };
  }

  registerPlugin(
    input: {
      actorId: string;
      workspaceId: string;
      pillowGovernance: true;
    },
    manifest: MarketplacePluginManifest,
  ): { accepted: boolean; pluginId: string; message: string } {
    const structure = validateMarketplacePluginManifestStructure(manifest);
    if (!structure.allowed) {
      return { accepted: false, pluginId: manifest.pluginId, message: structure.reason };
    }

    const governance = validateMarketplacePillowGovernance({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      marketplaceId: manifest.marketplaceRegistryRowId,
      operation: "register",
      pillowGovernance: true,
    });

    if (!governance.allowed) {
      return { accepted: false, pluginId: manifest.pluginId, message: governance.reason };
    }

    const marketplace = resolveMarketplaceRowById(
      { workspaceId: input.workspaceId },
      manifest.marketplaceRegistryRowId,
    );
    if (!marketplace?.pluginSupport.allowPluginRegistration) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        message: "Target marketplace registry row does not allow plugin registration",
      };
    }

    if (this.records.has(manifest.pluginId)) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        message: `Marketplace plugin already registered: ${manifest.pluginId}`,
      };
    }

    const frameworkResult = getRegistryLoader().registerPlugin({
      pluginId: manifest.pluginId,
      kind: MARKETPLACE_PLUGIN_KIND,
      targetRegistryId: REG_MARKETPLACE,
      tier: "platform_catalog",
      version: manifest.version,
      description: manifest.pluginName,
      extensions: {
        ...manifest.extensions,
        marketplaceRegistryRowId: manifest.marketplaceRegistryRowId,
        supportedProtocols: manifest.supportedProtocols,
        supportedFeatures: manifest.supportedFeatures,
      },
    });

    if (!frameworkResult.accepted) {
      return frameworkResult;
    }

    this.records.set(manifest.pluginId, {
      ...manifest,
      lifecyclePhase: "register",
      healthStatus: "unknown",
      registeredAt: nowIso(),
    });

    return {
      accepted: true,
      pluginId: manifest.pluginId,
      message: "Marketplace plugin registered via framework host",
    };
  }

  listPlugins(): MarketplacePluginRecord[] {
    return [...this.records.values()];
  }
}

let sharedHost: MarketplacePluginHost | undefined;

export function getMarketplacePluginHost(): MarketplacePluginHost {
  if (!sharedHost) {
    sharedHost = new MarketplacePluginHost();
  }
  return sharedHost;
}

export function resetMarketplacePluginHostForTests(): void {
  sharedHost = undefined;
}
