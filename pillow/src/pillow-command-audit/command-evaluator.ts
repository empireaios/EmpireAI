import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { PILLOW_COMMAND_AUDIT_SYSTEM_PATH } from "./paths.js";
import type { PillowCommandAuditConfiguration } from "./configuration.js";
import type { PillowCommandAuditDependencies } from "./integrations.js";
import type {
  AssignmentSummary,
  CommandReadinessSummary,
  CommunicationSummary,
  GovernanceSummary,
  PillowCommandAssessment,
  SupervisionSummary,
} from "./types.js";

const BOUNDARY_LOCK_KEYS = [
  "neverFabricateAuditEvidence",
  "neverCertifyUnverifiedCommandCapability",
  "neverAssumeImplementation",
  "neverModifyWorkerImplementations",
  "neverRepairFailedWorkers",
  "neverBypassPillowGovernance",
  "neverBypassGrandKingApproval",
  "neverOverrideApprovedArchitecture",
  "neverOverridePillow",
  "neverOverrideGrandKing",
  "neverImplementQ1104OrLater",
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
  config: PillowCommandAuditConfiguration,
  matrix: PillowCommandAssessment[],
): GovernanceSummary {
  const selfPath = join(root, PILLOW_COMMAND_AUDIT_SYSTEM_PATH);
  const selfDocPresent = existsSync(selfPath);
  const selfText = selfDocPresent ? readFileSync(selfPath, "utf8") : "";
  const containsExpectedLabel = selfText.includes("Pillow Command Audit");
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
    selfDocPath: PILLOW_COMMAND_AUDIT_SYSTEM_PATH,
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

export function evaluateAssignmentSummary(
  deps: PillowCommandAuditDependencies,
  matrix: PillowCommandAssessment[],
): AssignmentSummary {
  const missionRuntimeBound = !!deps.missionRuntime;
  const assignableWorkerCount = matrix.filter(
    (row) => row.assignmentStatus === "Passed" || row.assignmentStatus === "Partial",
  ).length;
  return {
    assignableWorkerCount,
    totalWorkers: matrix.length,
    missionRuntimeBound,
    evidence: [
      `missionRuntimeBound=${missionRuntimeBound}`,
      `assignableWorkerCount=${assignableWorkerCount}/${matrix.length}`,
    ],
  };
}

export function evaluateCommunicationSummary(
  deps: PillowCommandAuditDependencies,
  matrix: PillowCommandAssessment[],
): CommunicationSummary {
  const communicationRuntimeBound = !!deps.communicationRuntime;
  const communicableWorkerCount = matrix.filter(
    (row) => row.communicationStatus === "Passed" || row.communicationStatus === "Partial",
  ).length;
  return {
    communicableWorkerCount,
    totalWorkers: matrix.length,
    communicationRuntimeBound,
    evidence: [
      `communicationRuntimeBound=${communicationRuntimeBound}`,
      `communicableWorkerCount=${communicableWorkerCount}/${matrix.length}`,
    ],
  };
}

export function evaluateSupervisionSummary(
  deps: PillowCommandAuditDependencies,
  matrix: PillowCommandAssessment[],
): SupervisionSummary {
  const monitoringRuntimeBound = !!deps.monitoringRuntime;
  const orchestrationRuntimeBound = !!deps.pillowOrchestrationRuntime;
  const supervisedWorkerCount = matrix.filter(
    (row) => row.supervisionStatus === "Passed" || row.supervisionStatus === "Partial",
  ).length;
  const progressTrackedWorkerCount = matrix.filter(
    (row) => row.progressStatus === "Passed" || row.progressStatus === "Partial",
  ).length;
  const resultsCollectedWorkerCount = matrix.filter(
    (row) => row.resultStatus === "Passed" || row.resultStatus === "Partial",
  ).length;
  return {
    supervisedWorkerCount,
    progressTrackedWorkerCount,
    resultsCollectedWorkerCount,
    totalWorkers: matrix.length,
    monitoringRuntimeBound,
    orchestrationRuntimeBound,
    evidence: [
      `monitoringRuntimeBound=${monitoringRuntimeBound}`,
      `orchestrationRuntimeBound=${orchestrationRuntimeBound}`,
      `supervisedWorkerCount=${supervisedWorkerCount}/${matrix.length}`,
      `progressTrackedWorkerCount=${progressTrackedWorkerCount}/${matrix.length}`,
      `resultsCollectedWorkerCount=${resultsCollectedWorkerCount}/${matrix.length}`,
    ],
  };
}

const READINESS_SCORE_BY_CLASSIFICATION: Record<PillowCommandAssessment["readinessClassification"], number> = {
  Ready: 1,
  "Partially Ready": 0.5,
  Deferred: 0.25,
  Blocked: 0,
  Failed: 0,
  Missing: 0,
};

export function evaluateCommandReadinessSummary(matrix: PillowCommandAssessment[]): CommandReadinessSummary {
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
      ? ["All discovered workers observed command-ready"]
      : matrix.length === 0
        ? ["No workers discovered — Worker Registry not injected or returned zero workers"]
        : matrix
            .filter((r) => r.readinessClassification !== "Ready")
            .map((r) => `${r.workerId} is ${r.readinessClassification}`),
    evidence: matrix.map((r) => `${r.workerId}:${r.readinessClassification}`),
  };
}
