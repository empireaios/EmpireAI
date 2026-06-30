import type { AmazonMissionControlDashboard } from "../models/amazon-dashboard.js";
import { buildAmazonCapabilityProfile } from "./amazon-capability-profile-service.js";
import { listListingEvaluations } from "./amazon-readiness-service.js";
import { getAmazonListingRepository } from "../repositories/sqlite-amazon-listing-repository.js";
import { getConnectorRuntimeState } from "../../../orchestration/reality-integration/services/connector-runtime.js";
import { getRuntimePluginRegistry } from "../../plugins/registry/runtime-plugin-registry.js";

const AMAZON_PLUGIN_ID = "amazon-seller";

/** RS-005 — Amazon Mission Control dashboard. */
export function buildAmazonMissionControlDashboard(
  workspaceId: string,
  companyId: string,
): AmazonMissionControlDashboard {
  const profile = buildAmazonCapabilityProfile();
  const runtimeState = getConnectorRuntimeState(workspaceId, AMAZON_PLUGIN_ID);
  const registry = getRuntimePluginRegistry();
  const plugin = registry.getPlugin(AMAZON_PLUGIN_ID);
  const pluginManifest = plugin?.manifest;
  const enabled = registry.listEnabledPlugins().some((p) => p.pluginId === AMAZON_PLUGIN_ID);

  const evaluations = listListingEvaluations(workspaceId, companyId);
  const listings = getAmazonListingRepository().listListings(workspaceId, companyId);

  const productsReady = evaluations
    .filter((e) => e.ready)
    .map((e) => ({ listingId: e.listingId, sku: e.sku, publishReadinessPercent: e.publishReadinessPercent }));

  const productsBlocked = evaluations
    .filter((e) => !e.ready)
    .map((e) => ({
      listingId: e.listingId,
      sku: e.sku,
      reason: e.complianceRisks[0] ?? e.missingInformation[0] ?? "Incomplete listing",
    }));

  const avgPercent = evaluations.length
    ? Math.round(evaluations.reduce((s, e) => s + e.publishReadinessPercent, 0) / evaluations.length)
    : 0;

  let nextHumanAction: string | null = null;
  if (!runtimeState || runtimeState.lifecycle === "DISCOVERED") {
    nextHumanAction = "Connect Amazon Seller account via Seller Central OAuth";
  } else if (!enabled) {
    nextHumanAction = "Enable Amazon Runtime Plugin in Commerce Runtime";
  } else {
    const blockedEval = evaluations.find((e) => e.requiredHumanActions.length > 0);
    nextHumanAction = blockedEval?.requiredHumanActions[0] ?? (listings.length === 0 ? "Create first Amazon listing package" : null);
  }

  const accountConnected = runtimeState != null && !["DISCOVERED", "REVOKED", "DISCONNECTED"].includes(runtimeState.lifecycle);
  const pluginReady = enabled && pluginManifest != null;
  const hasReadyListing = productsReady.length > 0;

  const commercialReadinessPercent = Math.min(100, Math.round(
    (accountConnected ? 30 : 0) +
    (pluginReady ? 25 : 0) +
    (hasReadyListing ? 25 : 0) +
    (avgPercent >= 80 ? 20 : avgPercent * 0.2),
  ));

  return {
    moduleId: "amazon-global-seller",
    missionId: "RS-001-RS-005",
    amazonAccountStatus: {
      connected: accountConnected,
      lifecycle: runtimeState?.lifecycle ?? "DISCOVERED",
      providerId: "amazon-seller",
    },
    amazonRuntimeStatus: {
      pluginId: AMAZON_PLUGIN_ID,
      enabled,
      certificationState: pluginManifest?.certificationState ?? "UNCERTIFIED",
      executionState: pluginManifest?.executionState ?? "ARCHITECTURE_ONLY",
      capabilitiesDeclared: pluginManifest?.capabilities.length ?? profile.domains.length,
    },
    listingReadiness: {
      averagePercent: avgPercent,
      readyCount: productsReady.length,
      blockedCount: productsBlocked.length,
    },
    productsReady,
    productsBlocked,
    nextHumanAction,
    commercialReadinessPercent,
    computedAt: new Date().toISOString(),
  };
}

export function buildEsisAmazonPayload(workspaceId: string, companyId: string) {
  const dash = buildAmazonMissionControlDashboard(workspaceId, companyId);
  return {
    module: "amazon-global-seller",
    commercialReadinessPercent: dash.commercialReadinessPercent,
    accountConnected: dash.amazonAccountStatus.connected,
    listingsReady: dash.listingReadiness.readyCount,
  };
}
