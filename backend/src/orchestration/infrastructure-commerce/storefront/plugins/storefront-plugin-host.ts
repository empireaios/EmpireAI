/**
 * G2-04 — Storefront plugin host (registry + framework registration only).
 */

import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import type { RegistryPluginKind } from "../../../../registry/types/plugin-manifest.js";
import { REG_STOREFRONT } from "../../../../registry/types/registry-ids.js";
import type {
  StorefrontHealthStatus,
  StorefrontPluginManifest,
  StorefrontPluginRecord,
} from "../contracts/storefront-integration-types.js";
import {
  validateStorefrontPillowGovernance,
  validateStorefrontPluginManifestStructure,
} from "../governance/storefront-pillow-governance.js";
import { resolveStorefrontRowById } from "../registry/storefront-registry-resolver.js";

const STOREFRONT_PLUGIN_KIND: RegistryPluginKind = "commerce_storefront";

function nowIso(): string {
  return new Date().toISOString();
}

export class StorefrontPluginHost {
  private readonly records = new Map<string, StorefrontPluginRecord>();

  discoverPlugins(input: {
    actorId: string;
    workspaceId: string;
    pillowGovernance: true;
  }): { discoveredCount: number; plugins: StorefrontPluginRecord[]; generatedAt: string } {
    const governance = validateStorefrontPillowGovernance({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      storefrontId: "sto-foundation-managed-storefront",
      operation: "discover",
      pillowGovernance: true,
    });

    if (!governance.allowed) {
      return { discoveredCount: 0, plugins: [], generatedAt: nowIso() };
    }

    const frameworkPlugins = getRegistryLoader()
      .listRegisteredPlugins()
      .filter((manifest) => manifest.kind === STOREFRONT_PLUGIN_KIND);

    for (const manifest of frameworkPlugins) {
      if (this.records.has(manifest.pluginId)) continue;
      this.records.set(manifest.pluginId, {
        pluginId: manifest.pluginId,
        pluginName: manifest.description,
        version: manifest.version,
        storefrontRegistryRowId:
          typeof manifest.extensions.storefrontRegistryRowId === "string"
            ? manifest.extensions.storefrontRegistryRowId
            : "sto-foundation-managed-storefront",
        channelModel: "hosted",
        publishingCapabilities: ["product_publish"],
        pillowGovernance: true,
        extensions: manifest.extensions,
        lifecyclePhase: "discover",
        healthStatus: "unknown" as StorefrontHealthStatus,
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
    manifest: StorefrontPluginManifest,
  ): { accepted: boolean; pluginId: string; message: string } {
    const structure = validateStorefrontPluginManifestStructure(manifest);
    if (!structure.allowed) {
      return { accepted: false, pluginId: manifest.pluginId, message: structure.reason };
    }

    const governance = validateStorefrontPillowGovernance({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      storefrontId: manifest.storefrontRegistryRowId,
      operation: "register",
      pillowGovernance: true,
    });

    if (!governance.allowed) {
      return { accepted: false, pluginId: manifest.pluginId, message: governance.reason };
    }

    const storefront = resolveStorefrontRowById(
      { workspaceId: input.workspaceId },
      manifest.storefrontRegistryRowId,
    );
    if (!storefront?.pluginSupport.allowPluginRegistration) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        message: "Target storefront registry row does not allow plugin registration",
      };
    }

    if (this.records.has(manifest.pluginId)) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        message: `Storefront plugin already registered: ${manifest.pluginId}`,
      };
    }

    const frameworkResult = getRegistryLoader().registerPlugin({
      pluginId: manifest.pluginId,
      kind: STOREFRONT_PLUGIN_KIND,
      targetRegistryId: REG_STOREFRONT,
      tier: "platform_catalog",
      version: manifest.version,
      description: manifest.pluginName,
      extensions: {
        ...manifest.extensions,
        storefrontRegistryRowId: manifest.storefrontRegistryRowId,
        channelModel: manifest.channelModel,
        publishingCapabilities: manifest.publishingCapabilities,
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
      message: "Storefront plugin registered via framework host",
    };
  }

  listPlugins(): StorefrontPluginRecord[] {
    return [...this.records.values()];
  }
}

let sharedHost: StorefrontPluginHost | undefined;

export function getStorefrontPluginHost(): StorefrontPluginHost {
  if (!sharedHost) {
    sharedHost = new StorefrontPluginHost();
  }
  return sharedHost;
}

export function resetStorefrontPluginHostForTests(): void {
  sharedHost = undefined;
}
