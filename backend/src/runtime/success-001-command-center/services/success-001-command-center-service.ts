import { buildAccessDashboard } from "../../../operational-access/services/access-dashboard-service.js";
import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { listPipelineProducts, seedRevenuePipeline } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import { buildEmpireEconomics } from "../../empire-economics/services/empire-economics-service.js";
import { buildExecutiveVisualDebate } from "../../executive-visual-debate/services/executive-visual-debate-service.js";
import { buildGlobalStrategyEngine } from "../../global-strategy-engine/services/global-strategy-engine-service.js";
import { SUCCESS_001_TARGET_USD } from "../models/success-001-command-center.js";
import type { Success001CommandCenterDashboard } from "../models/success-001-command-center.js";

/** REAL-035 — SUCCESS-001 Command Center (Mission Home dedicated page). */
export function buildSuccess001CommandCenter(
  workspaceId: string,
  companyId: string,
): Success001CommandCenterDashboard {
  seedRevenuePipeline(workspaceId, companyId);
  const economics = buildEmpireEconomics(workspaceId, companyId);
  const strategy = buildGlobalStrategyEngine(workspaceId, companyId);
  const pipeline = listPipelineProducts(workspaceId, companyId);

  const netProfit = Math.max(economics.netProfitUsd, 0);
  const monthlyProfit = economics.netProfitUsd;
  const distance = Math.max(0, SUCCESS_001_TARGET_USD - netProfit);
  const progress = Math.min(100, Math.round((netProfit / SUCCESS_001_TARGET_USD) * 100));

  let oarConnected = 0;
  let revenueGaps = 0;
  const operationalBlockers: string[] = [];
  try {
    const oar = buildAccessDashboard(workspaceId, companyId);
    oarConnected = oar.summary.connected;
    revenueGaps = oar.summary.revenueBlockingGaps;
    if (oarConnected === 0) operationalBlockers.push("No live platform connections — REAL-002B");
    if (revenueGaps > 0) operationalBlockers.push(`${revenueGaps} revenue-blocking OAR gaps`);
  } catch {
    operationalBlockers.push("Operational access dashboard unavailable");
  }

  const programsBlocking = PROGRAM_CATALOG.filter((p) => p.blocksUsd100k).map((p) => ({
    program: p.name,
    nextMission: p.nextCursorMission,
  }));

  const commercialBlockers = [
    netProfit === 0 ? "USD 0 verified net profit toward SUCCESS-001" : "",
    economics.netProfitUsd < 0 ? `Monthly burn $${economics.burnRateUsd}` : "",
    "Live P&L feed pending — ECON-LIVE-001",
  ].filter(Boolean);

  const supplierBlockers = ["CJ live catalog + fulfillment attach pending — SUP-LIVE-001"];
  const marketplaceBlockers = ["Live marketplace publish blocked — REAL-002B credentials"];

  const debate = buildExecutiveVisualDebate(workspaceId, companyId, {
    topic: "SUCCESS-001 — USD 100K net profit path",
    subjectType: "general",
    summary: `Net profit $${netProfit} · ${distance} to target · ${progress}% progress`,
  });

  const kingQueue = pipeline
    .filter((p) => p.state === "KING_APPROVAL" || p.state === "EXECUTIVE_REVIEW")
    .map((p) => ({
      id: p.productId,
      title: p.title ?? p.productId,
      reason: "Awaiting Grand King approval — CONSTITUTION-025",
    }));

  const monthlyRate = monthlyProfit > 0 ? monthlyProfit : economics.grossProfitUsd > 0 ? economics.grossProfitUsd * 0.5 : 0;
  const monthsToTarget = monthlyRate > 0 ? Math.ceil(distance / monthlyRate) : null;
  const projectedArrival = monthsToTarget
    ? `${monthsToTarget} months at current profit trajectory (estimated)`
    : "Blocked until PROOF-001 verified net profit";

  const confidence = Math.min(95, Math.max(5,
    progress + (oarConnected > 0 ? 15 : 0) + (pipeline.filter((p) => p.state === "LIVE").length * 5),
  ));

  const businessHealth: Success001CommandCenterDashboard["businessHealth"] =
    netProfit > 5000 ? "GROWING" : netProfit > 0 ? "STABLE" : progress > 0 ? "WARNING" : "CRITICAL";
  const empireHealth: Success001CommandCenterDashboard["empireHealth"] =
    confidence >= 70 ? "STABLE" : confidence >= 40 ? "WARNING" : "CRITICAL";

  return {
    moduleId: "success-001-command-center",
    missionId: "REAL-035",
    missionCode: "SUCCESS-001",
    workspaceId,
    companyId,
    currentNetProfitUsd: netProfit,
    currentMonthlyProfitUsd: monthlyProfit,
    targetNetProfitUsd: SUCCESS_001_TARGET_USD,
    distanceToTargetUsd: distance,
    progressPercent: progress,
    programsBlocking,
    operationalBlockers,
    commercialBlockers,
    supplierBlockers,
    marketplaceBlockers,
    executiveRecommendations: strategy.strategicRecommendations.slice(0, 5).map((r) => ({
      title: r.title,
      evidence: r.evidence,
    })),
    soulRecommendation: debate.soulRecommendation.unifiedRecommendation ?? debate.soulRecommendation.summary,
    grandKingApprovalQueue: kingQueue,
    projectedArrival,
    confidencePercent: confidence,
    businessHealth,
    empireHealth,
    reusedModules: [
      "empire-economics", "global-strategy-engine", "grand-king-revenue-pipeline",
      "operational-access", "executive-visual-debate", "master-completion-ledger",
    ],
    architectureComplete: true,
    computedAt: new Date().toISOString(),
  };
}
