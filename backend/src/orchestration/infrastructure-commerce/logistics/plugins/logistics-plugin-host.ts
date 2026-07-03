/**
 * G2-06 — Logistics plugin host (registry + framework registration only).
 */

import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import type { RegistryPluginKind } from "../../../../registry/types/plugin-manifest.js";
import { REG_LOGISTICS } from "../../../../registry/types/registry-ids.js";
import type {
  LogisticsHealthStatus,
  LogisticsPluginManifest,
  LogisticsPluginRecord,
} from "../contracts/logistics-integration-types.js";
import {
  validateLogisticsPillowGovernance,
  validateLogisticsPluginManifestStructure,
} from "../governance/logistics-pillow-governance.js";
import { resolveLogisticsRowById } from "../registry/logistics-registry-resolver.js";

const LOGISTICS_PLUGIN_KIND: RegistryPluginKind = "commerce_logistics";

function nowIso(): string {
  return new Date().toISOString();
}

export class LogisticsPluginHost {
  private readonly records = new Map<string, LogisticsPluginRecord>();

  discoverPlugins(input: {
    actorId: string;
    workspaceId: string;
    pillowGovernance: true;
  }): { discoveredCount: number; plugins: LogisticsPluginRecord[]; generatedAt: string } {
    const governance = validateLogisticsPillowGovernance({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      providerId: "log-foundation-carrier-primary",
      operation: "discover",
      pillowGovernance: true,
    });

    if (!governance.allowed) {
      return { discoveredCount: 0, plugins: [], generatedAt: nowIso() };
    }

    const frameworkPlugins = getRegistryLoader()
      .listRegisteredPlugins()
      .filter((manifest) => manifest.kind === LOGISTICS_PLUGIN_KIND);

    for (const manifest of frameworkPlugins) {
      if (this.records.has(manifest.pluginId)) continue;
      this.records.set(manifest.pluginId, {
        pluginId: manifest.pluginId,
        pluginName: manifest.description,
        version: manifest.version,
        logisticsRegistryRowId:
          typeof manifest.extensions.logisticsRegistryRowId === "string"
            ? manifest.extensions.logisticsRegistryRowId
            : "log-foundation-carrier-primary",
        providerKind: "courier",
        shippingServices: [{ serviceId: "generic-ship", serviceKind: "courier", supported: true }],
        pillowGovernance: true,
        extensions: manifest.extensions,
        lifecyclePhase: "discover",
        healthStatus: "unknown" as LogisticsHealthStatus,
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
    manifest: LogisticsPluginManifest,
  ): { accepted: boolean; pluginId: string; message: string } {
    const structure = validateLogisticsPluginManifestStructure(manifest);
    if (!structure.allowed) {
      return { accepted: false, pluginId: manifest.pluginId, message: structure.reason };
    }

    const governance = validateLogisticsPillowGovernance({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      providerId: manifest.logisticsRegistryRowId,
      operation: "register",
      pillowGovernance: true,
    });

    if (!governance.allowed) {
      return { accepted: false, pluginId: manifest.pluginId, message: governance.reason };
    }

    const logistics = resolveLogisticsRowById(
      { workspaceId: input.workspaceId },
      manifest.logisticsRegistryRowId,
    );
    if (!logistics?.pluginSupport.allowPluginRegistration) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        message: "Target logistics registry row does not allow plugin registration",
      };
    }

    if (this.records.has(manifest.pluginId)) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        message: `Logistics plugin already registered: ${manifest.pluginId}`,
      };
    }

    const frameworkResult = getRegistryLoader().registerPlugin({
      pluginId: manifest.pluginId,
      kind: LOGISTICS_PLUGIN_KIND,
      targetRegistryId: REG_LOGISTICS,
      tier: "platform_catalog",
      version: manifest.version,
      description: manifest.pluginName,
      extensions: {
        ...manifest.extensions,
        logisticsRegistryRowId: manifest.logisticsRegistryRowId,
        providerKind: manifest.providerKind,
        shippingServices: manifest.shippingServices,
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
      message: "Logistics plugin registered via framework host",
    };
  }

  listPlugins(): LogisticsPluginRecord[] {
    return [...this.records.values()];
  }
}

let sharedHost: LogisticsPluginHost | undefined;

export function getLogisticsPluginHost(): LogisticsPluginHost {
  if (!sharedHost) {
    sharedHost = new LogisticsPluginHost();
  }
  return sharedHost;
}

export function resetLogisticsPluginHostForTests(): void {
  sharedHost = undefined;
}
