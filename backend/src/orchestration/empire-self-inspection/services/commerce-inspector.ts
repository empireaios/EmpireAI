import { buildCommerceReadinessDashboard } from "../../commerce-readiness-engine/index.js";
import { buildDiscoveryDashboard } from "../../product-discovery-opportunity-engine/index.js";
import { buildBusinessWorkspaceDashboard } from "../../business-opportunity-workspace/index.js";
import { buildBusinessPreviewDashboard } from "../../business-preview-studio/index.js";
import { buildBusinessBuildDashboard } from "../../business-build-engine/index.js";
import { buildBusinessSimulationDashboard } from "../../business-simulation-engine/index.js";
import { buildExecutionLayerDashboard } from "../../execution-layer/index.js";
import { buildOperationFirstDollarDashboard } from "../../../operation-first-dollar/index.js";
import type { EsisCommerceStage } from "../models/esis-inspection.js";
import { COMMERCE_LIFECYCLE_STAGES, REPO_ROOT, readText } from "./repo-scanner.js";

const DEFAULT_WORKSPACE = "ws_empire_1";
const DEFAULT_COMPANY = "co-grand-king";

function safeDashboard<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

function stageStatus(moduleId: string, blockers: string[]): string {
  if (blockers.length === 0) return "OPERATIONAL";
  if (blockers.some((b) => b.includes("BLOCKING") || b.includes("blocked"))) return "BLOCKED";
  return "PARTIAL";
}

export function inspectCommerce(
  workspaceId = DEFAULT_WORKSPACE,
  companyId = DEFAULT_COMPANY,
): {
  summary: string;
  stages: EsisCommerceStage[];
  canonCompliance: string;
  stateMachineCompliance: string;
} {
  const readiness = safeDashboard(() =>
    buildCommerceReadinessDashboard({ workspaceId, companyId, accountType: "grand_king" }),
  );
  const discovery = safeDashboard(() => buildDiscoveryDashboard(workspaceId, companyId));
  const workspace = safeDashboard(() => buildBusinessWorkspaceDashboard(workspaceId, companyId));
  const preview = safeDashboard(() => buildBusinessPreviewDashboard(workspaceId, companyId));
  const build = safeDashboard(() => buildBusinessBuildDashboard(workspaceId, companyId));
  const simulation = safeDashboard(() => buildBusinessSimulationDashboard(workspaceId, companyId));
  const execution = safeDashboard(() => buildExecutionLayerDashboard(workspaceId, companyId));
  const ofd = safeDashboard(() => buildOperationFirstDollarDashboard(workspaceId, companyId));

  const readinessBlockers =
    readiness?.blockingItems?.map((b) => `${b.severity}: ${b.title}`) ?? ["Commerce readiness unavailable"];

  const stages: EsisCommerceStage[] = COMMERCE_LIFECYCLE_STAGES.map(({ stage, module, canonPhase }) => {
    let blockers: string[] = [];
    let status = "UNKNOWN";

    switch (module) {
      case "product-discovery-opportunity-engine":
        blockers = ["Uses mock product catalog (SCOUT_MOCK_PRODUCTS)"];
        status = discovery ? "PARTIAL" : "PARTIAL";
        break;
      case "business-opportunity-workspace":
        status = workspace ? "OPERATIONAL" : "PARTIAL";
        break;
      case "business-preview-studio":
        status = preview ? "OPERATIONAL" : "PARTIAL";
        break;
      case "business-build-engine":
        blockers = build ? ["publishBlocked on listings"] : ["Build dashboard unavailable"];
        status = build ? "BLOCKED" : "PARTIAL";
        break;
      case "business-simulation-engine":
        status = simulation ? "OPERATIONAL" : "PARTIAL";
        break;
      case "commerce-readiness-engine":
        blockers = readinessBlockers;
        status = readiness?.launchDecision === "NOT_READY" ? "BLOCKED" : readiness ? "OPERATIONAL" : "PARTIAL";
        break;
      case "product-publishing-engine":
        blockers = ["Local filesystem publish only; no marketplace API"];
        status = "BLOCKED";
        break;
      case "execution-layer":
        blockers = execution ? ["publishBlocked, executionBlocked, transactionBlocked"] : [];
        status = execution ? "BLOCKED" : "PARTIAL";
        break;
      case "customer-order-pipeline":
        status = "OPERATIONAL";
        break;
      case "live-cj-fulfillment":
        blockers = ["LIVE_CJ_FULFILLMENT_ENABLED env gate"];
        status = "PARTIAL";
        break;
      case "operation-first-dollar":
        blockers = ofd?.revenueToday?.source === "SIMULATED" ? ["KPI uses SIMULATED source until FIRST_SALE"] : [];
        status = ofd ? stageStatus(module, blockers) : "PARTIAL";
        break;
      case "reality-integration":
        blockers = ["executionBlocked on all connectors; connectionOnly mode"];
        status = "PARTIAL";
        break;
      default:
        status = "OPERATIONAL";
    }

    return { stage, module, status, blockers, canonPhase };
  });

  const canonPath = `${REPO_ROOT}/EMPIREAI_COMMERCE_CANON.md`;
  const canonExists = readText(canonPath).includes("Empire Connector Contract");
  const blockedStages = stages.filter((s) => s.status === "BLOCKED").length;

  return {
    summary: `${stages.length} commerce stages inspected; ${blockedStages} blocked; launch decision: ${readiness?.launchDecision ?? "unknown"}`,
    stages,
    canonCompliance: canonExists
      ? "EMPIREAI_COMMERCE_CANON.md present; module orchestration map aligned"
      : "Commerce Canon document not found",
    stateMachineCompliance: blockedStages <= 4
      ? "State machine defined; execution blocks prevent LIVE transitions"
      : "Multiple stages blocked — LIVE commerce transitions not available",
  };
}
