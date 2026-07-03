/**
 * G2-03 — Supplier plugin host (registry + framework registration only).
 */

import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import type { RegistryPluginKind } from "../../../../registry/types/plugin-manifest.js";
import { REG_SUPPLIER } from "../../../../registry/types/registry-ids.js";
import type {
  SupplierHealthStatus,
  SupplierPluginManifest,
  SupplierPluginRecord,
} from "../contracts/supplier-integration-types.js";
import {
  validateSupplierPillowGovernance,
  validateSupplierPluginManifestStructure,
} from "../governance/supplier-pillow-governance.js";
import { resolveSupplierRowById } from "../registry/supplier-registry-resolver.js";

const SUPPLIER_PLUGIN_KIND: RegistryPluginKind = "commerce_supplier";

function nowIso(): string {
  return new Date().toISOString();
}

export class SupplierPluginHost {
  private readonly records = new Map<string, SupplierPluginRecord>();

  discoverPlugins(input: {
    actorId: string;
    workspaceId: string;
    pillowGovernance: true;
  }): { discoveredCount: number; plugins: SupplierPluginRecord[]; generatedAt: string } {
    const governance = validateSupplierPillowGovernance({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      supplierId: "sup-foundation-primary-fulfillment",
      operation: "discover",
      pillowGovernance: true,
    });

    if (!governance.allowed) {
      return { discoveredCount: 0, plugins: [], generatedAt: nowIso() };
    }

    const frameworkPlugins = getRegistryLoader()
      .listRegisteredPlugins()
      .filter((manifest) => manifest.kind === SUPPLIER_PLUGIN_KIND);

    for (const manifest of frameworkPlugins) {
      if (this.records.has(manifest.pluginId)) continue;
      this.records.set(manifest.pluginId, {
        pluginId: manifest.pluginId,
        pluginName: manifest.description,
        version: manifest.version,
        supplierRegistryRowId:
          typeof manifest.extensions.supplierRegistryRowId === "string"
            ? manifest.extensions.supplierRegistryRowId
            : "sup-foundation-primary-fulfillment",
        supportedProtocols: ["rest"],
        supportedFeatures: ["health_probe"],
        pillowGovernance: true,
        extensions: manifest.extensions,
        lifecyclePhase: "discover",
        healthStatus: "unknown" as SupplierHealthStatus,
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
    manifest: SupplierPluginManifest,
  ): { accepted: boolean; pluginId: string; message: string } {
    const structure = validateSupplierPluginManifestStructure(manifest);
    if (!structure.allowed) {
      return { accepted: false, pluginId: manifest.pluginId, message: structure.reason };
    }

    const governance = validateSupplierPillowGovernance({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      supplierId: manifest.supplierRegistryRowId,
      operation: "register",
      pillowGovernance: true,
    });

    if (!governance.allowed) {
      return { accepted: false, pluginId: manifest.pluginId, message: governance.reason };
    }

    const supplier = resolveSupplierRowById(
      { workspaceId: input.workspaceId },
      manifest.supplierRegistryRowId,
    );
    if (!supplier?.pluginSupport.allowPluginRegistration) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        message: "Target supplier registry row does not allow plugin registration",
      };
    }

    if (this.records.has(manifest.pluginId)) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        message: `Supplier plugin already registered: ${manifest.pluginId}`,
      };
    }

    const frameworkResult = getRegistryLoader().registerPlugin({
      pluginId: manifest.pluginId,
      kind: SUPPLIER_PLUGIN_KIND,
      targetRegistryId: REG_SUPPLIER,
      tier: "platform_catalog",
      version: manifest.version,
      description: manifest.pluginName,
      extensions: {
        ...manifest.extensions,
        supplierRegistryRowId: manifest.supplierRegistryRowId,
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
      message: "Supplier plugin registered via framework host",
    };
  }

  listPlugins(): SupplierPluginRecord[] {
    return [...this.records.values()];
  }
}

let sharedHost: SupplierPluginHost | undefined;

export function getSupplierPluginHost(): SupplierPluginHost {
  if (!sharedHost) {
    sharedHost = new SupplierPluginHost();
  }
  return sharedHost;
}

export function resetSupplierPluginHostForTests(): void {
  sharedHost = undefined;
}
