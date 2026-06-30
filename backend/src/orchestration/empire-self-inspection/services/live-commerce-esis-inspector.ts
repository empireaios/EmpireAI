import {
  buildLiveCommerceFoundationDashboard,
  buildOperationalAccessRegistry,
  listRuntimeActivationAssessments,
  listCredentialVaultProfiles,
  verifyLiveCommerceMarketplaceCapabilities,
} from "../../reality-integration/index.js";

export type LiveCommerceEsisInspection = {
  summary: string;
  credentialHealth: {
    total: number;
    verified: number;
    expiringSoon: number;
    revoked: number;
  };
  providerHealth: {
    healthy: number;
    warning: number;
    failed: number;
    disabled: number;
  };
  activationReadiness: {
    eligible: number;
    blocked: number;
    awaitingApproval: number;
  };
  missingApprovals: string[];
  operationalAccessCoverage: {
    totalPlatforms: number;
    marketplaceProviders: number;
    blocked: number;
    active: number;
  };
};

/** REAL-002A / ESIS — Live commerce foundation inspection. */
export function inspectLiveCommerceFoundation(workspaceId = "ws_empire_1"): LiveCommerceEsisInspection {
  const dashboard = buildLiveCommerceFoundationDashboard(workspaceId);
  const registry = buildOperationalAccessRegistry(workspaceId);
  const activations = listRuntimeActivationAssessments(workspaceId);
  const profiles = listCredentialVaultProfiles(workspaceId);
  const capabilities = verifyLiveCommerceMarketplaceCapabilities(workspaceId);

  const providerHealth = { healthy: 0, warning: 0, failed: 0, disabled: 0 };
  for (const cap of capabilities) {
    if (cap.health === "HEALTHY") providerHealth.healthy += 1;
    else if (cap.health === "WARNING") providerHealth.warning += 1;
    else if (cap.health === "FAILED") providerHealth.failed += 1;
    else providerHealth.disabled += 1;
  }

  const missingApprovals = activations
    .filter((a) => a.requiresFounderApproval && !a.founderApproved)
    .map((a) => `${a.providerId}: founder approval required`);

  return {
    summary: [
      `Live Commerce: ${registry.summary.totalPlatforms} platforms tracked`,
      `${dashboard.operationalAccessSummary.connected} connected`,
      `${dashboard.activationReadiness.blocked} activation blocked`,
      `${missingApprovals.length} awaiting founder approval`,
    ].join("; "),
    credentialHealth: dashboard.credentialHealth,
    providerHealth,
    activationReadiness: {
      eligible: dashboard.activationReadiness.eligible,
      blocked: dashboard.activationReadiness.blocked,
      awaitingApproval: dashboard.operationalAccessSummary.awaitingApproval,
    },
    missingApprovals,
    operationalAccessCoverage: {
      totalPlatforms: registry.summary.totalPlatforms,
      marketplaceProviders: dashboard.marketplaceProviders.length,
      blocked: registry.summary.blocked,
      active: registry.summary.active,
    },
  };
}
