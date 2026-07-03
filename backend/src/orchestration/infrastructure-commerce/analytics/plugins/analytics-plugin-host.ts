/**
 * G2-07 — Analytics plugin host (dynamic catalog + framework registration only).
 */

import { getRegistryLoader } from "../../../../registry/registry-loader.js";
import type { RegistryPluginKind } from "../../../../registry/types/plugin-manifest.js";
import { REG_COMMERCE_POLICY } from "../../../../registry/types/registry-ids.js";
import type {
  AnalyticsHealthStatus,
  AnalyticsPluginManifest,
  AnalyticsPluginRecord,
  AnalyticsProviderRow,
} from "../contracts/analytics-integration-types.js";
import { ANALYTICS_INTEGRATION_VERSION } from "../contracts/analytics-integration-types.js";
import { registerAnalyticsProviderRow } from "../data/analytics-provider-store.js";
import {
  validateAnalyticsPillowGovernance,
  validateAnalyticsPluginManifestStructure,
} from "../governance/analytics-pillow-governance.js";
import { getAnalyticsProviderRowById } from "../data/analytics-provider-store.js";

const ANALYTICS_PLUGIN_KIND: RegistryPluginKind = "commerce_analytics";

function nowIso(): string {
  return new Date().toISOString();
}

export class AnalyticsPluginHost {
  private readonly records = new Map<string, AnalyticsPluginRecord>();

  discoverPlugins(input: {
    actorId: string;
    workspaceId: string;
    pillowGovernance: true;
  }): { discoveredCount: number; plugins: AnalyticsPluginRecord[]; generatedAt: string } {
    const governance = validateAnalyticsPillowGovernance({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      analyticsId: "analytics-foundation-operational-primary",
      operation: "discover",
      pillowGovernance: true,
    });

    if (!governance.allowed) {
      return { discoveredCount: 0, plugins: [], generatedAt: nowIso() };
    }

    const frameworkPlugins = getRegistryLoader()
      .listRegisteredPlugins()
      .filter((manifest) => manifest.kind === ANALYTICS_PLUGIN_KIND);

    for (const manifest of frameworkPlugins) {
      if (this.records.has(manifest.pluginId)) continue;
      this.records.set(manifest.pluginId, {
        pluginId: manifest.pluginId,
        pluginName: manifest.description,
        version: manifest.version,
        analyticsProviderRowId:
          typeof manifest.extensions.analyticsProviderRowId === "string"
            ? manifest.extensions.analyticsProviderRowId
            : "analytics-foundation-operational-primary",
        aggregationModes: ["batch"],
        supportedMetrics: [],
        pillowGovernance: true,
        extensions: manifest.extensions,
        lifecyclePhase: "capture",
        healthStatus: "unknown" as AnalyticsHealthStatus,
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
    manifest: AnalyticsPluginManifest,
  ): { accepted: boolean; pluginId: string; message: string } {
    const structure = validateAnalyticsPluginManifestStructure(manifest);
    if (!structure.allowed) {
      return { accepted: false, pluginId: manifest.pluginId, message: structure.reason };
    }

    const governance = validateAnalyticsPillowGovernance({
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      analyticsId: manifest.analyticsProviderRowId,
      operation: "capture",
      pillowGovernance: true,
    });

    if (!governance.allowed) {
      return { accepted: false, pluginId: manifest.pluginId, message: governance.reason };
    }

    const provider = getAnalyticsProviderRowById(manifest.analyticsProviderRowId);
    if (!provider?.pluginSupport.allowPluginRegistration) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        message: "Target analytics provider does not allow plugin registration",
      };
    }

    if (this.records.has(manifest.pluginId)) {
      return {
        accepted: false,
        pluginId: manifest.pluginId,
        message: `Analytics plugin already registered: ${manifest.pluginId}`,
      };
    }

    const frameworkResult = getRegistryLoader().registerPlugin({
      pluginId: manifest.pluginId,
      kind: ANALYTICS_PLUGIN_KIND,
      targetRegistryId: REG_COMMERCE_POLICY,
      tier: "platform_catalog",
      version: manifest.version,
      description: manifest.pluginName,
      extensions: {
        ...manifest.extensions,
        analyticsProviderRowId: manifest.analyticsProviderRowId,
        aggregationModes: manifest.aggregationModes,
        supportedMetrics: manifest.supportedMetrics,
      },
    });

    if (!frameworkResult.accepted) {
      return frameworkResult;
    }

    const dynamicProvider: AnalyticsProviderRow = {
      id: `analytics-plugin-${manifest.pluginId}`,
      name: manifest.pluginName,
      description: `Dynamically registered analytics plugin: ${manifest.pluginId}`,
      status: "VALIDATED",
      version: manifest.version,
      owner: "pillow:governance",
      dependencies: [provider.policyRef ?? "pol-foundation-commerce-default"],
      capabilities: ["collect", "publish"],
      configuration: {
        integrationFramework: {
          schemaVersion: ANALYTICS_INTEGRATION_VERSION,
          aggregationModes: manifest.aggregationModes,
          supportedMetrics: manifest.supportedMetrics,
          supportedEvents: [
            {
              eventRef: `evt-plugin-${manifest.pluginId}`,
              category: "operational_metrics" as const,
              supported: true,
            },
          ],
          retentionPolicy: {
            retentionDays: 90,
            policyRef: provider.policyRef,
          },
          domainContracts: {
            event_collection: { contractVersion: ANALYTICS_INTEGRATION_VERSION, supported: false },
            metric_collection: { contractVersion: ANALYTICS_INTEGRATION_VERSION, supported: true },
            aggregation: { contractVersion: ANALYTICS_INTEGRATION_VERSION, supported: true },
            normalisation: { contractVersion: ANALYTICS_INTEGRATION_VERSION, supported: true },
            time_series_recording: { contractVersion: ANALYTICS_INTEGRATION_VERSION, supported: true },
            business_kpi_publication: { contractVersion: ANALYTICS_INTEGRATION_VERSION, supported: true },
            executive_metric_publication: {
              contractVersion: ANALYTICS_INTEGRATION_VERSION,
              supported: false,
            },
          },
        },
      },
      supportedRegions: provider.supportedRegions,
      supportedCountries: provider.supportedCountries,
      policyRef: provider.policyRef,
      pluginSupport: { allowPluginRegistration: false, pluginKind: "commerce_analytics" },
    };
    registerAnalyticsProviderRow(dynamicProvider);

    this.records.set(manifest.pluginId, {
      ...manifest,
      lifecyclePhase: "capture",
      healthStatus: "unknown",
      registeredAt: nowIso(),
    });

    return {
      accepted: true,
      pluginId: manifest.pluginId,
      message: "Analytics plugin registered via framework host",
    };
  }

  listPlugins(): AnalyticsPluginRecord[] {
    return [...this.records.values()];
  }
}

let sharedHost: AnalyticsPluginHost | undefined;

export function getAnalyticsPluginHost(): AnalyticsPluginHost {
  if (!sharedHost) {
    sharedHost = new AnalyticsPluginHost();
  }
  return sharedHost;
}

export function resetAnalyticsPluginHostForTests(): void {
  sharedHost = undefined;
}
