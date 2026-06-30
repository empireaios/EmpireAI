import type { RevenuePipelineDashboard } from "../models/revenue-dashboard.js";
import { REVENUE_PIPELINE_LIFECYCLE } from "../models/revenue-state-machine.js";
import { listPipelineProducts, getRevenuePipelineRuntime, seedRevenuePipeline } from "./revenue-pipeline-runtime.js";
import { computeAggregateCommercialHealth, computeProductHealth } from "./revenue-health-service.js";
import { generateRevenuePipelineMissions } from "./revenue-mission-generator.js";

/** GKR-003 — Commercial Pipeline Dashboard. */
export function buildRevenuePipelineDashboard(workspaceId: string, companyId: string): RevenuePipelineDashboard {
  seedRevenuePipeline(workspaceId, companyId);
  const products = listPipelineProducts(workspaceId, companyId).map((p) => ({
    ...p,
    health: p.health ?? computeProductHealth(p, workspaceId, companyId),
  }));

  generateRevenuePipelineMissions(workspaceId, companyId, products);
  const runtime = getRevenuePipelineRuntime(workspaceId, companyId);

  return {
    moduleId: "grand-king-revenue-pipeline",
    missionId: "GKR-001-GKR-010",
    revenuePipeline: REVENUE_PIPELINE_LIFECYCLE.map((s) => ({
      stage: s.stage,
      label: s.label,
      module: "module" in s ? s.module : undefined,
    })),
    productsInReview: products.filter((p) => p.state === "UNDER_REVIEW" || p.state === "DISCOVERED"),
    awaitingApproval: products.filter((p) => p.state === "KING_APPROVAL" || p.state === "EXECUTIVE_REVIEW"),
    readyToPublish: products.filter((p) => p.state === "READY_TO_PUBLISH"),
    liveProducts: products.filter((p) => p.state === "LIVE" || p.state === "MONITORING"),
    scalingProducts: products.filter((p) => p.state === "SCALING"),
    archivedProducts: products.filter((p) => p.state === "ARCHIVED" || p.state === "FAILED"),
    empireRevenueScore: runtime.empireRevenueScore,
    computedAt: new Date().toISOString(),
  };
}

export function buildEsisGkrPayload(workspaceId: string, companyId: string) {
  const dash = buildRevenuePipelineDashboard(workspaceId, companyId);
  return {
    module: "grand-king-revenue-pipeline",
    totalProducts: dash.productsInReview.length + dash.awaitingApproval.length + dash.readyToPublish.length + dash.liveProducts.length + dash.scalingProducts.length,
    empireRevenueScore: dash.empireRevenueScore,
    awaitingKing: dash.awaitingApproval.length,
  };
}
