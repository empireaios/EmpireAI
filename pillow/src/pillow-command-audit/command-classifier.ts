import { GOVERNED_CERTIFICATION_STATUS, PARTIAL_CERTIFICATION_STATUS } from "./paths.js";
import type {
  CheckStatus,
  CommandDispatchProbeResult,
  PillowCommandAssessment,
  ReadinessClassification,
  RegisteredWorkerRecord,
} from "./types.js";

/**
 * Verifies worker assignment structurally: factory + role present, and
 * probes missionRuntime.createMission presence as structural mission
 * assignment capability. Never fabricates a passing result.
 */
export function classifyAssignment(
  worker: RegisteredWorkerRecord,
  missionRuntimeBound: boolean,
): CheckStatus {
  const hasFactory = Boolean(worker.factory);
  const hasRole = Boolean(worker.role);
  const structural = hasFactory && hasRole;
  if (!hasFactory) return "Missing";
  if (structural && missionRuntimeBound) return "Passed";
  if (structural || missionRuntimeBound) return "Partial";
  return "Failed";
}

/**
 * Verifies worker communication: probes communicationRuntime.sendMessage /
 * acknowledgeMessage presence. Presence evidence only — never sends or
 * acknowledges a real message.
 */
export function classifyCommunication(sendBound: boolean, acknowledgeBound: boolean): CheckStatus {
  if (sendBound && acknowledgeBound) return "Passed";
  if (sendBound || acknowledgeBound) return "Partial";
  return "Missing";
}

/**
 * Verifies supervision capability: monitoringRuntime / pillowOrchestrationRuntime
 * presence structural signals.
 */
export function classifySupervision(monitoringBound: boolean, orchestrationBound: boolean): CheckStatus {
  if (monitoringBound && orchestrationBound) return "Passed";
  if (monitoringBound || orchestrationBound) return "Partial";
  return "Missing";
}

/**
 * Verifies progress tracking: monitoringRuntime produceReport/list/getState
 * presence.
 */
export function classifyProgress(progressCapable: boolean, monitoringBound: boolean): CheckStatus {
  if (progressCapable) return "Passed";
  if (monitoringBound) return "Partial";
  return "Missing";
}

/**
 * Verifies result collection: orchestration retrieveReport or ERR
 * retrieveReport structural presence.
 */
export function classifyResult(
  orchestrationCapable: boolean,
  executiveReportingCapable: boolean,
  anyRuntimeBound: boolean,
): CheckStatus {
  if (orchestrationCapable || executiveReportingCapable) return "Passed";
  if (anyRuntimeBound) return "Partial";
  return "Missing";
}

/**
 * Verifies worker governance: certificationStatus + governingAuthority /
 * reportingLine chain to "pillow" when present. Pillow governance is
 * required; never bypassed.
 */
export function classifyGovernance(worker: RegisteredWorkerRecord): CheckStatus {
  const certified = worker.certificationStatus === GOVERNED_CERTIFICATION_STATUS;
  const certPending = worker.certificationStatus === PARTIAL_CERTIFICATION_STATUS;
  const reportsToPillow =
    worker.governingAuthority === "pillow" || worker.reportingLine.includes("pillow");
  if (certified && reportsToPillow) return "Passed";
  if (certified || certPending || reportsToPillow) return "Partial";
  if (!worker.certificationStatus && worker.reportingLine.length === 0) return "Missing";
  return "Failed";
}

/**
 * Deterministic classifier from evidence only — never certifies unverified
 * command capability. A worker only reaches "Ready" when every dimension is
 * Passed AND the command dispatch channel (invokeWorker presence) was
 * itself verified; otherwise it is capped at "Partially Ready".
 */
export function classifyCommandReadiness(
  statuses: {
    assignmentStatus: CheckStatus;
    communicationStatus: CheckStatus;
    supervisionStatus: CheckStatus;
    progressStatus: CheckStatus;
    resultStatus: CheckStatus;
    governanceStatus: CheckStatus;
  },
  dispatchStatus: CheckStatus,
): ReadinessClassification {
  const values = Object.values(statuses);
  if (values.includes("Missing")) return "Missing";
  if (statuses.assignmentStatus === "Failed") return "Failed";
  if (values.includes("Failed")) return "Failed";
  if (values.every((v) => v === "Passed")) {
    return dispatchStatus === "Passed" ? "Ready" : "Partially Ready";
  }
  return "Partially Ready";
}

export function assessWorker(
  worker: RegisteredWorkerRecord,
  dispatch: CommandDispatchProbeResult,
  missionRuntimeBound: boolean,
  communicationBound: { send: boolean; acknowledge: boolean },
  supervisionBound: { monitoring: boolean; orchestration: boolean },
  progressBound: { capable: boolean; monitoringBound: boolean },
  resultBound: { orchestrationCapable: boolean; executiveReportingCapable: boolean; anyBound: boolean },
  auditReference: string,
): PillowCommandAssessment {
  const assignmentStatus = classifyAssignment(worker, missionRuntimeBound);
  const communicationStatus = classifyCommunication(communicationBound.send, communicationBound.acknowledge);
  const supervisionStatus = classifySupervision(supervisionBound.monitoring, supervisionBound.orchestration);
  const progressStatus = classifyProgress(progressBound.capable, progressBound.monitoringBound);
  const resultStatus = classifyResult(
    resultBound.orchestrationCapable,
    resultBound.executiveReportingCapable,
    resultBound.anyBound,
  );
  const governanceStatus = classifyGovernance(worker);
  const readinessClassification = classifyCommandReadiness(
    { assignmentStatus, communicationStatus, supervisionStatus, progressStatus, resultStatus, governanceStatus },
    dispatch.dispatchStatus,
  );

  const supportingEvidence = [
    `assignmentStatus=${assignmentStatus} (missionRuntimeBound=${missionRuntimeBound})`,
    `dispatchStatus=${dispatch.dispatchStatus} (commandId=${dispatch.commandId})`,
    `communicationStatus=${communicationStatus} (send=${communicationBound.send}, acknowledge=${communicationBound.acknowledge})`,
    `supervisionStatus=${supervisionStatus} (monitoring=${supervisionBound.monitoring}, orchestration=${supervisionBound.orchestration})`,
    `progressStatus=${progressStatus} (capable=${progressBound.capable})`,
    `resultStatus=${resultStatus} (orchestrationCapable=${resultBound.orchestrationCapable}, executiveReportingCapable=${resultBound.executiveReportingCapable})`,
    `governanceStatus=${governanceStatus}`,
  ];

  return {
    workerId: worker.workerId,
    factoryId: worker.factory ?? "",
    commandId: dispatch.commandId,
    assignmentStatus,
    communicationStatus,
    supervisionStatus,
    progressStatus,
    resultStatus,
    governanceStatus,
    readinessClassification,
    supportingEvidence,
    auditReference,
    auditTimestamp: new Date().toISOString(),
  };
}
