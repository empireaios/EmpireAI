import { countPresentMethods } from "./evidence-collector.js";
import type { RecoveryAuditDependencies } from "./integrations.js";
import type { AllRecoveryComponentKey, CheckStatus, ResilienceClassification, RecoveryAssessment } from "./types.js";
import { handleFor } from "./recovery-discovery.js";
import {
  ALL_RECOVERY_COMPONENT_KEYS,
  RECOVERY_COMPONENT_PROBES,
  RECOVERY_COMPONENT_TYPES,
} from "./paths.js";

let checkSeq = 0;

export function nextRecoveryCheckId() {
  checkSeq += 1;
  return `recart-chk-${String(checkSeq).padStart(4, "0")}`;
}

export function resetRecoveryCheckSequenceForTesting() {
  checkSeq = 0;
}

function capabilityStatus(
  handle: object | null | undefined,
  methodNames: string[],
): { status: CheckStatus; presentCount: number; total: number } {
  if (!handle) return { status: "Missing", presentCount: 0, total: methodNames.length };
  const total = methodNames.length;
  const presentCount = countPresentMethods(handle, methodNames);
  const status: CheckStatus = presentCount === total ? "Passed" : presentCount > 0 ? "Partial" : "Failed";
  return { status, presentCount, total };
}

function notApplicable(dimension: string, componentKey: string, ownedBy: string): { status: CheckStatus; note: string } {
  return {
    status: "Passed",
    note: `${dimension} not applicable to ${componentKey} — evaluated by ${ownedBy}; vacuously satisfied by design scope`,
  };
}

const FAILURE_SCENARIOS: Record<AllRecoveryComponentKey, string> = {
  "recovery-runtime": "primary_runtime_failure",
  "monitoring-runtime": "anomaly_detection_failure",
  "queue-runtime": "queue_stall_failure",
  "mission-runtime": "mission_checkpoint_loss",
  "audit-runtime": "recovery_trail_gap",
  "executive-reporting-runtime": "recovery_reporting_gap",
  "production-certification-core": "certification_signal_loss",
  "pillow-orchestration-runtime": "workflow_resume_failure",
  "worker-registry": "worker_inventory_gap",
  "shared-runtime-core": "runtime_resilience_gap",
  "worker-recovery-system": "worker_recovery_gap",
  "recovery-manager": "recovery_coordination_gap",
  "rollback-manager": "rollback_capability_gap",
};

export type ComponentDimensionResult = {
  detectionStatus: CheckStatus;
  recoveryStatus: CheckStatus;
  restartStatus: CheckStatus;
  rollbackStatus: CheckStatus;
  checkpointStatus: CheckStatus;
  escalationStatus: CheckStatus;
  evidence: string[];
};

export function classifyComponentDimensions(
  componentKey: AllRecoveryComponentKey,
  deps: RecoveryAuditDependencies,
): ComponentDimensionResult {
  const handle = handleFor(componentKey, deps) ?? null;
  const probes = RECOVERY_COMPONENT_PROBES[componentKey];

  if (!handle) {
    return {
      detectionStatus: "Missing",
      recoveryStatus: "Missing",
      restartStatus: "Missing",
      rollbackStatus: "Missing",
      checkpointStatus: "Missing",
      escalationStatus: "Missing",
      evidence: [`discovered=false — no ${componentKey} handle injected; none invented`],
    };
  }

  const getStateCap = capabilityStatus(handle, ["getState"]);
  const probeCap = capabilityStatus(handle, probes);

  switch (componentKey) {
    case "recovery-runtime": {
      const detect = capabilityStatus(handle, ["detectFailure"]);
      const recover = capabilityStatus(handle, ["restoreState", "restartJob"]);
      const restart = capabilityStatus(handle, ["restartJob", "resumeWorkflow"]);
      const rollback = capabilityStatus(handle, ["rollback"]);
      const checkpoint = notApplicable("checkpointStatus", componentKey, "mission-runtime");
      const escalation = capabilityStatus(handle, ["getState"]);
      return {
        detectionStatus: detect.status,
        recoveryStatus: recover.status,
        restartStatus: restart.status,
        rollbackStatus: rollback.status,
        checkpointStatus: checkpoint.status,
        escalationStatus: escalation.status,
        evidence: [
          `detectionStatus=${detect.status} (detectFailure present=${detect.presentCount > 0}; NEVER invoked — presence-only)`,
          `recoveryStatus=${recover.status} (restoreState/restartJob present=${recover.presentCount}/${recover.total}; NEVER invoked)`,
          `restartStatus=${restart.status} (restartJob/resumeWorkflow present=${restart.presentCount}/${restart.total}; NEVER invoked)`,
          `rollbackStatus=${rollback.status} (rollback present=${rollback.presentCount > 0}; NEVER invoked)`,
          checkpoint.note,
          `escalationStatus=${escalation.status} (getState presence=${getStateCap.presentCount > 0})`,
        ],
      };
    }
    case "monitoring-runtime": {
      const detect = capabilityStatus(handle, ["getDashboard", "getState"]);
      const recoverNa = notApplicable("recoveryStatus", componentKey, "recovery-runtime");
      const restartNa = notApplicable("restartStatus", componentKey, "recovery-runtime");
      const rollbackNa = notApplicable("rollbackStatus", componentKey, "recovery-runtime");
      const checkpointNa = notApplicable("checkpointStatus", componentKey, "mission-runtime");
      const escalation = getStateCap;
      return {
        detectionStatus: detect.status,
        recoveryStatus: recoverNa.status,
        restartStatus: restartNa.status,
        rollbackStatus: rollbackNa.status,
        checkpointStatus: checkpointNa.status,
        escalationStatus: escalation.status,
        evidence: [
          `detectionStatus=${detect.status} (getDashboard/getState present=${detect.presentCount}/${detect.total})`,
          recoverNa.note,
          restartNa.note,
          rollbackNa.note,
          checkpointNa.note,
          `escalationStatus=${escalation.status} (getState presence=${getStateCap.presentCount > 0})`,
        ],
      };
    }
    case "mission-runtime": {
      const detect = getStateCap;
      const recover = capabilityStatus(handle, ["resume", "recover"]);
      const restart = capabilityStatus(handle, ["resume"]);
      const rollbackNa = notApplicable("rollbackStatus", componentKey, "recovery-runtime/rollback-manager");
      const checkpoint = capabilityStatus(handle, ["getCheckpoints", "getState"]);
      const escalation = getStateCap;
      return {
        detectionStatus: detect.status,
        recoveryStatus: recover.status,
        restartStatus: restart.status,
        rollbackStatus: rollbackNa.status,
        checkpointStatus: checkpoint.status,
        escalationStatus: escalation.status,
        evidence: [
          `detectionStatus=${detect.status} (getState presence=${getStateCap.presentCount > 0})`,
          `recoveryStatus=${recover.status} (resume/recover present=${recover.presentCount}/${recover.total}; NEVER invoked)`,
          `restartStatus=${restart.status} (resume present=${restart.presentCount > 0}; NEVER invoked)`,
          rollbackNa.note,
          `checkpointStatus=${checkpoint.status} (getCheckpoints present=${checkpoint.presentCount > 0}; NEVER invoked)`,
          `escalationStatus=${escalation.status}`,
        ],
      };
    }
    case "rollback-manager": {
      const detect = getStateCap;
      const recoverNa = notApplicable("recoveryStatus", componentKey, "recovery-runtime");
      const restartNa = notApplicable("restartStatus", componentKey, "recovery-runtime");
      const rollback = capabilityStatus(handle, ["rollback"]);
      const checkpointNa = notApplicable("checkpointStatus", componentKey, "mission-runtime");
      const escalation = getStateCap;
      return {
        detectionStatus: detect.status,
        recoveryStatus: recoverNa.status,
        restartStatus: restartNa.status,
        rollbackStatus: rollback.status,
        checkpointStatus: checkpointNa.status,
        escalationStatus: escalation.status,
        evidence: [
          `detectionStatus=${detect.status}`,
          recoverNa.note,
          restartNa.note,
          `rollbackStatus=${rollback.status} (rollback present=${rollback.presentCount > 0}; NEVER invoked)`,
          checkpointNa.note,
          `escalationStatus=${escalation.status}`,
        ],
      };
    }
    default: {
      const detect = getStateCap;
      const recoverNa = notApplicable("recoveryStatus", componentKey, "recovery-runtime");
      const restartNa = notApplicable("restartStatus", componentKey, "recovery-runtime/mission-runtime");
      const rollbackNa = notApplicable("rollbackStatus", componentKey, "recovery-runtime/rollback-manager");
      const checkpointNa = notApplicable("checkpointStatus", componentKey, "mission-runtime");
      const escalation = probeCap;
      return {
        detectionStatus: detect.status,
        recoveryStatus: recoverNa.status,
        restartStatus: restartNa.status,
        rollbackStatus: rollbackNa.status,
        checkpointStatus: checkpointNa.status,
        escalationStatus: escalation.status,
        evidence: [
          `detectionStatus=${detect.status} (getState presence=${getStateCap.presentCount > 0})`,
          recoverNa.note,
          restartNa.note,
          rollbackNa.note,
          checkpointNa.note,
          `escalationStatus=${escalation.status} (${probeCap.presentCount}/${probeCap.total} catalogued probe methods present; NEVER invoked)`,
        ],
      };
    }
  }
}

export function classifyRecoveryReadiness(statuses: {
  detectionStatus: CheckStatus;
  recoveryStatus: CheckStatus;
  restartStatus: CheckStatus;
  rollbackStatus: CheckStatus;
  checkpointStatus: CheckStatus;
  escalationStatus: CheckStatus;
}): ResilienceClassification {
  const all = [
    statuses.detectionStatus,
    statuses.recoveryStatus,
    statuses.restartStatus,
    statuses.rollbackStatus,
    statuses.checkpointStatus,
    statuses.escalationStatus,
  ];
  if (all.every((s) => s === "Missing")) return "missing";
  if (all.some((s) => s === "Missing")) return "missing";
  if (all.some((s) => s === "Failed")) return "failed";
  if (all.every((s) => s === "Passed")) return "certified";
  return "partially_certified";
}

export function assessComponent(
  componentKey: AllRecoveryComponentKey,
  componentId: string,
  statuses: ComponentDimensionResult,
  resilienceClassification: ResilienceClassification,
  auditReference: string,
  supportingEvidence: string[],
): RecoveryAssessment {
  return {
    recoveryCheckId: nextRecoveryCheckId(),
    componentId,
    componentType: RECOVERY_COMPONENT_TYPES[componentKey],
    failureScenario: FAILURE_SCENARIOS[componentKey],
    detectionStatus: statuses.detectionStatus,
    recoveryStatus: statuses.recoveryStatus,
    restartStatus: statuses.restartStatus,
    rollbackStatus: statuses.rollbackStatus,
    checkpointStatus: statuses.checkpointStatus,
    escalationStatus: statuses.escalationStatus,
    resilienceClassification,
    supportingEvidence,
    auditReference,
    auditTimestamp: new Date().toISOString(),
  };
}

export function buildRecoveryAssessmentMatrix(deps: RecoveryAuditDependencies): RecoveryAssessment[] {
  return ALL_RECOVERY_COMPONENT_KEYS.map((componentKey) => {
    const handle = handleFor(componentKey, deps);
    if (!handle) {
      const empty: ComponentDimensionResult = {
        detectionStatus: "Missing",
        recoveryStatus: "Missing",
        restartStatus: "Missing",
        rollbackStatus: "Missing",
        checkpointStatus: "Missing",
        escalationStatus: "Missing",
        evidence: [`discovered=false — no ${componentKey} handle injected`],
      };
      return assessComponent(
        componentKey,
        componentKey,
        empty,
        "missing",
        `component:${componentKey}`,
        empty.evidence,
      );
    }
    const dims = classifyComponentDimensions(componentKey, deps);
    const classification = classifyRecoveryReadiness(dims);
    return assessComponent(
      componentKey,
      componentKey,
      dims,
      classification,
      `component:${componentKey}`,
      [`discovered=true`, ...dims.evidence],
    );
  });
}
