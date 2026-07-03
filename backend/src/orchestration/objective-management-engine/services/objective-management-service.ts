import {
  assessVersion1OperationalActivation,
  isLiveCommerceProductionMode,
  runVersion1ProductionReadinessReview,
} from "../../version-1-activation/index.js";
import { assessProductionInfrastructureReadiness } from "../../version-1-activation/index.js";
import { assessB6CredentialImplementation } from "../../version-1-activation/index.js";
import {
  buildCommerceReadinessDashboard,
  evaluateCrirReadiness,
  getCrirReportsForCompany,
} from "../../commerce-readiness-engine/index.js";
import { getEcommerceOsWorkflowRepository } from "../../ecommerce-os-orchestrator/repositories/sqlite-ecommerce-os-workflow-repository.js";
import { buildVersion1GoLiveApproval } from "../../../runtime/version-1-go-live-approval/services/version-1-go-live-approval-service.js";
import { listFirstRevenueValidations } from "../../../revenue/first-revenue-validation/services/first-revenue-validation-service.js";
import type { ReadinessBlocker } from "../../commerce-readiness-engine/models/commerce-readiness.js";
import type {
  ExecutiveObjective,
  ExecutivePriority,
  ImplementationAssessment,
  ObjectiveAlert,
  ObjectiveDashboard,
  ObjectiveEvaluationSnapshot,
  ObjectiveHealth,
} from "../models/objective-management.js";
import { getObjectiveManagementRepository } from "../repositories/sqlite-objective-management-repository.js";
import { createDefaultObjectives } from "./objective-default-objectives.js";

const PRIORITY_WEIGHT: Record<ExecutivePriority, number> = {
  CRITICAL: 100,
  HIGH: 75,
  MEDIUM: 50,
  LOW: 25,
};

type LiveObjectiveSignals = {
  proofProgressPercent: number;
  proofAchieved: boolean;
  proofDetail: string;
  operationalPercent: number;
  commerceScore: number | null;
  crirScore: number | null;
  crirBlocking: boolean;
  openCertificationBlockers: string[];
  nextAction: string;
  remainingWork: string[];
  b5Closed: boolean;
  b6Closed: boolean;
  b7Closed: boolean;
  b8Closed: boolean;
  executiveApprovalRequired: boolean;
};

function collectLiveSignals(
  workspaceId: string,
  companyId: string,
  env: NodeJS.ProcessEnv = process.env,
): LiveObjectiveSignals {
  const productionReview = runVersion1ProductionReadinessReview(env);
  const infrastructure = assessProductionInfrastructureReadiness(env);
  const activation = assessVersion1OperationalActivation(env);
  const validations = listFirstRevenueValidations(workspaceId, companyId);
  const latest = validations[0] ?? null;
  const achieved = validations.some(
    (v) =>
      v.profitCents > 0 &&
      v.ledgerVerified &&
      v.allStagesPassed &&
      v.mode === "LIVE" &&
      !v.mock,
  );

  const proofProgressPercent = achieved
    ? 100
    : latest
      ? Math.round(
          (latest.stages.filter((s) => s.status === "PASS").length / latest.stages.length) * 100,
        )
      : 0;

  const proofDetail = achieved
    ? "PROOF-001 achieved"
    : latest?.productionBlockers[0] ??
      (validations.length === 0
        ? "No first-revenue validation runs recorded"
        : `${proofProgressPercent}% validation stages complete`);

  const gateValues = Object.values(activation.gates);
  const operationalPercent = Math.round(
    (gateValues.filter(Boolean).length / Math.max(gateValues.length, 1)) * 100,
  );

  let commerceScore: number | null = null;
  try {
    const commerce = buildCommerceReadinessDashboard({
      workspaceId,
      companyId,
      accountType: "grand_king",
    });
    commerceScore = commerce.overallReadinessScore ?? null;
  } catch {
    commerceScore = null;
  }

  let crirScore: number | null = null;
  let crirBlocking = false;
  try {
    const workflowRepo = getEcommerceOsWorkflowRepository();
    const workflow = workflowRepo.listWorkflows(workspaceId, companyId)[0] ?? null;
    const crirBlockers: ReadinessBlocker[] = [];
    crirScore = evaluateCrirReadiness(workspaceId, companyId, workflow, crirBlockers);
    crirBlocking = crirBlockers.some((b) => b.severity === "BLOCKING");
  } catch {
    crirScore = null;
    crirBlocking = false;
  }

  const b5Closed = infrastructure.b5Closed;
  const b6Tracking = assessB6CredentialImplementation(env);
  const b6Closed = b6Tracking.b6Closed;
  let b7Closed = false;
  try {
    const goLive = buildVersion1GoLiveApproval(workspaceId, companyId);
    const finalRec = goLive.items.find((i) => i.itemId === "final-recommendation");
    b7Closed = finalRec?.status === "READY";
  } catch {
    b7Closed = false;
  }
  const b8Closed = achieved;

  const openCertificationBlockers: string[] = [];
  if (!b5Closed) openCertificationBlockers.push("B5 — Production deploy + readiness");
  if (!b6Closed) openCertificationBlockers.push("B6 — REAL-002B credentials");
  if (!b7Closed) openCertificationBlockers.push("B7 — GK-GOLIVE-APPROVAL");
  if (!b8Closed) openCertificationBlockers.push("B8 — PROOF-001 verified net profit");
  if (crirBlocking) openCertificationBlockers.push("CRIR — Launch certification blocked");

  const remainingWork = [...openCertificationBlockers];
  if (!achieved && validations.length === 0) {
    remainingWork.push("Run first-revenue validation pipeline");
  }

  let nextAction = "B6-01 — Inject Amazon SP-API production credentials on Railway";
  if (!b5Closed) {
    nextAction = infrastructure.hostingConfigured && !infrastructure.runtimeVerified
      ? "Run verify-production-deploy against public URL and set PRODUCTION_DEPLOY_VERIFIED=true"
      : "P0-1 — Production deploy (closes B5)";
  } else if (b5Closed && !b6Closed) {
    nextAction = b6Tracking.nextHighestImpactAction;
  } else if (b5Closed && b6Closed && crirBlocking) {
    nextAction = "Register certified CRIR for first SKU";
  } else if (b5Closed && b6Closed && !b7Closed) {
    nextAction = "Complete Grand King go-live approval package (closes B7)";
  } else if (b5Closed && b6Closed && b7Closed && !b8Closed) {
    nextAction = "Execute first live order and PROOF-001 validation (closes B8)";
  }

  return {
    proofProgressPercent,
    proofAchieved: achieved,
    proofDetail,
    operationalPercent,
    commerceScore,
    crirScore: (() => {
      try {
        return getCrirReportsForCompany(workspaceId, companyId).length > 0 ? crirScore : null;
      } catch {
        return null;
      }
    })(),
    crirBlocking,
    openCertificationBlockers,
    nextAction,
    remainingWork,
    b5Closed,
    b6Closed,
    b7Closed,
    b8Closed,
    executiveApprovalRequired: !b7Closed && b5Closed && b6Closed,
  };
}

function computeForecastCompletion(
  objective: ExecutiveObjective,
  progressPercent: number,
): string | null {
  if (progressPercent >= 100) return new Date().toISOString();
  if (progressPercent <= 0) return objective.targetCompletionDate;

  const startMs = new Date(objective.startDate).getTime();
  const nowMs = Date.now();
  const elapsedMs = Math.max(1, nowMs - startMs);
  const estimatedTotalMs = (elapsedMs / progressPercent) * 100;
  const forecastMs = startMs + estimatedTotalMs;
  return new Date(forecastMs).toISOString();
}

function computeHealth(
  objective: ExecutiveObjective,
  progressPercent: number,
  confidencePercent: number,
  openBlockers: string[],
  forecastDate: string | null,
): ObjectiveHealth {
  const targetMs = new Date(objective.targetCompletionDate).getTime();
  const forecastMs = forecastDate ? new Date(forecastDate).getTime() : targetMs + 1;
  const behindSchedule = forecastMs > targetMs && progressPercent < 100;

  if (progressPercent >= 100) return "GREEN";
  if (openBlockers.length >= 3 || confidencePercent < 35 || (behindSchedule && confidencePercent < 50)) {
    return "RED";
  }
  if (openBlockers.length > 0 || behindSchedule || confidencePercent < 70) {
    return "YELLOW";
  }
  return "GREEN";
}

function computeConfidence(signals: LiveObjectiveSignals): number {
  const commerce = signals.commerceScore ?? 20;
  const crir = signals.crirScore ?? (signals.crirBlocking ? 15 : 40);
  const blockerPenalty = signals.openCertificationBlockers.length * 8;
  const proofBoost = signals.proofAchieved ? 30 : signals.proofProgressPercent * 0.15;
  return Math.min(
    95,
    Math.max(
      5,
      Math.round(
        signals.operationalPercent * 0.25 +
          commerce * 0.2 +
          crir * 0.15 +
          proofBoost +
          25 -
          blockerPenalty,
      ),
    ),
  );
}

function syncProof001Objective(
  objective: ExecutiveObjective,
  signals: LiveObjectiveSignals,
): ExecutiveObjective {
  const gateProgress =
    ([signals.b5Closed, signals.b6Closed, signals.b7Closed, signals.b8Closed].filter(Boolean)
      .length /
      4) *
    100;
  const progressPercent = signals.proofAchieved
    ? 100
    : Math.round(signals.proofProgressPercent * 0.65 + gateProgress * 0.35);

  const confidencePercent = computeConfidence(signals);
  const forecastCompletionDate = computeForecastCompletion(objective, progressPercent);
  const overallHealth = computeHealth(
    objective,
    progressPercent,
    confidencePercent,
    signals.openCertificationBlockers,
    forecastCompletionDate,
  );

  const status = signals.proofAchieved
    ? "COMPLETED"
    : overallHealth === "RED"
      ? "AT_RISK"
      : "ACTIVE";

  return {
    ...objective,
    currentProgressPercent: progressPercent,
    confidencePercent,
    currentBlockers: signals.openCertificationBlockers,
    nextHighestImpactAction: signals.nextAction,
    remainingWork: signals.remainingWork,
    forecastCompletionDate,
    overallHealth,
    status,
    completionDate: signals.proofAchieved ? new Date().toISOString() : null,
    lastUpdated: new Date().toISOString(),
  };
}

function syncObjectiveFromLiveState(
  objective: ExecutiveObjective,
  workspaceId: string,
  companyId: string,
  env?: NodeJS.ProcessEnv,
): ExecutiveObjective {
  const signals = collectLiveSignals(workspaceId, companyId, env);
  if (objective.objectiveId === "OBJ-001" || objective.title.includes("PROOF-001")) {
    return syncProof001Objective(objective, signals);
  }

  const confidencePercent = computeConfidence(signals);
  const forecastCompletionDate = computeForecastCompletion(
    objective,
    objective.currentProgressPercent,
  );
  return {
    ...objective,
    confidencePercent,
    forecastCompletionDate,
    overallHealth: computeHealth(
      objective,
      objective.currentProgressPercent,
      confidencePercent,
      objective.currentBlockers,
      forecastCompletionDate,
    ),
    lastUpdated: new Date().toISOString(),
  };
}

function priorityScore(objective: ExecutiveObjective): number {
  const targetMs = new Date(objective.targetCompletionDate).getTime();
  const remainingDays = Math.max(0, (targetMs - Date.now()) / (1000 * 60 * 60 * 24));
  const urgency = remainingDays <= 14 ? 100 : remainingDays <= 30 ? 70 : 40;
  const criticalPathWeight = objective.criticalPath.length > 0 ? 20 : 0;
  return (
    PRIORITY_WEIGHT[objective.executivePriority] +
    urgency * 0.3 +
    objective.businessValueScore * 0.2 +
    criticalPathWeight -
    objective.currentProgressPercent * 0.1
  );
}

export function prioritizeObjectives(objectives: ExecutiveObjective[]): ExecutiveObjective[] {
  return [...objectives].sort((a, b) => priorityScore(b) - priorityScore(a));
}

function detectMaterialChanges(
  previous: ObjectiveEvaluationSnapshot | null,
  current: ExecutiveObjective,
): ObjectiveAlert[] {
  if (!previous) return [];

  const repo = getObjectiveManagementRepository();
  const alerts: ObjectiveAlert[] = [];
  const now = new Date().toISOString();

  const confidenceDelta = Math.abs(current.confidencePercent - previous.confidencePercent);
  const progressDelta = current.currentProgressPercent - previous.progressPercent;

  if (previous.overallHealth !== "RED" && current.overallHealth === "RED") {
    alerts.push({
      alertId: repo.createId("obj-alert"),
      objectiveId: current.objectiveId,
      workspaceId: current.workspaceId,
      alertType: "at_risk",
      title: `${current.title} is at risk`,
      summary: current.currentBlockers[0] ?? "Objective health degraded to RED",
      materialChange: true,
      createdAt: now,
      acknowledgedAt: null,
    });
  }

  if (progressDelta >= 15 && current.overallHealth === "GREEN") {
    alerts.push({
      alertId: repo.createId("obj-alert"),
      objectiveId: current.objectiveId,
      workspaceId: current.workspaceId,
      alertType: "ahead_of_schedule",
      title: `${current.title} ahead of schedule`,
      summary: `Progress increased to ${current.currentProgressPercent}%`,
      materialChange: true,
      createdAt: now,
      acknowledgedAt: null,
    });
  }

  const newBlockers = current.currentBlockers.filter((b) => !previous.blockers.includes(b));
  if (newBlockers.length > 0) {
    alerts.push({
      alertId: repo.createId("obj-alert"),
      objectiveId: current.objectiveId,
      workspaceId: current.workspaceId,
      alertType: "critical_blocker",
      title: `Critical blocker on ${current.title}`,
      summary: newBlockers[0]!,
      materialChange: true,
      createdAt: now,
      acknowledgedAt: null,
    });
  }

  if (confidenceDelta >= 10) {
    alerts.push({
      alertId: repo.createId("obj-alert"),
      objectiveId: current.objectiveId,
      workspaceId: current.workspaceId,
      alertType: "confidence_change",
      title: `${current.title} confidence changed`,
      summary: `Confidence ${previous.confidencePercent}% → ${current.confidencePercent}%`,
      materialChange: true,
      createdAt: now,
      acknowledgedAt: null,
    });
  }

  if (current.status === "COMPLETED" && previous.progressPercent < 100) {
    alerts.push({
      alertId: repo.createId("obj-alert"),
      objectiveId: current.objectiveId,
      workspaceId: current.workspaceId,
      alertType: "objective_completed",
      title: `${current.title} achieved`,
      summary: current.successCriteria[0] ?? "Objective completed",
      materialChange: true,
      createdAt: now,
      acknowledgedAt: null,
    });
  }

  return alerts;
}

/** Idempotent seed — OBJ-001 PROOF-001. */
export function initializeObjectiveManagement(workspaceId: string, companyId = "co-grand-king"): ExecutiveObjective[] {
  const repo = getObjectiveManagementRepository();
  const existing = repo.listObjectives(workspaceId);
  if (existing.length > 0) {
    return existing;
  }

  const objectives = createDefaultObjectives(workspaceId, companyId);
  for (const objective of objectives) {
    repo.saveObjective(objective);
  }
  return objectives;
}

export function listActiveObjectives(
  workspaceId: string,
  companyId?: string,
): ExecutiveObjective[] {
  const repo = getObjectiveManagementRepository();
  const objectives = repo.listObjectives(workspaceId, { companyId });
  return objectives.filter((o) => o.status === "ACTIVE" || o.status === "AT_RISK");
}

export function getObjective(objectiveId: string): ExecutiveObjective | null {
  return getObjectiveManagementRepository().getObjective(objectiveId);
}

export function evaluateObjective(
  objectiveId: string,
  env?: NodeJS.ProcessEnv,
): { objective: ExecutiveObjective; alerts: ObjectiveAlert[] } {
  const repo = getObjectiveManagementRepository();
  const existing = repo.getObjective(objectiveId);
  if (!existing) {
    throw new Error(`Objective not found: ${objectiveId}`);
  }

  const previous = repo.getLatestSnapshot(objectiveId);
  const synced = syncObjectiveFromLiveState(
    existing,
    existing.workspaceId,
    existing.companyId,
    env,
  );
  const saved = repo.saveObjective(synced);

  const snapshot: ObjectiveEvaluationSnapshot = {
    snapshotId: repo.createId("obj-snap"),
    objectiveId: saved.objectiveId,
    workspaceId: saved.workspaceId,
    progressPercent: saved.currentProgressPercent,
    confidencePercent: saved.confidencePercent,
    overallHealth: saved.overallHealth,
    blockers: saved.currentBlockers,
    nextAction: saved.nextHighestImpactAction,
    evaluatedAt: new Date().toISOString(),
  };
  repo.saveSnapshot(snapshot);

  const alerts = detectMaterialChanges(previous, saved);
  for (const alert of alerts) {
    repo.saveAlert(alert);
  }

  if (saved.currentBlockers.length > 0 && saved.overallHealth === "RED" && alerts.length === 0) {
    const alert: ObjectiveAlert = {
      alertId: repo.createId("obj-alert"),
      objectiveId: saved.objectiveId,
      workspaceId: saved.workspaceId,
      alertType: "at_risk",
      title: `${saved.title} requires attention`,
      summary: saved.currentBlockers[0] ?? "Objective health is RED",
      materialChange: false,
      createdAt: new Date().toISOString(),
      acknowledgedAt: null,
    };
    repo.saveAlert(alert);
    alerts.push(alert);
  }

  return { objective: saved, alerts };
}

export function evaluateAllActiveObjectives(
  workspaceId: string,
  companyId?: string,
  env?: NodeJS.ProcessEnv,
): { objectives: ExecutiveObjective[]; alerts: ObjectiveAlert[] } {
  initializeObjectiveManagement(workspaceId, companyId ?? "co-grand-king");
  const active = listActiveObjectives(workspaceId, companyId);
  const allAlerts: ObjectiveAlert[] = [];
  const evaluated: ExecutiveObjective[] = [];

  for (const objective of active) {
    const result = evaluateObjective(objective.objectiveId, env);
    evaluated.push(result.objective);
    allAlerts.push(...result.alerts);
  }

  return { objectives: prioritizeObjectives(evaluated), alerts: allAlerts };
}

export function buildObjectiveDashboard(
  workspaceId: string,
  companyId = "co-grand-king",
  env?: NodeJS.ProcessEnv,
): ObjectiveDashboard {
  const { objectives, alerts } = evaluateAllActiveObjectives(workspaceId, companyId, env);
  const prioritized = prioritizeObjectives(objectives);
  const repo = getObjectiveManagementRepository();

  return {
    workspaceId,
    companyId,
    activeObjectives: prioritized,
    prioritizedObjectiveIds: prioritized.map((o) => o.objectiveId),
    primaryObjective: prioritized[0] ?? null,
    recentAlerts: repo.listAlerts(workspaceId, 10),
    lastEvaluatedAt: new Date().toISOString(),
    computedAt: new Date().toISOString(),
  };
}

/** Decision rule — does this implementation increase objective success probability? */
export function assessImplementationRecommendation(input: {
  title: string;
  summary: string;
  objectiveIds?: string[];
  workspaceId?: string;
  companyId?: string;
}): ImplementationAssessment {
  const workspaceId = input.workspaceId ?? "ws_empire_1";
  const companyId = input.companyId ?? "co-grand-king";
  const dashboard = buildObjectiveDashboard(workspaceId, companyId);
  const active = dashboard.activeObjectives;
  const haystack = `${input.title} ${input.summary}`.toLowerCase();

  const aligned = active.filter((objective) => {
    const keywords = [
      objective.title,
      objective.objectiveId,
      ...objective.dependencies,
      ...objective.criticalPath,
      objective.nextHighestImpactAction ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return (
      haystack.includes(objective.title.toLowerCase()) ||
      haystack.includes("proof-001") ||
      haystack.includes("b5") ||
      haystack.includes("b6") ||
      haystack.includes("b7") ||
      haystack.includes("b8") ||
      haystack.includes("production deploy") ||
      haystack.includes("credential") ||
      haystack.includes("crir") ||
      keywords.split(/\W+/).some((word) => word.length > 3 && haystack.includes(word))
    );
  });

  const primary = dashboard.primaryObjective;
  const alignedIds =
    input.objectiveIds?.length
      ? input.objectiveIds.filter((id) => active.some((o) => o.objectiveId === id))
      : aligned.map((o) => o.objectiveId);

  if (alignedIds.length === 0) {
    return {
      recommended: false,
      reason:
        "Does not increase probability of achieving active objectives — defer or route to Improvement Vault",
      alignedObjectiveIds: [],
      primaryObjectiveId: primary?.objectiveId ?? null,
      probabilityImpact: "decreases",
    };
  }

  return {
    recommended: true,
    reason: `Aligned with active objective(s): ${alignedIds.join(", ")}`,
    alignedObjectiveIds: alignedIds,
    primaryObjectiveId: primary?.objectiveId ?? alignedIds[0] ?? null,
    probabilityImpact: "increases",
  };
}

export function getObjectiveReportingSummary(
  workspaceId: string,
  companyId = "co-grand-king",
): {
  activeObjective: string;
  progress: number;
  confidence: number;
  currentBlocker: string | null;
  nextHighestImpactAction: string | null;
  forecastCompletion: string | null;
  overallHealth: ObjectiveHealth;
} {
  const dashboard = buildObjectiveDashboard(workspaceId, companyId);
  const primary = dashboard.primaryObjective;
  if (!primary) {
    return {
      activeObjective: "Awaiting implementation",
      progress: 0,
      confidence: 0,
      currentBlocker: null,
      nextHighestImpactAction: null,
      forecastCompletion: null,
      overallHealth: "YELLOW",
    };
  }

  return {
    activeObjective: `${primary.objectiveId} — ${primary.title}`,
    progress: primary.currentProgressPercent,
    confidence: primary.confidencePercent,
    currentBlocker: primary.currentBlockers[0] ?? null,
    nextHighestImpactAction: primary.nextHighestImpactAction,
    forecastCompletion: primary.forecastCompletionDate,
    overallHealth: primary.overallHealth,
  };
}
