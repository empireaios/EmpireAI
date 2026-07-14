import {
  buildMarketplaceCockpitIntegrationView,
  buildMarketplaceIntegrationArchitectureSnapshot,
} from "../infrastructure-commerce/marketplace/services/marketplace-integration-architecture-service.js";

/** Collect P8-03 Marketplace Integration snapshot for Cockpit and Pillow API. */
export function collectMarketplaceIntegrationSnapshot(workspaceId = "ws-foundation") {
  const context = { workspaceId };
  const architecture = buildMarketplaceIntegrationArchitectureSnapshot(context);
  const view = buildMarketplaceCockpitIntegrationView(context);

  return {
    computedAt: new Date().toISOString(),
    missionId: "P8-03",
    architecture,
    cockpit: view,
    pillow: {
      integrationQuality: architecture.pillowRecommendations,
      commercialOpportunities: architecture.connectors
        .filter((c) => c.status === "architecture_ready")
        .map((c) => `${c.displayName}: registry-first activation path`),
      connectorImprovements: architecture.connectors.map(
        (c) => `${c.displayName} · ${c.pipelinePhase.replace(/_/g, " ")}`,
      ),
    },
    ecc: { coordinationNotes: architecture.eccCoordinationNotes },
    supervisor: { notes: architecture.supervisorNotes },
    guardian: { notes: architecture.guardianNotes },
  };
}
