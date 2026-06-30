import type { RevenuePipelineHeadquarters } from "../models/revenue-dashboard.js";
import { buildExecutiveHeadquartersDashboard } from "../../executive-council/services/executive-headquarters-service.js";
import { buildRevenuePipelineDashboard } from "./revenue-pipeline-dashboard-service.js";
import { listPipelineProducts, seedRevenuePipeline } from "./revenue-pipeline-runtime.js";
import { generateRevenuePipelineMissions, listRevenuePipelineMissions } from "./revenue-mission-generator.js";
import { computeAggregateCommercialHealth, computeProductHealth } from "./revenue-health-service.js";
import { getIntegrationSnapshot } from "./revenue-integration-service.js";

/** GKR-010 — Revenue pipeline Executive Headquarters overlay. */
export function buildRevenuePipelineHeadquarters(
  workspaceId: string,
  companyId: string,
): RevenuePipelineHeadquarters {
  seedRevenuePipeline(workspaceId, companyId);
  const pipeline = buildRevenuePipelineDashboard(workspaceId, companyId);
  const products = listPipelineProducts(workspaceId, companyId).map((p) => ({
    ...p,
    health: p.health ?? computeProductHealth(p, workspaceId, companyId),
  }));

  generateRevenuePipelineMissions(workspaceId, companyId, products);
  const missions = listRevenuePipelineMissions(workspaceId, companyId);
  const commercialHealth = computeAggregateCommercialHealth(products, workspaceId, companyId);

  let executiveRecommendations: Array<{ source: string; title: string; productId?: string }> = [];
  try {
    const ec = buildExecutiveHeadquartersDashboard(workspaceId, companyId);
    executiveRecommendations = [
      ...ec.recommendationsAwaitingKing.map((r) => ({ source: "executive-council", title: r.topic })),
      ...ec.generatedMissions.slice(0, 3).map((m) => ({ source: "executive-council", title: m.title })),
    ];
  } catch {
    executiveRecommendations = missions.slice(0, 3).map((m) => ({ source: "grand-king-revenue-pipeline", title: m.title, productId: m.productId }));
  }

  getIntegrationSnapshot(workspaceId, companyId);

  return {
    moduleId: "grand-king-revenue-pipeline",
    missionId: "GKR-001-GKR-010",
    currentRevenuePipeline: pipeline,
    todaysRevenueOpportunities: missions.filter((m) => m.type === "REVENUE_OPPORTUNITY" || m.type === "AWAITING_KING"),
    executiveRecommendations,
    awaitingApprovals: pipeline.awaitingApproval,
    scalingCandidates: pipeline.scalingProducts,
    commercialHealth,
    empireRevenueScore: pipeline.empireRevenueScore,
    revenueOpportunities: missions.filter((m) => m.type === "REVENUE_OPPORTUNITY"),
    productsAwaitingKing: products.filter((p) => p.state === "KING_APPROVAL"),
    productsLosingMoney: products.filter((p) => (p.health?.profitabilityHealth ?? 100) < 45 && p.state === "LIVE"),
    productsReadyToScale: products.filter((p) => p.state === "MONITORING" && (p.health?.overallScore ?? 0) >= 70),
    productsRecommendedForArchive: products.filter((p) => p.state === "PAUSED" || p.state === "ARCHIVED" || ((p.health?.overallScore ?? 100) < 35 && p.state === "LIVE")),
    computedAt: new Date().toISOString(),
  };
}
