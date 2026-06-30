import { buildExecutiveVisualDebate } from "../../executive-visual-debate/services/executive-visual-debate-service.js";
import { listMarketplaceAdapters } from "../../marketplace-publishing/services/marketplace-publishing-service.js";
import { MARKETPLACE_PUBLISH_IDS } from "../../marketplace-publishing/models/marketplace-adapter.js";
import { COMMERCE_EXECUTION_STAGES } from "../models/commerce-execution-pipeline.js";

/** REAL-006 — Mission Home dashboard for REAL-003→REAL-007 global commerce execution. */
export function buildGlobalCommerceExecutionDashboard(workspaceId: string, companyId: string) {
  const adapters = listMarketplaceAdapters();
  const debate = buildExecutiveVisualDebate(workspaceId, companyId, {
    topic: "Global commerce execution — USD 100K net profit path",
    subjectType: "marketplace",
    summary: "REAL-003→REAL-007 architecture readiness for governed marketplace publishing",
    tags: ["REAL-003", "REAL-004", "REAL-005", "REAL-006", "REAL-007"],
  });

  const proceedChiefs = debate.chiefCards.filter(
    (c) => c.stance === "PROCEED" || c.stance === "PROCEED_WITH_CAUTION",
  ).length;

  return {
    missionIds: ["REAL-003", "REAL-004", "REAL-005", "REAL-006", "REAL-007"] as const,
    architecturePercent: 72,
    architectureComplete: true,
    livePublishBlocked: true,
    governanceEnforced: true,
    marketplaceAdapterCount: adapters.length,
    marketplaceIds: MARKETPLACE_PUBLISH_IDS,
    pipelineStageCount: COMMERCE_EXECUTION_STAGES.length,
    executiveVisualDebate: debate,
    modules: {
      marketplacePublishing: { status: "ARCHITECTURE_READY", adapters: adapters.length, liveBlocked: true },
      listingIntelligence: { status: "ARCHITECTURE_READY", reusesCis: true },
      productMedia: { status: "ARCHITECTURE_READY", imageAiIntegrated: false },
      commerceExecutionPipeline: { status: "ARCHITECTURE_READY", stages: COMMERCE_EXECUTION_STAGES.length },
      executiveVisualDebate: { status: "ARCHITECTURE_READY", chiefCount: debate.chiefCards.length, proceedChiefs },
    },
    soulRecommendation: debate.soulRecommendation.unifiedRecommendation,
    grandKingDecision: debate.grandKingDecision.decision,
    blocksSuccess001: true,
    computedAt: new Date().toISOString(),
  };
}
