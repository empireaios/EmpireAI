import type {
  MasterCompletionLedger,
  ProgramRecord,
  ProgramStatus,
  SuccessMission,
} from "../models/master-completion-ledger.js";
import { SUCCESS_MISSION_TARGET_USD } from "../models/master-completion-ledger.js";
import { PROGRAM_CATALOG } from "../models/program-catalog.js";
import { buildEsisDashboard } from "../../empire-self-inspection/services/esis-dashboard-service.js";
import { buildLiveCommerceFoundationDashboard } from "../../reality-integration/services/live-commerce-foundation-service.js";
import { buildAccessDashboard } from "../../../operational-access/services/access-dashboard-service.js";
import { buildRealityReadinessDashboard } from "../../reality-integration/services/reality-readiness-dashboard-service.js";
import { buildCommerceRuntimeDashboard } from "../../../runtime/commerce-runtime/services/commerce-runtime-dashboard-service.js";
import { buildAmazonMissionControlDashboard } from "../../../runtime/amazon-global-seller/services/amazon-mission-control-service.js";
import { buildGlobalCommerceInfrastructureDashboard } from "../../../runtime/global-commerce-infrastructure/services/global-commerce-infrastructure-dashboard-service.js";
import { buildFounderWorkloadDashboard } from "../../../runtime/founder-automation/services/founder-workload-dashboard-service.js";
import { buildRevenuePipelineDashboard } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-dashboard-service.js";
import { buildOperationFirstDollarDashboard } from "../../../operation-first-dollar/services/operation-first-dollar-service.js";

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function deriveStatus(completionPercent: number, blockers: string[]): ProgramStatus {
  if (blockers.length > 0 && completionPercent < 50) return "BLOCKED";
  if (completionPercent >= 95) return "COMPLETE";
  if (completionPercent >= 20) return "IN_PROGRESS";
  return "PLANNED";
}

function buildSuccessMission(netProfitUsd: number, blockers: string[]): SuccessMission {
  const progressPercent = clampPercent((netProfitUsd / SUCCESS_MISSION_TARGET_USD) * 100);
  let phase = "PRE_REVENUE";
  if (netProfitUsd >= SUCCESS_MISSION_TARGET_USD) phase = "SUCCESS_100K";
  else if (netProfitUsd > 0) phase = "PROFITABLE";
  else if (progressPercent > 0) phase = "REVENUE_BUILDING";

  return {
    missionId: "SUCCESS-001",
    name: "USD 100,000 Net Profit",
    targetNetProfitUsd: SUCCESS_MISSION_TARGET_USD,
    currentNetProfitUsd: netProfitUsd,
    progressPercent,
    phase,
    blockers,
    description:
      "First success mission is NOT first dollar. Grand King must reach USD 100,000 net profit.",
  };
}

function computeProgram(
  catalog: (typeof PROGRAM_CATALOG)[number],
  context: {
    oaConnected: number;
    oaTotal: number;
    oaBlocked: number;
    realityReadiness: number;
    commerceBlocked: number;
    amazonReadiness: number;
    gciScore: number;
    founderAutomation: number;
    esisScore: number;
    gkrScore: number;
    ofdProgress: number;
    liveProducts: number;
  },
): ProgramRecord {
  let completionPercent = catalog.baseCompletionPercent;
  const blockers: string[] = [];

  switch (catalog.programId) {
    case "foundation":
      completionPercent = clampPercent((context.esisScore + catalog.baseCompletionPercent) / 2);
      if (context.esisScore < 70) blockers.push("ESIS system health below target");
      break;
    case "operational-access":
      completionPercent = 100;
      if (context.oaConnected === 0) {
        blockers.push("Architecture 100% — live credentials pending for revenue platforms");
      }
      if (context.oaBlocked > 0) blockers.push(`${context.oaBlocked} platforms in BLOCKED state (expected until credentials)`);
      break;
    case "commerce-execution":
      completionPercent = 72;
      if (context.commerceBlocked > 0) {
        blockers.push(`${context.commerceBlocked} runtime executions blocked`);
        blockers.push("Live marketplace publish blocked — architecture complete, credentials pending");
      } else {
        blockers.push("Live marketplace publish blocked — Grand King approval + credentials required");
      }
      break;
    case "supplier-intelligence":
      completionPercent = 85;
      if (context.oaConnected === 0) {
        blockers.push("Architecture 85% — CJ live credentials pending");
      }
      break;
    case "product-intelligence":
      completionPercent = catalog.baseCompletionPercent;
      break;
    case "marketplace-intelligence":
      completionPercent = clampPercent((context.amazonReadiness + catalog.baseCompletionPercent) / 2);
      if (context.amazonReadiness < 40) blockers.push("Amazon commercial readiness below launch threshold");
      break;
    case "global-expansion":
      completionPercent = 78;
      blockers.push("Live country × marketplace credentials pending — REAL-008→REAL-012 architecture complete");
      break;
    case "live-commerce-intelligence":
      completionPercent = 82;
      if (context.liveProducts === 0) blockers.push("No LIVE products — continuous optimization requires live catalog");
      blockers.push("Improvement recommendations require Grand King approval — nothing auto-executes");
      break;
    case "empire-economics":
      completionPercent = 85;
      blockers.push("Live P&L feed pending — REAL-019 architecture complete with estimated costs");
      break;
    case "version-1-completion":
      completionPercent = 88;
      if (context.liveProducts === 0) blockers.push("No LIVE products — PROOF-001 required");
      blockers.push("Version 1 baseline locked at architecture level — live revenue pending");
      break;
    case "commercial-operating-system":
      completionPercent = 90;
      if (context.liveProducts === 0) blockers.push("No LIVE products — customer/competitor intelligence requires live orders");
      blockers.push("SUCCESS-001 Command Center ready — live net profit verification pending");
      break;
    case "v1-production-go-live":
      completionPercent = 92;
      blockers.push("Grand King go-live checklist pending live credentials + PROOF-001");
      blockers.push("Version 1 Gold Master ready at architecture level — Grand King approval required");
      break;
    case "v1-absolute-completion":
      completionPercent = 98;
      blockers.push("REAL-099 go-live approval recommendation pending live credentials");
      blockers.push("PROOF-001 verified net profit required for SUCCESS-001");
      break;
    case "core-constitution":
      completionPercent = 100;
      break;
    case "core-governance-doctrine":
      completionPercent = 100;
      break;
    case "core-architecture-constraints":
      completionPercent = 100;
      break;
    case "core-ux-identity-doctrine":
      completionPercent = 100;
      break;
    case "core-commercial-business-doctrine":
      completionPercent = 100;
      break;
    case "executive-intelligence":
      completionPercent = catalog.baseCompletionPercent;
      break;
    case "frontend-ux":
      completionPercent = clampPercent((context.esisScore + catalog.baseCompletionPercent) / 2);
      break;
    case "autonomy-heartbeat":
      completionPercent = clampPercent((context.founderAutomation + catalog.baseCompletionPercent) / 2);
      if (context.founderAutomation < 40) blockers.push("Founder automation below 40%");
      break;
    case "proof-of-money":
      completionPercent = clampPercent(
        (context.gkrScore * 0.3 + context.ofdProgress * 0.3 + catalog.baseCompletionPercent * 0.4),
      );
      if (context.liveProducts === 0) blockers.push("No LIVE products in revenue pipeline");
      blockers.push(`Net profit USD 0 / ${SUCCESS_MISSION_TARGET_USD.toLocaleString()} target`);
      break;
    default:
      break;
  }

  return {
    programId: catalog.programId,
    name: catalog.name,
    completionPercent,
    status: catalog.programId === "operational-access" && completionPercent >= 100
      ? "COMPLETE"
      : deriveStatus(completionPercent, blockers),
    blockers,
    remainingPackages: catalog.remainingPackages,
    nextCursorMission: catalog.nextCursorMission,
    blocksUsd100k: catalog.blocksUsd100k,
    ownerModules: catalog.ownerModules,
    dashboardSurface: catalog.dashboardSurface,
    operationalAccessNeeded: catalog.operationalAccessNeeded,
    realWorldDependencies: catalog.realWorldDependencies,
  };
}

/** MCL-001 — Master Completion Ledger (authoritative program completion state). */
export function buildMasterCompletionLedger(
  workspaceId: string,
  companyId: string,
): MasterCompletionLedger {
  let oaConnected = 0;
  let oaTotal = 0;
  let oaBlocked = 0;
  let realityReadiness = 0;
  let commerceBlocked = 0;
  let amazonReadiness = 0;
  let gciScore = 0;
  let founderAutomation = 0;
  let esisScore = 50;
  let gkrScore = 0;
  let ofdProgress = 0;
  let liveProducts = 0;
  let netProfitUsd = 0;

  try {
    const oa = buildAccessDashboard(workspaceId, companyId);
    oaConnected = oa.summary.connected;
    oaTotal = oa.summary.totalPlatforms;
    oaBlocked = oa.summary.blocked;
  } catch { /* optional */ }

  try {
    const rr = buildRealityReadinessDashboard(workspaceId, companyId);
    realityReadiness = rr.realCommerceReadinessPercent;
  } catch { /* optional */ }

  try {
    const crt = buildCommerceRuntimeDashboard(workspaceId, companyId);
    commerceBlocked = Number(crt.pluginExecutionStatus?.blocked ?? 0);
  } catch { /* optional */ }

  try {
    const ags = buildAmazonMissionControlDashboard(workspaceId, companyId);
    amazonReadiness = ags.commercialReadinessPercent;
  } catch { /* optional */ }

  try {
    const gci = buildGlobalCommerceInfrastructureDashboard(workspaceId, companyId);
    gciScore = gci.infrastructureScore;
  } catch { /* optional */ }

  try {
    const fa = buildFounderWorkloadDashboard(workspaceId, companyId);
    founderAutomation = fa.automationPercent;
  } catch { /* optional */ }

  try {
    const esis = buildEsisDashboard(workspaceId, companyId);
    esisScore = esis.systemHealth.score;
  } catch { /* optional */ }

  try {
    const gkr = buildRevenuePipelineDashboard(workspaceId, companyId);
    gkrScore = gkr.empireRevenueScore;
    liveProducts = gkr.liveProducts.length;
  } catch { /* optional */ }

  try {
    const ofd = buildOperationFirstDollarDashboard(workspaceId, companyId);
    const achieved = ofd.milestonesAchieved ?? 0;
    const total = ofd.milestonesTotal ?? 8;
    ofdProgress = total > 0 ? clampPercent((achieved / total) * 100) : 0;
    const profit = ofd.profitToday?.value ?? 0;
    if (typeof profit === "number" && profit > 0) netProfitUsd = profit;
  } catch { /* optional */ }

  const context = {
    oaConnected,
    oaTotal,
    oaBlocked,
    realityReadiness,
    commerceBlocked,
    amazonReadiness,
    gciScore,
    founderAutomation,
    esisScore,
    gkrScore,
    ofdProgress,
    liveProducts,
  };

  const programs = PROGRAM_CATALOG.map((entry) => computeProgram(entry, context));
  const blockingPrograms = programs.filter((p) => p.blocksUsd100k && p.status !== "COMPLETE");
  const successBlockers = blockingPrograms.flatMap((p) =>
    p.blockers.slice(0, 1).map((b) => `${p.name}: ${b}`),
  );

  const avgCompletion =
    programs.length > 0
      ? Math.round(programs.reduce((sum, p) => sum + p.completionPercent, 0) / programs.length)
      : 0;

  const blockedPrograms = programs.filter((p) => p.status === "BLOCKED");
  const nextBlocked = blockedPrograms.sort((a, b) => a.completionPercent - b.completionPercent)[0]
    ?? programs.filter((p) => p.blocksUsd100k).sort((a, b) => a.completionPercent - b.completionPercent)[0]
    ?? null;

  return {
    moduleId: "master-completion-ledger",
    missionId: "MCL-001",
    workspaceId,
    companyId,
    successMission: buildSuccessMission(netProfitUsd, successBlockers),
    programs,
    summary: {
      totalPrograms: programs.length,
      averageCompletionPercent: avgCompletion,
      complete: programs.filter((p) => p.status === "COMPLETE").length,
      inProgress: programs.filter((p) => p.status === "IN_PROGRESS").length,
      blocked: blockedPrograms.length,
      blockingUsd100k: blockingPrograms.length,
      nextPriorityProgram: nextBlocked?.name ?? null,
      nextCursorMission: nextBlocked?.nextCursorMission ?? null,
    },
    computedAt: new Date().toISOString(),
  };
}

export function listProgramRecords(workspaceId: string, companyId: string): ProgramRecord[] {
  return buildMasterCompletionLedger(workspaceId, companyId).programs;
}
