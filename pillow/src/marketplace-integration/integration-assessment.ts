import { MARKETPLACE_CONNECTOR_REGISTRY } from "./connector-registry.js";
import { MARKETPLACE_FAILURE_KINDS, MARKETPLACE_INTEGRATION_PIPELINE } from "./paths.js";
import type { MarketplaceIntegrationAssessment, MarketplaceIntegrationCockpitSnapshot } from "./types.js";

export function executeMarketplaceIntegrationAssessment(): MarketplaceIntegrationAssessment {
  const degraded = MARKETPLACE_CONNECTOR_REGISTRY.filter(
    (c) => c.integrationQuality === "architecture_ready",
  ).length;
  const overallHealth =
    degraded > 5 ? "degraded" : degraded > 0 ? "healthy" : "healthy";

  const recommendations = [
    "Add new marketplaces via REG-MARKETPLACE — no constitutional redesign required",
    "Prioritize Amazon credential completion for first live sync",
    "Evaluate TikTok Shop and Meta Commerce for channel diversification",
  ];

  const warnings =
    degraded > 0
      ? [`${degraded} connectors architecture-ready pending live activation`]
      : [];

  const risks = MARKETPLACE_FAILURE_KINDS.slice(0, 2).map(
    (kind) => `${kind} — recovery mapped to autonomous-recovery-engine`,
  );

  return {
    success: true,
    overallHealth,
    connectorAssessments: [...MARKETPLACE_CONNECTOR_REGISTRY],
    recommendations,
    warnings,
    risks,
    grandKingSummary:
      "Unified marketplace abstraction active — provider-specific implementations are replaceable business capabilities",
  };
}

export function buildMarketplaceIntegrationCockpitSnapshot(
  assessment: MarketplaceIntegrationAssessment,
): MarketplaceIntegrationCockpitSnapshot {
  const connected = assessment.connectorAssessments.filter(
    (c) => c.integrationQuality === "good" || c.integrationQuality === "excellent",
  ).length;

  return {
    connectedMarketplaces: connected,
    connectorHealth:
      assessment.overallHealth === "critical"
        ? "blocked"
        : assessment.overallHealth === "degraded"
          ? "degraded"
          : "healthy",
    syncStatus: connected > 0 ? "partial sync active" : "awaiting first connection",
    currentFailures: assessment.warnings,
    recoveryStatus: assessment.risks.length > 0 ? "recovery mapped · none active" : "none",
    performanceSummary: `${MARKETPLACE_INTEGRATION_PIPELINE.length}-phase pipeline · ${assessment.connectorAssessments.length} connectors`,
    executiveSummary: assessment.grandKingSummary,
  };
}
