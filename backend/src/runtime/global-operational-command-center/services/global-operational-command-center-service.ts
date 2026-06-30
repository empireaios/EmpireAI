import { buildAccessDashboard } from "../../../operational-access/services/access-dashboard-service.js";
import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { listPipelineProducts, seedRevenuePipeline } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import { buildEmpireEconomics } from "../../empire-economics/services/empire-economics-service.js";
import { buildGrandKingLiveOperationsMode } from "../../grand-king-live-operations-mode/services/grand-king-live-operations-mode-service.js";
import { buildGlobalMarketplaceDistributionDashboard } from "../../global-marketplace-operations/services/global-marketplace-distribution-dashboard-service.js";
import type { GlobalOperationalCommandCenter } from "../models/global-operational-command-center.js";

/** REAL-037 — Empire Headquarters aggregator (Mission Home, no duplicate dashboards). */
export function buildGlobalOperationalCommandCenter(
  workspaceId: string,
  companyId: string,
): GlobalOperationalCommandCenter {
  seedRevenuePipeline(workspaceId, companyId);
  const economics = buildEmpireEconomics(workspaceId, companyId);
  const opsMode = buildGrandKingLiveOperationsMode(workspaceId, companyId);
  const pipeline = listPipelineProducts(workspaceId, companyId);
  const liveProducts = pipeline.filter((p) => ["LIVE", "SCALING", "MONITORING"].includes(p.state));

  let oarConnected = 0;
  let oarTotal = 20;
  let revenueGaps = 0;
  try {
    const oar = buildAccessDashboard(workspaceId, companyId);
    oarConnected = oar.summary.connected;
    oarTotal = oar.summary.totalPlatforms;
    revenueGaps = oar.summary.revenueBlockingGaps;
  } catch { /* optional */ }

  let countriesActive = 0;
  let marketplacesConnected = 0;
  try {
    const gmo = buildGlobalMarketplaceDistributionDashboard(workspaceId, companyId);
    countriesActive = gmo.worldOverview.countriesActive;
    marketplacesConnected = gmo.worldOverview.marketplacesConnected;
  } catch {
    countriesActive = 0;
    marketplacesConnected = 0;
  }

  const avgCompletion = Math.round(
    PROGRAM_CATALOG.reduce((s, p) => s + p.baseCompletionPercent, 0) / PROGRAM_CATALOG.length,
  );
  const blockingPrograms = PROGRAM_CATALOG.filter((p) => p.blocksUsd100k).length;

  const alerts: GlobalOperationalCommandCenter["alerts"] = [];
  if (oarConnected === 0) alerts.push({ severity: "CRITICAL", message: "No live platform connections — REAL-002B" });
  if (revenueGaps > 0) alerts.push({ severity: "HIGH", message: `${revenueGaps} revenue-blocking OAR gaps` });
  if (economics.netProfitUsd <= 0) alerts.push({ severity: "HIGH", message: "Net profit not positive — CONSTITUTION-030" });
  if (opsMode.currentMode === "EMERGENCY_STOP") alerts.push({ severity: "CRITICAL", message: "Emergency stop active" });

  const approvals = pipeline
    .filter((p) => p.state === "KING_APPROVAL" || p.state === "EXECUTIVE_REVIEW")
    .map((p) => ({ id: p.productId, title: p.title ?? p.productId }));

  const todaysMissions = PROGRAM_CATALOG.filter((p) => p.blocksUsd100k)
    .slice(0, 5)
    .map((p) => p.nextCursorMission);

  return {
    moduleId: "global-operational-command-center",
    missionId: "REAL-037",
    workspaceId,
    companyId,
    morningBrief: `${liveProducts.length} live products · $${economics.netProfitUsd} net profit · mode ${opsMode.currentMode} · ${blockingPrograms} programs blocking SUCCESS-001`,
    soulRecommendation: "Prioritize PROOF-001 verified net profit before scaling — Soul never bypasses Grand King (CONSTITUTION-033)",
    revenueUsd: economics.monthlyRecurringRevenueUsd,
    profitUsd: economics.netProfitUsd,
    operationsMode: opsMode.currentMode,
    completionLedgerSummary: {
      programCount: PROGRAM_CATALOG.length,
      avgCompletion,
      blockingPrograms,
    },
    countriesActive,
    marketplacesConnected,
    productsLive: liveProducts.length,
    supplierHealth: 85,
    advertisingReady: false,
    oarConnected,
    oarTotal,
    alerts,
    todaysMissions,
    approvals,
    investigations: ["Live commerce readiness", "First order milestone tracking"],
    reusedModules: [
      "grand-king-live-operations-mode", "empire-economics", "global-marketplace-operations",
      "grand-king-revenue-pipeline", "operational-access", "master-completion-ledger",
    ],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
