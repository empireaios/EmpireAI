import type { RevenueMissionLedger } from "../models/master-completion-ledger.js";
import { SUCCESS_MISSION_TARGET_USD } from "../models/master-completion-ledger.js";
import { buildMasterCompletionLedger } from "./master-completion-ledger-service.js";
import { buildRevenuePipelineDashboard } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-dashboard-service.js";
import { buildOperationFirstDollarDashboard } from "../../../operation-first-dollar/services/operation-first-dollar-service.js";

/** MCL-001 — Revenue Mission Ledger (SUCCESS-001: USD 100K net profit). */
export function buildRevenueMissionLedger(
  workspaceId: string,
  companyId: string,
): RevenueMissionLedger {
  const ledger = buildMasterCompletionLedger(workspaceId, companyId);

  let revenueTodayUsd = 0;
  let estimatedMonthlyUsd = 0;
  let netProfitUsd = ledger.successMission.currentNetProfitUsd;
  let ofdPhase = "PRE_LAUNCH";
  let milestonesAchieved = 0;
  let milestonesTotal = 8;
  let liveProducts = 0;
  let scalingProducts = 0;
  let empireRevenueScore = 0;

  try {
    const ofd = buildOperationFirstDollarDashboard(workspaceId, companyId);
    revenueTodayUsd = ofd.revenueToday?.value ?? 0;
    ofdPhase = ofd.currentPhase ?? ofdPhase;
    milestonesAchieved = ofd.milestonesAchieved ?? 0;
    milestonesTotal = ofd.milestonesTotal ?? milestonesTotal;
    netProfitUsd = ofd.profitToday?.value ?? netProfitUsd;
  } catch { /* optional */ }

  try {
    const gkr = buildRevenuePipelineDashboard(workspaceId, companyId);
    liveProducts = gkr.liveProducts.length;
    scalingProducts = gkr.scalingProducts.length;
    empireRevenueScore = gkr.empireRevenueScore;
  } catch { /* optional */ }

  const blockers = [
    ...ledger.successMission.blockers,
    netProfitUsd < SUCCESS_MISSION_TARGET_USD
      ? `USD ${netProfitUsd.toLocaleString()} net profit — target USD ${SUCCESS_MISSION_TARGET_USD.toLocaleString()}`
      : "",
  ].filter(Boolean);

  return {
    moduleId: "master-completion-ledger",
    missionId: "MCL-001-RML",
    workspaceId,
    companyId,
    successMission: ledger.successMission,
    revenueTodayUsd,
    estimatedMonthlyRevenueUsd: estimatedMonthlyUsd,
    netProfitUsd,
    ofdPhase,
    milestonesAchieved,
    milestonesTotal,
    liveProducts,
    scalingProducts,
    empireRevenueScore,
    blockers,
    computedAt: new Date().toISOString(),
  };
}
