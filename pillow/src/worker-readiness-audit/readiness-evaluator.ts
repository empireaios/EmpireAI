import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { WORKER_READINESS_AUDIT_SYSTEM_PATH } from "./paths.js";
import type { WorkerReadinessAuditConfiguration } from "./configuration.js";
import type { WorkerReadinessAuditDependencies } from "./integrations.js";
import type {
  CapabilitySummary,
  GovernanceSummary,
  ReadinessSummary,
  RuntimeSummary,
  WorkerReadinessAssessment,
} from "./types.js";

const BOUNDARY_LOCK_KEYS = [
  "neverFabricateAuditEvidence",
  "neverCertifyMissingWorkers",
  "neverCertifyUnreachableWorkers",
  "neverAssumeImplementation",
  "neverModifyWorkerImplementations",
  "neverRepairFailedWorkers",
  "neverBypassPillowGovernance",
  "neverBypassGrandKingApproval",
  "neverOverrideApprovedArchitecture",
  "neverOverridePillow",
  "neverOverrideGrandKing",
  "neverImplementQ1103OrLater",
  "preserveCompleteTraceability",
  "preserveImmutableAuditHistory",
  "preserveAuditHistory",
  "deterministicAuditBehaviour",
  "structuralSignalOnly",
  "evidenceBasedOnly",
  "maskSensitiveValues",
] as const;

export function evaluateGovernanceSummary(
  root: string,
  config: WorkerReadinessAuditConfiguration,
  matrix: WorkerReadinessAssessment[],
): GovernanceSummary {
  const selfPath = join(root, WORKER_READINESS_AUDIT_SYSTEM_PATH);
  const selfDocPresent = existsSync(selfPath);
  const selfText = selfDocPresent ? readFileSync(selfPath, "utf8") : "";
  const containsExpectedLabel = selfText.includes("Worker Readiness Audit");
  const boundaryLocksHonoured = BOUNDARY_LOCK_KEYS.every(
    (key) => (config as unknown as Record<string, unknown>)[key] === true,
  );
  const governedWorkerCount = matrix.filter(
    (row) => row.governanceStatus === "Passed" || row.governanceStatus === "Partial",
  ).length;
  const compliant = selfDocPresent && containsExpectedLabel && boundaryLocksHonoured;
  return {
    compliant,
    grandKingApprovalRequired: true,
    pillowCommandRequired: true,
    selfDocPresent,
    selfDocPath: WORKER_READINESS_AUDIT_SYSTEM_PATH,
    boundaryLocksHonoured,
    governedWorkerCount,
    totalWorkers: matrix.length,
    evidence: [
      `selfDocPresent=${selfDocPresent}`,
      `containsExpectedLabel=${containsExpectedLabel}`,
      `boundaryLocksHonoured=${boundaryLocksHonoured}`,
      `governedWorkerCount=${governedWorkerCount}/${matrix.length}`,
    ],
  };
}

export function evaluateRuntimeSummary(
  deps: WorkerReadinessAuditDependencies,
  matrix: WorkerReadinessAssessment[],
): RuntimeSummary {
  const sharedRuntimeCoreBound = !!deps.sharedRuntimeCore;
  const pillowOrchestrationRuntimeBound = !!deps.pillowOrchestrationRuntime;
  const reachableWorkerCount = matrix.filter((row) => row.reachabilityStatus === "Passed").length;
  return {
    sharedRuntimeCoreBound,
    pillowOrchestrationRuntimeBound,
    reachableWorkerCount,
    totalWorkers: matrix.length,
    evidence: [
      `sharedRuntimeCoreBound=${sharedRuntimeCoreBound}`,
      `pillowOrchestrationRuntimeBound=${pillowOrchestrationRuntimeBound}`,
      `reachableWorkerCount=${reachableWorkerCount}/${matrix.length}`,
    ],
  };
}

export function evaluateCapabilitySummary(matrix: WorkerReadinessAssessment[]): CapabilitySummary {
  const capableWorkerCount = matrix.filter(
    (row) => row.capabilityStatus === "Passed" || row.capabilityStatus === "Partial",
  ).length;
  return {
    capableWorkerCount,
    totalWorkers: matrix.length,
    evidence: [`capableWorkerCount=${capableWorkerCount}/${matrix.length}`],
  };
}

const READINESS_SCORE_BY_CLASSIFICATION: Record<WorkerReadinessAssessment["readinessClassification"], number> = {
  Ready: 1,
  "Partially Ready": 0.5,
  Deferred: 0.25,
  Blocked: 0,
  Failed: 0,
  Missing: 0,
};

export function evaluateReadinessSummary(matrix: WorkerReadinessAssessment[]): ReadinessSummary {
  const readyCount = matrix.filter((r) => r.readinessClassification === "Ready").length;
  const partiallyReadyCount = matrix.filter((r) => r.readinessClassification === "Partially Ready").length;
  const failedCount = matrix.filter((r) => r.readinessClassification === "Failed").length;
  const missingCount = matrix.filter((r) => r.readinessClassification === "Missing").length;
  const blockedCount = matrix.filter((r) => r.readinessClassification === "Blocked").length;
  const deferredCount = matrix.filter((r) => r.readinessClassification === "Deferred").length;

  const overallReadinessScore =
    matrix.length === 0
      ? 0
      : Math.round(
          (matrix.reduce((sum, r) => sum + READINESS_SCORE_BY_CLASSIFICATION[r.readinessClassification], 0) /
            matrix.length) *
            100,
        ) / 100;

  const ready = matrix.length > 0 && matrix.every((r) => r.readinessClassification === "Ready");

  return {
    computedAt: new Date().toISOString(),
    totalWorkers: matrix.length,
    readyCount,
    partiallyReadyCount,
    failedCount,
    missingCount,
    blockedCount,
    deferredCount,
    overallReadinessScore,
    ready,
    notes: ready
      ? ["All discovered workers observed Ready"]
      : matrix.length === 0
        ? ["No workers discovered — Worker Registry not injected or returned zero workers"]
        : matrix
            .filter((r) => r.readinessClassification !== "Ready")
            .map((r) => `${r.workerId} (${r.workerName}) is ${r.readinessClassification}`),
    evidence: matrix.map((r) => `${r.workerId}:${r.readinessClassification}`),
  };
}
