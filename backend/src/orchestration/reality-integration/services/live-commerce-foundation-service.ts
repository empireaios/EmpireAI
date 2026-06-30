import type { LiveCommerceFoundationDashboard } from "../models/live-commerce-foundation.js";
import { LIVE_COMMERCE_MARKETPLACE_PROVIDER_IDS } from "../models/live-commerce-foundation.js";
import { buildCredentialGovernanceSummary } from "./credential-governance-service.js";
import { buildOperationalAccessRegistry } from "./operational-access-registry-service.js";
import { listRuntimeActivationAssessments } from "./runtime-activation-service.js";
import { verifyLiveCommerceMarketplaceCapabilities } from "./provider-capability-verification-service.js";

/** REAL-002A — Live Commerce Foundation dashboard (Amazon first, global by design). */
export function buildLiveCommerceFoundationDashboard(
  workspaceId: string,
): LiveCommerceFoundationDashboard {
  const registry = buildOperationalAccessRegistry(workspaceId);
  const credentialHealth = buildCredentialGovernanceSummary(workspaceId);
  const activations = listRuntimeActivationAssessments(workspaceId);

  return {
    moduleId: "reality-integration",
    missionId: "REAL-002A",
    amazonFirst: true,
    globalByDesign: true,
    marketplaceProviders: [...LIVE_COMMERCE_MARKETPLACE_PROVIDER_IDS],
    operationalAccessSummary: {
      totalPlatforms: registry.summary.totalPlatforms,
      connected: registry.records.filter((r) =>
        ["CONNECTED", "VERIFIED", "READY", "ACTIVE", "DEGRADED"].includes(r.connectionStatus),
      ).length,
      verified: registry.records.filter((r) => r.verificationStatus === "VERIFIED").length,
      active: registry.summary.active,
      blocked: registry.summary.blocked,
      awaitingApproval: registry.summary.awaitingApproval,
    },
    credentialHealth: {
      total: credentialHealth.totalCredentials,
      verified: credentialHealth.verifiedCredentials,
      expiringSoon: credentialHealth.expiringWithin7Days,
      revoked: credentialHealth.revokedCredentials,
    },
    activationReadiness: {
      eligible: activations.filter((a) => a.activated).length,
      blocked: activations.filter((a) => a.blocked).length,
    },
    computedAt: new Date().toISOString(),
  };
}

export function buildEsisLiveCommercePayload(workspaceId: string) {
  const dash = buildLiveCommerceFoundationDashboard(workspaceId);
  const capabilities = verifyLiveCommerceMarketplaceCapabilities(workspaceId);
  return {
    module: "live-commerce-foundation",
    missionId: "REAL-002A",
    amazonFirst: dash.amazonFirst,
    operationalAccess: dash.operationalAccessSummary,
    credentialHealth: dash.credentialHealth,
    activationReadiness: dash.activationReadiness,
    amazonCapabilities: capabilities.find((c) => c.providerId === "amazon-seller") ?? null,
  };
}

export function buildExecutiveLiveCommerceSnapshot(workspaceId: string) {
  const registry = buildOperationalAccessRegistry(workspaceId);
  const activations = listRuntimeActivationAssessments(workspaceId);
  return {
    source: "reality-integration",
    missionId: "REAL-002A",
    operationalAccess: registry.summary,
    topBlockers: activations.flatMap((a) => a.blockers).slice(0, 5),
    amazonActivation: activations.find((a) => a.providerId === "amazon-seller") ?? null,
  };
}
