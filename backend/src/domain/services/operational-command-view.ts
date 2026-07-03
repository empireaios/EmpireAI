import { CompanyRepository } from "../repositories/company-repository.js";
import {
  assessVersion1OperationalActivation,
  isLiveCommerceProductionMode,
  isPillowProductionModeEnabled,
  runVersion1ProductionReadinessReview,
  assessProductionInfrastructureReadiness,
  assessB6CredentialImplementation,
} from "../../orchestration/version-1-activation/index.js";
import {
  buildCommerceReadinessDashboard,
  evaluateCrirReadiness,
  getCrirReportsForCompany,
} from "../../orchestration/commerce-readiness-engine/index.js";
import { getEcommerceOsWorkflowRepository } from "../../orchestration/ecommerce-os-orchestrator/repositories/sqlite-ecommerce-os-workflow-repository.js";
import { buildVersion1GoLiveApproval } from "../../runtime/version-1-go-live-approval/services/version-1-go-live-approval-service.js";
import { buildSuccess001CommandCenter } from "../../runtime/success-001-command-center/services/success-001-command-center-service.js";
import { listFirstRevenueValidations } from "../../revenue/first-revenue-validation/services/first-revenue-validation-service.js";
import {
  ensurePillowApprovalTables,
  SqlitePillowApprovalRepository,
} from "../../orchestration/pillow-approval/repository/sqlite-pillow-approval-repository.js";
import { getObjectiveReportingSummary } from "../../orchestration/objective-management-engine/services/objective-management-service.js";
import { buildGrandKingsDashboard } from "../../orchestration/ecommerce-os-orchestrator/services/dashboard-status-service.js";
import type { ReadinessBlocker } from "../../orchestration/commerce-readiness-engine/models/commerce-readiness.js";

const DEFAULT_COMPANY = "co-grand-king";
const companies = new CompanyRepository();

export type BlockerChipStatus = "open" | "closed" | "partial";

export type OperationalCommandView = {
  computedAt: string;
  workspaceId: string;
  companyId: string;
  certificationBlockers: {
    B5: { id: "B5"; label: string; status: BlockerChipStatus; detail: string };
    B6: { id: "B6"; label: string; status: BlockerChipStatus; detail: string };
    B7: { id: "B7"; label: string; status: BlockerChipStatus; detail: string };
    B8: { id: "B8"; label: string; status: BlockerChipStatus; detail: string };
  };
  operationalReadiness: {
    percent: number;
    passed: boolean;
    detail: string;
  };
  crirReadiness: {
    score: number | null;
    launchReady: boolean;
    reportCount: number;
    status: string;
    detail: string;
  };
  proof001: {
    achieved: boolean;
    progressPercent: number;
    stagesPassed: number;
    totalStages: number;
    detail: string;
    validationCount: number;
  };
  commerceReadiness: {
    score: number | null;
    launchDecision: string;
    blockingCount: number;
  };
  pendingApprovals: {
    count: number;
    top: {
      approvalId: string;
      title: string;
      summary: string;
      type: string;
    } | null;
  };
  nextExecutiveApproval: string | null;
  success001: {
    blocker: string;
    progressPercent: number;
    currentNetProfitUsd: number;
  };
  implementation: {
    milestone: string;
    phase: string;
    objective: string;
    currentBlocker: string;
  };
  oms: {
    activeObjective: string;
    progress: number;
    confidence: number;
    overallHealth: "GREEN" | "YELLOW" | "RED";
    currentBlocker: string | null;
    nextHighestImpactAction: string | null;
    forecastCompletion: string | null;
    remainingWork: string[];
    remainingBlockers: string[];
  };
};

export type LaunchView = {
  computedAt: string;
  workspaceId: string;
  companyId: string;
  readinessScore: number | null;
  launchDecision: string;
  launchStatus: string;
  workflowStage: string | null;
  focusLabel: string;
  focusDetail: string;
  blockingCount: number;
  blockers: ReadinessBlocker[];
  workflowSteps: Array<{
    id: string;
    label: string;
    description: string;
    status: "complete" | "in_progress" | "blocked" | "pending";
    progress: number;
  }>;
  deploymentChecklist: Array<{
    itemId: string;
    category: string;
    label: string;
    status: "ready" | "blocked" | "pending";
    note: string;
  }>;
  components: Array<{
    key: string;
    label: string;
    status: string;
  }>;
};

function resolveCompanyId(workspaceId: string, companyId?: string): string {
  if (companyId) return companyId;
  const rows = companies.listByWorkspace(workspaceId);
  return rows[0]?.id ?? DEFAULT_COMPANY;
}

function mapDashboardStatus(
  status: string,
): "complete" | "in_progress" | "blocked" | "pending" {
  if (status === "READY" || status === "CONNECTED" || status === "LAUNCHED") return "complete";
  if (status === "BLOCKED" || status === "ERROR" || status === "NOT_CONNECTED") return "blocked";
  if (status === "IN_PROGRESS" || status === "PARTIAL" || status === "CONNECTING") {
    return "in_progress";
  }
  return "pending";
}

function mapChecklistStatus(
  status: string,
): "ready" | "blocked" | "pending" {
  const mapped = mapDashboardStatus(status);
  if (mapped === "complete") return "ready";
  if (mapped === "blocked") return "blocked";
  return "pending";
}

function deriveSuccess001Blocker(success001: ReturnType<typeof buildSuccess001CommandCenter>): string {
  const blockers = [
    ...success001.operationalBlockers,
    ...success001.commercialBlockers,
    ...success001.supplierBlockers,
    ...success001.marketplaceBlockers,
  ].filter(Boolean);
  if (blockers.length > 0) return blockers[0]!;
  if (success001.progressPercent >= 100) return "SUCCESS-001 target achieved";
  return "PROOF-001 verified net profit pending";
}

function computeProof001(validations: ReturnType<typeof listFirstRevenueValidations>) {
  const latest = validations[0] ?? null;
  const achieved = validations.some(
    (v) =>
      v.profitCents > 0 &&
      v.ledgerVerified &&
      v.allStagesPassed &&
      v.mode === "LIVE" &&
      !v.mock,
  );

  if (!latest) {
    return {
      achieved,
      progressPercent: achieved ? 100 : 0,
      stagesPassed: 0,
      totalStages: 12,
      detail: "Awaiting implementation — no first-revenue validation runs recorded",
      validationCount: 0,
    };
  }

  const stagesPassed = latest.stages.filter((s) => s.status === "PASS").length;
  const progressPercent = achieved
    ? 100
    : Math.round((stagesPassed / latest.stages.length) * 100);

  return {
    achieved,
    progressPercent,
    stagesPassed,
    totalStages: latest.stages.length,
    detail: achieved
      ? `PROOF-001 achieved — $${(latest.profitCents / 100).toFixed(2)} verified profit`
      : latest.productionBlockers[0] ??
        `${stagesPassed}/${latest.stages.length} validation stages passed`,
    validationCount: validations.length,
  };
}

function firstOpenBlockerId(
  blockers: OperationalCommandView["certificationBlockers"],
): string {
  for (const key of ["B5", "B6", "B7", "B8"] as const) {
    if (blockers[key].status === "open" || blockers[key].status === "partial") {
      return key;
    }
  }
  return "None";
}

/** Cockpit executive command strip — B5–B8, CRIR, PROOF-001, approvals (P0-6). */
export function loadOperationalCommandView(
  workspaceId: string,
  companyId?: string,
  env: NodeJS.ProcessEnv = process.env,
): OperationalCommandView {
  const cid = resolveCompanyId(workspaceId, companyId);
  const productionReview = runVersion1ProductionReadinessReview(env);
  const infrastructure = assessProductionInfrastructureReadiness(env);
  const activation = assessVersion1OperationalActivation(env);
  const goLiveApproval = buildVersion1GoLiveApproval(workspaceId, cid);
  const success001 = buildSuccess001CommandCenter(workspaceId, cid);
  const validations = listFirstRevenueValidations(workspaceId, cid);
  const proof001 = computeProof001(validations);

  const commerceDashboard = buildCommerceReadinessDashboard({
    workspaceId,
    companyId: cid,
    accountType: "grand_king",
  });
  const crirReports = getCrirReportsForCompany(workspaceId, cid);
  const workflowRepo = getEcommerceOsWorkflowRepository();
  const workflow = workflowRepo.listWorkflows(workspaceId, cid)[0] ?? null;
  const crirBlockers: ReadinessBlocker[] = [];
  const crirScore = evaluateCrirReadiness(workspaceId, cid, workflow, crirBlockers);
  const crirBlocking = crirBlockers.some((b) => b.severity === "BLOCKING");

  ensurePillowApprovalTables();
  const pillowRepo = new SqlitePillowApprovalRepository();
  const pendingRows = pillowRepo.listApprovals(workspaceId, { status: "Pending" });
  const topPending = pendingRows[0] ?? null;

  const gateValues = Object.values(activation.gates);
  const operationalPercent = Math.round(
    (gateValues.filter(Boolean).length / Math.max(gateValues.length, 1)) * 100,
  );

  const b5Closed = infrastructure.b5Closed;
  const b5Partial = infrastructure.hostingConfigured && !infrastructure.runtimeVerified;
  const b6Tracking = assessB6CredentialImplementation(env);
  const b6Closed = b6Tracking.b6Closed;
  const b6Partial = b6Tracking.progressPercent > 0 && !b6Closed;
  const finalRecommendation = goLiveApproval.items.find((i) => i.itemId === "final-recommendation");
  const b7Closed = finalRecommendation?.status === "READY";
  const b8Closed = proof001.achieved;

  const certificationBlockers: OperationalCommandView["certificationBlockers"] = {
    B5: {
      id: "B5",
      label: "Production deploy + readiness",
      status: b5Closed ? "closed" : b5Partial ? "partial" : "open",
      detail: b5Closed
        ? "Production hosting verified — B5 closed (frozen)"
        : infrastructure.blockers[0] ??
          "Railway + Vercel + Redis deploy pending",
    },
    B6: {
      id: "B6",
      label: "REAL-002B credentials",
      status: b6Closed ? "closed" : b6Partial ? "partial" : "open",
      detail: b6Closed
        ? "All B6 live commerce credentials verified"
        : b6Tracking.nextHighestImpactAction,
    },
    B7: {
      id: "B7",
      label: "GK-GOLIVE-APPROVAL",
      status: b7Closed ? "closed" : goLiveApproval.items.some((i) => i.status === "BLOCKED") ? "open" : "partial",
      detail: finalRecommendation?.recommendation ?? "Grand King go-live approval package pending",
    },
    B8: {
      id: "B8",
      label: "PROOF-001",
      status: b8Closed ? "closed" : proof001.validationCount > 0 ? "partial" : "open",
      detail: proof001.detail,
    },
  };

  const success001Blocker = deriveSuccess001Blocker(success001);
  const omsSummary = getObjectiveReportingSummary(workspaceId, cid);

  const nextExecutiveApproval =
    topPending?.proposal.title ??
    goLiveApproval.items.find((i) => i.status === "BLOCKED")?.label ??
    (b7Closed ? null : "Grand King go-live recommendation review");

  return {
    computedAt: new Date().toISOString(),
    workspaceId,
    companyId: cid,
    certificationBlockers,
    operationalReadiness: {
      percent: operationalPercent,
      passed: activation.ready && isPillowProductionModeEnabled(env),
      detail: activation.ready
        ? isPillowProductionModeEnabled(env)
          ? "Version 1 operational activation ready — Pillow production mode enabled"
          : "Activation gates pass — EMPIRE_V1_OPERATIONAL_READY flag pending (M5)"
        : activation.blockers[0] ?? "Operational activation assessment incomplete",
    },
    crirReadiness: {
      score: crirReports.length > 0 ? crirScore : null,
      launchReady: crirReports.length > 0 && !crirBlocking,
      reportCount: crirReports.length,
      status:
        crirReports.length === 0
          ? "Awaiting implementation"
          : crirBlocking
            ? "BLOCKED"
            : "READY",
      detail:
        crirBlockers[0]?.title ??
        (crirReports.length > 0
          ? `${crirReports.length} CRIR report(s) on file`
          : "No CRIR registered — required before launch with approved products"),
    },
    proof001,
    commerceReadiness: {
      score: commerceDashboard.overallReadinessScore ?? null,
      launchDecision: commerceDashboard.launchDecision ?? "NOT_READY",
      blockingCount: commerceDashboard.blockingItems.filter((b) => b.severity === "BLOCKING").length,
    },
    pendingApprovals: {
      count: pendingRows.length,
      top: topPending
        ? {
            approvalId: topPending.approvalId,
            title: topPending.proposal.title,
            summary: topPending.proposal.summary,
            type: topPending.type,
          }
        : null,
    },
    nextExecutiveApproval,
    success001: {
      blocker: success001Blocker,
      progressPercent: success001.progressPercent,
      currentNetProfitUsd: success001.currentNetProfitUsd,
    },
    implementation: {
      milestone: omsSummary.activeObjective.startsWith("OBJ-")
        ? omsSummary.activeObjective.split(" — ")[0] ?? "OBJ-001"
        : "P0-1",
      phase: "GO-002 Phase 5 — Production Deploy & Credential Activation",
      objective: omsSummary.activeObjective,
      currentBlocker: omsSummary.currentBlocker ?? firstOpenBlockerId(certificationBlockers),
    },
    oms: {
      activeObjective: omsSummary.activeObjective,
      progress: omsSummary.progress,
      confidence: omsSummary.confidence,
      overallHealth: omsSummary.overallHealth,
      currentBlocker: omsSummary.currentBlocker,
      nextHighestImpactAction: omsSummary.nextHighestImpactAction,
      forecastCompletion: omsSummary.forecastCompletion,
      remainingWork: Object.values(certificationBlockers)
        .filter((b) => b.status !== "closed")
        .map((b) => b.detail),
      remainingBlockers: Object.values(certificationBlockers)
        .filter((b) => b.status !== "closed")
        .map((b) => `${b.id}: ${b.detail}`),
    },
  };
}

/** Commerce Launch Centre view — Grand King dashboard + readiness blockers (P0-4). */
export function loadLaunchView(workspaceId: string, companyId?: string): LaunchView {
  const cid = resolveCompanyId(workspaceId, companyId);
  const dashboard = buildGrandKingsDashboard(workspaceId, cid);
  const commerce = dashboard.commerceReadiness;
  const blockers = commerce?.blockingItems ?? [];

  const workflowSteps = [
    { key: "brand", label: "Brand", component: dashboard.brand },
    { key: "products", label: "Products", component: dashboard.products },
    { key: "store", label: "Store", component: dashboard.store },
    { key: "stripe", label: "Payments", component: dashboard.stripe },
    { key: "cj", label: "Fulfillment (CJ)", component: dashboard.cj },
    { key: "launch", label: "Launch", component: dashboard.launch },
  ].map(({ key, label, component }) => {
    const status = mapDashboardStatus(component.status);
    return {
      id: key,
      label,
      description: component.label,
      status,
      progress:
        status === "complete" ? 100 : status === "in_progress" ? 55 : status === "blocked" ? 20 : 0,
    };
  });

  const deploymentChecklist = blockers.length
    ? blockers.map((blocker, index) => ({
        itemId: blocker.id,
        category: blocker.category.toUpperCase(),
        label: blocker.title,
        status:
          blocker.severity === "BLOCKING"
            ? ("blocked" as const)
            : blocker.severity === "WARNING"
              ? ("pending" as const)
              : ("ready" as const),
        note: blocker.recommendedAction ?? blocker.description,
      }))
    : [
        {
          itemId: "readiness-pending",
          category: "COMMERCE",
          label: "Commerce readiness evaluation",
          status: "pending" as const,
          note: "Awaiting implementation — run commerce readiness evaluate",
        },
      ];

  const companyRow = companies.getById(cid);

  return {
    computedAt: dashboard.computedAt,
    workspaceId,
    companyId: cid,
    readinessScore: commerce?.overallReadinessScore ?? null,
    launchDecision: commerce?.launchDecision ?? "NOT_READY",
    launchStatus: dashboard.launch.launchStatus,
    workflowStage: dashboard.workflowStage ?? null,
    focusLabel: companyRow?.name ?? cid,
    focusDetail: dashboard.products.label,
    blockingCount: blockers.filter((b) => b.severity === "BLOCKING").length,
    blockers,
    workflowSteps,
    deploymentChecklist,
    components: workflowSteps.map((s) => ({ key: s.id, label: s.label, status: s.status })),
  };
}
