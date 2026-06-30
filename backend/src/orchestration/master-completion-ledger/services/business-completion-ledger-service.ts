import type { BusinessCompletionLedger } from "../models/master-completion-ledger.js";
import { buildRevenuePipelineDashboard } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-dashboard-service.js";
import { buildRealityReadinessDashboard } from "../../reality-integration/services/reality-readiness-dashboard-service.js";
import { getBusinessOpportunityRepository } from "../../business-opportunity-workspace/index.js";

/** MCL-001 — Business Completion Ledger. */
export function buildBusinessCompletionLedger(
  workspaceId: string,
  companyId: string,
): BusinessCompletionLedger {
  let pipelineProducts = 0;
  let awaitingKing = 0;
  let live = 0;
  let launchReady = 0;
  let blocked = 0;
  let businessesTracked = 0;

  try {
    const gkr = buildRevenuePipelineDashboard(workspaceId, companyId);
    pipelineProducts =
      gkr.productsInReview.length +
      gkr.awaitingApproval.length +
      gkr.readyToPublish.length +
      gkr.liveProducts.length +
      gkr.scalingProducts.length +
      gkr.archivedProducts.length;
    awaitingKing = gkr.awaitingApproval.length;
    live = gkr.liveProducts.length;
    launchReady = gkr.readyToPublish.length;
    blocked = gkr.awaitingApproval.length + gkr.productsInReview.filter((p) => (p.health?.overallScore ?? 100) < 45).length;
  } catch { /* optional */ }

  try {
    const repo = getBusinessOpportunityRepository();
    businessesTracked = repo.listOpportunities(workspaceId, companyId).length;
  } catch { /* optional */ }

  let connectedMarketplaces = 0;
  try {
    const rr = buildRealityReadinessDashboard(workspaceId, companyId);
    connectedMarketplaces = rr.connectedProviders?.length ?? 0;
  } catch { /* optional */ }

  const entries = [
    {
      label: "Business Opportunities",
      value: businessesTracked,
      status: businessesTracked > 0 ? "IN_PROGRESS" as const : "PLANNED" as const,
      detail: `${businessesTracked} opportunities in workspace portfolio`,
    },
    {
      label: "Pipeline Products",
      value: pipelineProducts,
      status: pipelineProducts > 0 ? "IN_PROGRESS" as const : "PLANNED" as const,
      detail: `${pipelineProducts} products across GKR lifecycle`,
    },
    {
      label: "Launch Ready",
      value: launchReady,
      status: launchReady > 0 ? "IN_PROGRESS" as const : "BLOCKED" as const,
      detail: `${launchReady} products ready to publish`,
    },
    {
      label: "Live Products",
      value: live,
      status: live > 0 ? "IN_PROGRESS" as const : "BLOCKED" as const,
      detail: `${live} products generating or capable of revenue`,
    },
    {
      label: "Awaiting King Approval",
      value: awaitingKing,
      status: awaitingKing > 0 ? "BLOCKED" as const : "IN_PROGRESS" as const,
      detail: `${awaitingKing} products need founder decision`,
    },
    {
      label: "Connected Marketplaces",
      value: connectedMarketplaces,
      status: connectedMarketplaces > 0 ? "IN_PROGRESS" as const : "BLOCKED" as const,
      detail: `${connectedMarketplaces} reality-integration providers connected`,
    },
  ];

  return {
    moduleId: "master-completion-ledger",
    missionId: "MCL-001-BCL",
    workspaceId,
    companyId,
    businessesTracked,
    launchReady,
    live,
    blocked,
    pipelineProducts,
    awaitingKingApproval: awaitingKing,
    entries,
    computedAt: new Date().toISOString(),
  };
}
