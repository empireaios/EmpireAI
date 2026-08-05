import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  ALL_RECOVERY_COMPONENT_KEYS,
  RECOVERY_AUDIT_SYSTEM_PATH,
  REQUIRED_RECOVERY_COMPONENT_KEYS,
} from "./paths.js";
import type { RecoveryAuditConfiguration } from "./configuration.js";
import type { RecoveryAuditDependencies } from "./integrations.js";
import type {
  GovernanceSummary,
  RecoveryAssessment,
  RecoveryDimensionSummary,
  RecoveryReadinessSummary,
} from "./types.js";

export function evaluateGovernanceSummary(
  repositoryRoot: string,
  config: RecoveryAuditConfiguration,
  deps: RecoveryAuditDependencies,
): GovernanceSummary {
  const selfDocPath = join(repositoryRoot, RECOVERY_AUDIT_SYSTEM_PATH);
  const selfDocPresent = existsSync(selfDocPath);
  const requiredBound = REQUIRED_RECOVERY_COMPONENT_KEYS.filter((key) => {
    switch (key) {
      case "recovery-runtime":
        return !!deps.recoveryRuntime;
      case "monitoring-runtime":
        return !!deps.monitoringRuntime;
      case "worker-registry":
        return !!deps.workerRegistry;
      default:
        return false;
    }
  }).length;
  const compliant =
    selfDocPresent &&
    config.neverFabricateRecoveryEvidence &&
    config.neverMutateProductionViaRecoveryCalls &&
    config.neverImplementQ1108OrLater;
  return {
    compliant,
    grandKingApprovalRequired: true,
    recoveryAuditRequired: true,
    selfDocPresent,
    selfDocPath: RECOVERY_AUDIT_SYSTEM_PATH,
    boundaryLocksHonoured: config.neverImplementQ1108OrLater,
    requiredComponentsBoundCount: requiredBound,
    totalRequiredComponents: REQUIRED_RECOVERY_COMPONENT_KEYS.length,
    evidence: [
      `selfDocPresent=${selfDocPresent}`,
      `requiredComponentsBound=${requiredBound}/${REQUIRED_RECOVERY_COMPONENT_KEYS.length}`,
      `neverMutateProductionViaRecoveryCalls=${config.neverMutateProductionViaRecoveryCalls}`,
    ],
  };
}

export function evaluateRecoveryReadinessSummary(matrix: RecoveryAssessment[]): RecoveryReadinessSummary {
  const now = new Date().toISOString();
  const totalComponents = matrix.length;
  const certifiedCount = matrix.filter((r) => r.resilienceClassification === "certified").length;
  const partiallyCertifiedCount = matrix.filter((r) => r.resilienceClassification === "partially_certified").length;
  const failedCount = matrix.filter((r) => r.resilienceClassification === "failed").length;
  const missingCount = matrix.filter((r) => r.resilienceClassification === "missing").length;
  const blockedCount = matrix.filter((r) => r.resilienceClassification === "blocked").length;
  const deferredCount = matrix.filter((r) => r.resilienceClassification === "deferred").length;
  const overallReadinessScore =
    totalComponents === 0 ? 0 : Math.round((certifiedCount + partiallyCertifiedCount * 0.5) / totalComponents * 100) / 100;
  return {
    computedAt: now,
    totalComponents,
    certifiedCount,
    partiallyCertifiedCount,
    failedCount,
    missingCount,
    blockedCount,
    deferredCount,
    overallReadinessScore,
    allCertified: totalComponents > 0 && certifiedCount === totalComponents,
    notes: [
      "Recovery readiness derived strictly from capability-presence evidence — destructive recovery methods NEVER invoked during audit",
    ],
    evidence: [
      `certified=${certifiedCount}`,
      `partially_certified=${partiallyCertifiedCount}`,
      `failed=${failedCount}`,
      `missing=${missingCount}`,
    ],
  };
}

function dimensionSummary(
  dimension: RecoveryDimensionSummary["dimension"],
  matrix: RecoveryAssessment[],
  pick: (row: RecoveryAssessment) => string,
): RecoveryDimensionSummary {
  const statuses = matrix.map(pick);
  return {
    dimension,
    passedCount: statuses.filter((s) => s === "Passed").length,
    partialCount: statuses.filter((s) => s === "Partial").length,
    failedCount: statuses.filter((s) => s === "Failed").length,
    missingCount: statuses.filter((s) => s === "Missing").length,
    totalComponents: matrix.length,
    evidence: [`${dimension} assessed across ${matrix.length} catalogued components`],
  };
}

export function evaluateFailureDetectionSummary(matrix: RecoveryAssessment[]) {
  return dimensionSummary("failureDetection", matrix, (r) => r.detectionStatus);
}

export function evaluateAutomaticRecoverySummary(matrix: RecoveryAssessment[]) {
  return dimensionSummary("automaticRecovery", matrix, (r) => r.recoveryStatus);
}

export function evaluateManualRecoverySummary(matrix: RecoveryAssessment[]) {
  return dimensionSummary("manualRecovery", matrix, (r) => r.recoveryStatus);
}

export function evaluateRollbackSummary(matrix: RecoveryAssessment[]) {
  return dimensionSummary("rollback", matrix, (r) => r.rollbackStatus);
}

export function evaluateRestartSummary(matrix: RecoveryAssessment[]) {
  return dimensionSummary("workflowRestart", matrix, (r) => r.restartStatus);
}

export function evaluateCheckpointSummary(matrix: RecoveryAssessment[]) {
  return dimensionSummary("checkpointRestoration", matrix, (r) => r.checkpointStatus);
}

export function evaluateEscalationSummary(matrix: RecoveryAssessment[]) {
  return dimensionSummary("escalation", matrix, (r) => r.escalationStatus);
}

export function evaluateResilienceSummary(matrix: RecoveryAssessment[]): RecoveryDimensionSummary {
  const now = new Date().toISOString();
  const classifications = matrix.map((r) => r.resilienceClassification);
  return {
    dimension: "enterpriseResilience",
    passedCount: classifications.filter((c) => c === "certified").length,
    partialCount: classifications.filter((c) => c === "partially_certified").length,
    failedCount: classifications.filter((c) => c === "failed").length,
    missingCount: classifications.filter((c) => c === "missing").length,
    totalComponents: matrix.length,
    evidence: [`enterpriseResilience assessed at ${now} across ${ALL_RECOVERY_COMPONENT_KEYS.length} catalogued keys`],
  };
}
