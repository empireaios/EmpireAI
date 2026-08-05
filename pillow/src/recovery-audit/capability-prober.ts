import type { RecoveryAuditDependencies } from "./integrations.js";
import { buildRecoveryAssessmentMatrix } from "./recovery-classifier.js";
import type { RecoveryAssessment } from "./types.js";

/** Structural capability probe — builds assessment matrix from presence-only evidence. NEVER invokes mutating recovery methods. */
export function probeRecoveryCapabilities(deps: RecoveryAuditDependencies): RecoveryAssessment[] {
  return buildRecoveryAssessmentMatrix(deps);
}

export function verifyFailureDetection(deps: RecoveryAuditDependencies) {
  return buildRecoveryAssessmentMatrix(deps).map((row) => ({
    componentId: row.componentId,
    detectionStatus: row.detectionStatus,
    evidence: row.supportingEvidence,
  }));
}

export function verifyAutomaticRecovery(deps: RecoveryAuditDependencies) {
  return buildRecoveryAssessmentMatrix(deps).map((row) => ({
    componentId: row.componentId,
    recoveryStatus: row.recoveryStatus,
    evidence: row.supportingEvidence,
  }));
}

export function verifyManualRecovery(deps: RecoveryAuditDependencies) {
  return buildRecoveryAssessmentMatrix(deps).map((row) => ({
    componentId: row.componentId,
    recoveryStatus: row.recoveryStatus,
    evidence: row.supportingEvidence,
  }));
}

export function verifyRollbackCapability(deps: RecoveryAuditDependencies) {
  return buildRecoveryAssessmentMatrix(deps).map((row) => ({
    componentId: row.componentId,
    rollbackStatus: row.rollbackStatus,
    evidence: row.supportingEvidence,
  }));
}

export function verifyWorkflowRestart(deps: RecoveryAuditDependencies) {
  return buildRecoveryAssessmentMatrix(deps).map((row) => ({
    componentId: row.componentId,
    restartStatus: row.restartStatus,
    evidence: row.supportingEvidence,
  }));
}

export function verifyCheckpointRestoration(deps: RecoveryAuditDependencies) {
  return buildRecoveryAssessmentMatrix(deps).map((row) => ({
    componentId: row.componentId,
    checkpointStatus: row.checkpointStatus,
    evidence: row.supportingEvidence,
  }));
}

export function verifyRecoveryEscalation(deps: RecoveryAuditDependencies) {
  return buildRecoveryAssessmentMatrix(deps).map((row) => ({
    componentId: row.componentId,
    escalationStatus: row.escalationStatus,
    evidence: row.supportingEvidence,
  }));
}

export function verifyEnterpriseResilience(deps: RecoveryAuditDependencies) {
  return buildRecoveryAssessmentMatrix(deps).map((row) => ({
    componentId: row.componentId,
    resilienceClassification: row.resilienceClassification,
    evidence: row.supportingEvidence,
  }));
}
