import { buildAccessDashboard } from "../../../operational-access/services/access-dashboard-service.js";
import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { listPipelineProducts, seedRevenuePipeline } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import { buildEmpireEconomics } from "../../empire-economics/services/empire-economics-service.js";
import { buildGrandKingLiveOperationsMode } from "../../grand-king-live-operations-mode/services/grand-king-live-operations-mode-service.js";
import { buildGlobalMarketplaceDistributionDashboard } from "../../global-marketplace-operations/services/global-marketplace-distribution-dashboard-service.js";
import type { HeadquartersSection, UnifiedGrandKingHeadquarters } from "../models/unified-grand-king-headquarters.js";

function programStatus(programId: string): HeadquartersSection["status"] {
  const program = PROGRAM_CATALOG.find((p) => p.programId === programId);
  if (!program) return "PENDING";
  if (program.blocksUsd100k) return "BLOCKED";
  if (program.baseCompletionPercent >= 85) return "READY";
  if (program.baseCompletionPercent >= 50) return "ACTIVE";
  return "PENDING";
}

/** REAL-051 — Unified Grand King Headquarters (Mission Home aggregator, light sections). */
export function buildUnifiedGrandKingHeadquarters(
  workspaceId: string,
  companyId: string,
): UnifiedGrandKingHeadquarters {
  seedRevenuePipeline(workspaceId, companyId);
  const economics = buildEmpireEconomics(workspaceId, companyId);
  const opsMode = buildGrandKingLiveOperationsMode(workspaceId, companyId);
  const pipeline = listPipelineProducts(workspaceId, companyId);
  const liveCount = pipeline.filter((p) => ["LIVE", "SCALING", "MONITORING"].includes(p.state)).length;
  const pendingApprovals = pipeline.filter((p) => ["KING_APPROVAL", "EXECUTIVE_REVIEW"].includes(p.state)).length;

  let oarConnected = 0;
  let oarTotal = 0;
  let revenueGaps = 0;
  try {
    const oar = buildAccessDashboard(workspaceId, companyId);
    oarConnected = oar.summary.connected;
    oarTotal = oar.summary.totalPlatforms;
    revenueGaps = oar.summary.revenueBlockingGaps;
  } catch { /* optional OAR */ }

  let countriesActive = 0;
  let marketplacesConnected = 0;
  try {
    const gmo = buildGlobalMarketplaceDistributionDashboard(workspaceId, companyId);
    countriesActive = gmo.worldOverview.countriesActive;
    marketplacesConnected = gmo.worldOverview.marketplacesConnected;
  } catch { /* optional GMO */ }

  const avgCompletion = Math.round(
    PROGRAM_CATALOG.reduce((s, p) => s + p.baseCompletionPercent, 0) / PROGRAM_CATALOG.length,
  );
  const blockingPrograms = PROGRAM_CATALOG.filter((p) => p.blocksUsd100k).length;

  const sections: HeadquartersSection[] = [
    {
      moduleId: "executive-council",
      label: "Executive Council (EC)",
      summary: `${pendingApprovals} pipeline items awaiting council review`,
      status: programStatus("executive-intelligence"),
    },
    {
      moduleId: "executive-surveillance",
      label: "Executive Surveillance (ESS)",
      summary: "Cross-module observer active — governance signals monitored",
      status: blockingPrograms > 3 ? "BLOCKED" : "ACTIVE",
    },
    {
      moduleId: "master-completion-ledger",
      label: "Master Completion Ledger (MCL)",
      summary: `${PROGRAM_CATALOG.length} programs · ${avgCompletion}% avg · ${blockingPrograms} blocking SUCCESS-001`,
      status: blockingPrograms === 0 ? "READY" : "BLOCKED",
    },
    {
      moduleId: "grand-king-revenue-pipeline",
      label: "Grand King Revenue Pipeline (GKR)",
      summary: `${pipeline.length} products · ${liveCount} live · mode ${opsMode.currentMode}`,
      status: liveCount > 0 ? "ACTIVE" : "PENDING",
    },
    {
      moduleId: "operational-access",
      label: "Operational Access (OAR)",
      summary: `${oarConnected}/${oarTotal} platforms connected · ${revenueGaps} revenue gaps`,
      status: oarConnected === 0 ? "BLOCKED" : revenueGaps > 0 ? "PENDING" : "READY",
    },
    {
      moduleId: "global-marketplace-operations",
      label: "Global Marketplace Operations (GMO)",
      summary: `${countriesActive} countries active · ${marketplacesConnected} marketplaces connected`,
      status: marketplacesConnected > 0 ? "ACTIVE" : "PENDING",
    },
    {
      moduleId: "supplier-intelligence",
      label: "Supplier Intelligence",
      summary: PROGRAM_CATALOG.find((p) => p.programId === "supplier-intelligence")?.nextCursorMission ?? "Supplier program pending",
      status: programStatus("supplier-intelligence"),
    },
    {
      moduleId: "empire-economics",
      label: "Empire Economics",
      summary: `$${economics.netProfitUsd} net profit · $${economics.monthlyRecurringRevenueUsd} MRR`,
      status: economics.netProfitUsd > 0 ? "READY" : "BLOCKED",
    },
  ];

  return {
    moduleId: "unified-grand-king-headquarters",
    missionId: "REAL-051",
    workspaceId,
    companyId,
    morningBrief: `${liveCount} live products · $${economics.netProfitUsd} net profit · ${blockingPrograms} programs blocking USD 100K`,
    operationsMode: opsMode.currentMode,
    programSummary: {
      programCount: PROGRAM_CATALOG.length,
      avgCompletion,
      blockingPrograms,
    },
    sections,
    reusedModules: [
      "empire-economics",
      "operational-access",
      "grand-king-revenue-pipeline",
      "grand-king-live-operations-mode",
      "global-marketplace-operations",
      "master-completion-ledger",
    ],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
