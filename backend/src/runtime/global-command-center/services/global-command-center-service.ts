import { buildAccessDashboard } from "../../../operational-access/services/access-dashboard-service.js";
import { listPipelineProducts, seedRevenuePipeline } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import { buildMasterCompletionLedger } from "../../../orchestration/master-completion-ledger/services/master-completion-ledger-service.js";
import { buildExecutiveVisualDebate } from "../../executive-visual-debate/services/executive-visual-debate-service.js";
import { buildExecutiveProductOptimization } from "../../executive-product-optimization/services/executive-product-optimization-service.js";
import { buildGlobalMarketplaceDistributionDashboard } from "../../global-marketplace-operations/services/global-marketplace-distribution-dashboard-service.js";
import { buildGlobalOpportunityEngine } from "../../global-opportunity-engine/services/global-opportunity-engine-service.js";
import { buildLiveProductIntelligence } from "../../live-product-intelligence/services/live-product-intelligence-service.js";
import { buildRevenueImprovementEngine } from "../../revenue-improvement-engine/services/revenue-improvement-engine-service.js";
import { buildSupplierIntelligenceLoop } from "../../supplier-intelligence-loop/services/supplier-intelligence-loop-service.js";
import type { GlobalCommandCenterDashboard } from "../models/global-command-center.js";

/** REAL-018 — Mission Home operational HQ (aggregates REAL-013→017, no duplicate dashboards). */
export function buildGlobalCommandCenter(
  workspaceId: string,
  companyId: string,
): GlobalCommandCenterDashboard {
  seedRevenuePipeline(workspaceId, companyId);

  const live = buildLiveProductIntelligence(workspaceId, companyId);
  const optimization = buildExecutiveProductOptimization(workspaceId, companyId);
  const supplierLoop = buildSupplierIntelligenceLoop(workspaceId, companyId);
  const opportunities = buildGlobalOpportunityEngine(workspaceId, companyId);
  const revenueImprovement = buildRevenueImprovementEngine(workspaceId, companyId);
  const gmo = buildGlobalMarketplaceDistributionDashboard(workspaceId, companyId);
  const pipeline = listPipelineProducts(workspaceId, companyId);
  const debate = buildExecutiveVisualDebate(workspaceId, companyId, {
    topic: "Live commerce continuous optimization — USD 100K net profit path",
    subjectType: "general",
    summary: `${live.liveProducts.length} live products · ${revenueImprovement.proposals.length} improvement proposals`,
  });

  let oarConnected = 0;
  let oarTotal = 0;
  let oarBlocked = 0;
  let oarRevenueGaps = 0;
  try {
    const oar = buildAccessDashboard(workspaceId, companyId);
    oarConnected = oar.summary.connected;
    oarTotal = oar.summary.totalPlatforms;
    oarBlocked = oar.summary.blocked;
    oarRevenueGaps = oar.summary.revenueBlockingGaps;
  } catch { /* optional */ }

  let ledgerOverall = 0;
  let successProgress = 0;
  let programsInProgress = 0;
  try {
    const mcl = buildMasterCompletionLedger(workspaceId, companyId);
    ledgerOverall = Math.round(
      mcl.programs.reduce((s, p) => s + p.completionPercent, 0) / Math.max(mcl.programs.length, 1),
    );
    successProgress = mcl.successMission.progressPercent;
    programsInProgress = mcl.programs.filter((p) => p.status === "IN_PROGRESS").length;
  } catch { /* optional */ }

  const kingQueue = pipeline
    .filter((p) => p.state === "KING_APPROVAL" || p.state === "EXECUTIVE_REVIEW")
    .map((p) => ({ productId: p.productId, title: p.title, state: p.state, reason: "Awaiting Grand King decision" }));

  const awaitingLaunch = pipeline
    .filter((p) => ["READY_TO_PUBLISH", "APPROVED"].includes(p.state))
    .map((p) => ({ productId: p.productId, title: p.title, state: p.state, reason: "Approved — launch pending" }));

  const awaitingImprovement = optimization.recommendations.slice(0, 10).map((r) => ({
    productId: r.productId,
    title: r.recommendation.slice(0, 80),
    reason: r.action,
  }));

  const archiveCandidates = live.atRisk
    .filter((p) => p.lifecycle === "DEAD")
    .map((p) => ({
      productId: p.productId,
      title: p.title,
      lifecycle: p.lifecycle,
      reason: p.whySucceedingOrFailing,
    }));

  return {
    moduleId: "global-command-center",
    missionIds: ["REAL-013", "REAL-014", "REAL-015", "REAL-016", "REAL-017", "REAL-018"],
    workspaceId,
    companyId,
    architecturePercent: 82,
    architectureComplete: true,
    executiveMorningBrief: `Live commerce HQ: ${live.liveProducts.length} products under continuous review. ${revenueImprovement.proposals.length} revenue improvements queued. ${opportunities.opportunityQueue.length} expansion opportunities. ${kingQueue.length} awaiting Grand King. Mission: USD 100,000 net profit — intelligence observes, Council debates, King decides.`,
    globalRevenueUsd: gmo.worldOverview.totalRevenueUsd,
    globalProfitUsd: gmo.worldOverview.totalProfitUsd,
    countryHeatMap: gmo.revenueByCountry.slice(0, 12).map((c) => ({
      label: c.countryName,
      code: c.countryCode,
      score: c.revenueUsd > 0 ? Math.min(100, Math.round(c.profitUsd / Math.max(c.revenueUsd, 1) * 100)) : 0,
      revenueUsd: c.revenueUsd,
      profitUsd: c.profitUsd,
    })),
    marketplaceHeatMap: gmo.revenueByMarketplace.slice(0, 12).map((m) => ({
      label: m.marketplaceName,
      code: m.marketplaceId,
      score: m.revenueUsd > 0 ? Math.min(100, Math.round(m.profitUsd / Math.max(m.revenueUsd, 1) * 100)) : 0,
      revenueUsd: m.revenueUsd,
      profitUsd: m.profitUsd,
    })),
    productWinners: live.winners.slice(0, 8),
    productsAtRisk: live.atRisk.slice(0, 8),
    supplierHealthScore: supplierLoop.supplierHealthScore,
    supplierInventoryAlerts: supplierLoop.inventoryAlerts,
    executiveDebateTopic: optimization.debateTopic,
    soulRecommendation: debate.soulRecommendation.unifiedRecommendation,
    grandKingApprovalQueue: kingQueue,
    revenueOpportunityQueue: opportunities.opportunityQueue,
    revenueImprovementProposals: revenueImprovement.proposals.slice(0, 10),
    productsAwaitingLaunch: awaitingLaunch,
    productsAwaitingImprovement: awaitingImprovement,
    productsRecommendedForArchive: archiveCandidates,
    operationalAccess: {
      connected: oarConnected,
      totalPlatforms: oarTotal,
      blocked: oarBlocked,
      revenueBlockingGaps: oarRevenueGaps,
    },
    completionLedgerSummary: {
      overallPercent: ledgerOverall,
      successMissionProgressPercent: successProgress,
      programsInProgress,
    },
    reusedModules: [
      "live-product-intelligence",
      "executive-product-optimization",
      "supplier-intelligence-loop",
      "global-opportunity-engine",
      "revenue-improvement-engine",
      "global-marketplace-operations",
      "executive-council",
      "grand-king-revenue-pipeline",
      "operational-access",
      "master-completion-ledger",
    ],
    computedAt: new Date().toISOString(),
  };
}
