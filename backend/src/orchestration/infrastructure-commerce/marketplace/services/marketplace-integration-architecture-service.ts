/**
 * P8-03 — Unified marketplace integration architecture service.
 * Consolidates G2-02 discovery with P8 connector catalog — single canonical layer.
 */

import type { RegistryLoaderContext } from "../../../../registry/types/registry-types.js";
import {
  MARKETPLACE_CONNECTOR_CATALOG,
  MARKETPLACE_FAILURE_RECOVERY_MAPPINGS,
} from "../data/marketplace-connector-catalog.js";
import type {
  MarketplaceConnectorDefinition,
  MarketplaceConnectorRuntimeSnapshot,
  MarketplaceConnectorStatus,
  MarketplaceFailureRecoveryMapping,
  MarketplaceIntegrationPipelinePhase,
  MarketplaceSyncDomain,
} from "../contracts/marketplace-connector-model.js";
import {
  MARKETPLACE_INTEGRATION_PIPELINE,
  MARKETPLACE_SYNC_DOMAINS,
  MARKETPLACE_INTEGRATION_ARCHITECTURE_VERSION,
} from "../contracts/marketplace-connector-model.js";
import { discoverMarketplaces, getMarketplaceHealthSnapshot } from "./marketplace-integration-service.js";

export const MARKETPLACE_COCKPIT_VIEW_ID = "cockpit-commerce-marketplace-integration" as const;

export type MarketplaceIntegrationArchitectureSnapshot = {
  architectureVersion: typeof MARKETPLACE_INTEGRATION_ARCHITECTURE_VERSION;
  computedAt: string;
  pipeline: readonly MarketplaceIntegrationPipelinePhase[];
  syncDomains: readonly MarketplaceSyncDomain[];
  connectorCount: number;
  connectedCount: number;
  degradedCount: number;
  failureCount: number;
  connectors: MarketplaceConnectorRuntimeSnapshot[];
  connectorDefinitions: MarketplaceConnectorDefinition[];
  failureRecoveryMappings: MarketplaceFailureRecoveryMapping[];
  executiveSummary: string;
  pillowRecommendations: string[];
  eccCoordinationNotes: string[];
  supervisorNotes: string[];
  guardianNotes: string[];
  discoverySource: "marketplace-integration-architecture:p8-03";
};

export type MarketplaceCockpitIntegrationView = {
  viewId: typeof MARKETPLACE_COCKPIT_VIEW_ID;
  screenId: "SCR-205";
  computedAt: string;
  dataMode: "live";
  architecture: MarketplaceIntegrationArchitectureSnapshot;
};

function resolveConnectorStatus(
  connectorId: string,
  context: RegistryLoaderContext,
): Pick<
  MarketplaceConnectorRuntimeSnapshot,
  "status" | "connectionStatus" | "syncStatus" | "healthStatus" | "pipelinePhase" | "currentFailures" | "recoveryStatus"
> {
  const health = getMarketplaceHealthSnapshot(context, connectorId).healthStatus;
  const registryMatch = discoverMarketplaces(context).marketplaces.find(
    (m) => m.marketplaceId === connectorId || m.providerRef === connectorId,
  );

  let status: MarketplaceConnectorStatus = "architecture_ready";
  let connectionStatus: MarketplaceConnectorRuntimeSnapshot["connectionStatus"] = "disconnected";
  let syncStatus: MarketplaceConnectorRuntimeSnapshot["syncStatus"] = "idle";
  let pipelinePhase: MarketplaceIntegrationPipelinePhase = "marketplace_selected";

  if (connectorId === "amazon") {
    status = "credentials_pending";
    connectionStatus = "connecting";
    pipelinePhase = "authentication";
  }

  if (registryMatch?.status === "connected") {
    status = "connected";
    connectionStatus = "connected";
    syncStatus = "syncing";
    pipelinePhase = "continuous_monitoring";
  }

  if (health === "degraded" || health === "unhealthy") {
    status = "degraded";
    syncStatus = "degraded";
  }

  const healthStatus =
    health === "healthy"
      ? "healthy"
      : health === "degraded"
        ? "degraded"
        : health === "unhealthy"
          ? "unhealthy"
          : "unknown";

  return {
    status,
    connectionStatus,
    syncStatus,
    healthStatus,
    pipelinePhase,
    currentFailures: health === "degraded" ? (["api_failure"] as const) : [],
    recoveryStatus: health === "degraded" ? "in_progress" : "none",
  };
}

function buildConnectorSnapshot(
  definition: MarketplaceConnectorDefinition,
  context: RegistryLoaderContext,
): MarketplaceConnectorRuntimeSnapshot {
  const runtime = resolveConnectorStatus(definition.connectorId, context);
  const activeSyncDomains = MARKETPLACE_SYNC_DOMAINS.filter((domain) => {
    if (domain === "products" || domain === "inventory") {
      return definition.supportedCapabilities.includes("catalogue_import") ||
        definition.supportedCapabilities.includes("inventory_synchronization");
    }
    if (domain === "orders") return definition.supportedCapabilities.includes("order_synchronization");
    if (domain === "customers") return definition.supportedCapabilities.includes("customer_synchronization");
    if (domain === "shipments") return definition.supportedCapabilities.includes("shipment_tracking");
    if (domain === "analytics") return definition.supportedCapabilities.includes("analytics");
    return domain === "status" || domain === "pricing";
  });

  return {
    connectorId: definition.connectorId,
    displayName: definition.displayName,
    activeSyncDomains,
    productCount: 0,
    orderCount: 0,
    inventoryLevel: null,
    lastSyncAt: null,
    performanceScore: runtime.healthStatus === "healthy" ? 85 : runtime.healthStatus === "degraded" ? 55 : 30,
    ...runtime,
  };
}

export function buildMarketplaceIntegrationArchitectureSnapshot(
  context: RegistryLoaderContext = {},
): MarketplaceIntegrationArchitectureSnapshot {
  const connectors = MARKETPLACE_CONNECTOR_CATALOG.map((def) => buildConnectorSnapshot(def, context));
  const connectedCount = connectors.filter((c) => c.connectionStatus === "connected").length;
  const degradedCount = connectors.filter((c) => c.status === "degraded").length;
  const failureCount = connectors.reduce((n, c) => n + c.currentFailures.length, 0);

  const pillowRecommendations = [
    connectedCount === 0
      ? "Complete Amazon OAuth to activate first live marketplace connector"
      : "Expand to Shopify or TikTok Shop for channel diversification",
    degradedCount > 0 ? "Review degraded connectors — Pillow recommends recovery before publish" : "All connectors within acceptable health band",
    "Registry-first: add future marketplaces via REG-MARKETPLACE without architecture redesign",
  ];

  return {
    architectureVersion: MARKETPLACE_INTEGRATION_ARCHITECTURE_VERSION,
    computedAt: new Date().toISOString(),
    pipeline: MARKETPLACE_INTEGRATION_PIPELINE,
    syncDomains: MARKETPLACE_SYNC_DOMAINS,
    connectorCount: connectors.length,
    connectedCount,
    degradedCount,
    failureCount,
    connectors,
    connectorDefinitions: [...MARKETPLACE_CONNECTOR_CATALOG],
    failureRecoveryMappings: [...MARKETPLACE_FAILURE_RECOVERY_MAPPINGS],
    executiveSummary:
      connectedCount > 0
        ? `${connectedCount}/${connectors.length} marketplace connectors active · unified P8-03 architecture`
        : `${connectors.length} replaceable connectors registered · architecture ready · awaiting credentials`,
    pillowRecommendations,
    eccCoordinationNotes: [
      "ECC schedules sync by priority: orders > inventory > catalogue > analytics",
      "Dependency resolution: authentication before catalogue before publish",
    ],
    supervisorNotes: [
      `Supervising ${connectors.length} connector health records`,
      failureCount > 0 ? `${failureCount} active failure signals under recovery observation` : "No active sync failures",
    ],
    guardianNotes: [
      "Guardian monitors API latency, rate limits, and marketplace availability",
      degradedCount > 0 ? `${degradedCount} connectors in degraded Guardian band` : "Guardian band nominal",
    ],
    discoverySource: "marketplace-integration-architecture:p8-03",
  };
}

export function buildMarketplaceCockpitIntegrationView(
  context: RegistryLoaderContext = {},
): MarketplaceCockpitIntegrationView {
  return {
    viewId: MARKETPLACE_COCKPIT_VIEW_ID,
    screenId: "SCR-205",
    computedAt: new Date().toISOString(),
    dataMode: "live",
    architecture: buildMarketplaceIntegrationArchitectureSnapshot(context),
  };
}

export function getMarketplaceConnectorDefinition(
  connectorId: string,
): MarketplaceConnectorDefinition | undefined {
  return MARKETPLACE_CONNECTOR_CATALOG.find((c) => c.connectorId === connectorId);
}

export function listMarketplaceConnectorDefinitions(): readonly MarketplaceConnectorDefinition[] {
  return MARKETPLACE_CONNECTOR_CATALOG;
}

export function listMarketplaceIntegrationPipelinePhases(): readonly MarketplaceIntegrationPipelinePhase[] {
  return MARKETPLACE_INTEGRATION_PIPELINE;
}

export function listMarketplaceSyncDomains(): readonly MarketplaceSyncDomain[] {
  return MARKETPLACE_SYNC_DOMAINS;
}
