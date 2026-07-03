/**
 * G2-08 — Commerce orchestration plugin host.
 */

import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import type { RegistryPluginKind } from "../../../../registry/types/plugin-manifest.js";
import { REG_COMMERCE_POLICY } from "../../../../registry/types/registry-ids.js";
import type {
  CommerceHealthStatus,
  CommerceOrchestrationPluginManifest,
  CommerceOrchestrationPluginRecord,
} from "../contracts/commerce-orchestration-types.js";
import {
  validateCommerceOrchestrationPillowGovernance,
  validateCommerceOrchestrationPluginManifest,
} from "../governance/commerce-orchestration-pillow-governance.js";
import { getCommerceOrchestrationProfileById } from "../data/commerce-orchestration-profile-store.js";

const ORCHESTRATION_PLUGIN_KIND: RegistryPluginKind = "commerce_orchestration";

function nowIso(): string {
  return new Date().toISOString();
}

export class CommerceOrchestrationPluginHost {
  private readonly records = new Map<string, CommerceOrchestrationPluginRecord>();

  registerPlugin(
    input: { actorId: string; workspaceId: string; pillowGovernance: true; brainRouted: true },
    manifest: CommerceOrchestrationPluginManifest,
  ): { accepted: boolean; pluginId: string; message: string } {
    const structure = validateCommerceOrchestrationPluginManifest(manifest);
    if (!structure.allowed) {
      return { accepted: false, pluginId: manifest.pluginId, message: structure.reason };
    }

    const governance = validateCommerceOrchestrationPillowGovernance({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      profileId: manifest.orchestrationProfileId,
      operation: "prepare",
      pillowGovernance: true,
      brainRouted: true,
    });

    if (!governance.allowed) {
      return { accepted: false, pluginId: manifest.pluginId, message: governance.reason };
    }

    const profile = getCommerceOrchestrationProfileById(manifest.orchestrationProfileId);
    if (!profile?.pluginSupport.allowPluginRegistration) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        message: "Target orchestration profile does not allow plugin registration",
      };
    }

    if (this.records.has(manifest.pluginId)) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        message: `Orchestration plugin already registered: ${manifest.pluginId}`,
      };
    }

    const frameworkResult = getRegistryLoader().registerPlugin({
      pluginId: manifest.pluginId,
      kind: ORCHESTRATION_PLUGIN_KIND,
      targetRegistryId: REG_COMMERCE_POLICY,
      tier: "platform_catalog",
      version: manifest.version,
      description: manifest.pluginName,
      extensions: {
        ...manifest.extensions,
        orchestrationProfileId: manifest.orchestrationProfileId,
        pluginRole: manifest.pluginRole,
        coordinationCapabilities: manifest.coordinationCapabilities,
      },
    });

    if (!frameworkResult.accepted) {
      return frameworkResult;
    }

    this.records.set(manifest.pluginId, {
      ...manifest,
      lifecyclePhase: "prepare",
      healthStatus: "unknown" as CommerceHealthStatus,
      registeredAt: nowIso(),
    });

    return {
      accepted: true,
      pluginId: manifest.pluginId,
      message: "Commerce orchestration plugin registered via framework host",
    };
  }

  listPlugins(): CommerceOrchestrationPluginRecord[] {
    return [...this.records.values()];
  }
}

let sharedHost: CommerceOrchestrationPluginHost | undefined;

export function getCommerceOrchestrationPluginHost(): CommerceOrchestrationPluginHost {
  if (!sharedHost) sharedHost = new CommerceOrchestrationPluginHost();
  return sharedHost;
}

export function resetCommerceOrchestrationPluginHostForTests(): void {
  sharedHost = undefined;
}
