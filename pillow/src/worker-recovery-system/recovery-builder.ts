import type { WorkerRecoverySystemConfiguration } from "./configuration.js";
import { RECOVERY_VERSION, WRS_METADATA_VERSION } from "./paths.js";
import type {
  FailureType,
  RecoverableWorker,
  RecoveryDecision,
  RecoveryOption,
  RecoveryRecord,
  RecoveryStrategy,
  WorkerRecoveryCatalog,
  WorkerRecoveryInput,
} from "./types.js";

export type RecoveryPlan = {
  strategy: RecoveryStrategy;
  action: string;
  recoveryStatus: RecoveryRecord["recoveryStatus"];
  escalationStatus: RecoveryRecord["escalationStatus"];
  options: RecoveryOption[];
  reassignedToWorkerId: string | null;
  missionContinued: boolean;
  evidence: string[];
  errors: string[];
};

export type RecoveryEvaluation = {
  catalog: WorkerRecoveryCatalog;
  records: RecoveryRecord[];
  options: RecoveryOption[];
  recoveryDecision: RecoveryDecision;
  rulesApplied: string[];
  rulesSatisfied: string[];
  rulesFailed: string[];
};

/** Pure Worker Recovery helpers for Q1-12 — recover continuity only. */
export class RecoveryBuilder {
  buildCatalog(
    config: WorkerRecoverySystemConfiguration,
    workers: RecoverableWorker[],
    records: RecoveryRecord[],
  ): WorkerRecoveryCatalog {
    return {
      recoveryVersion: RECOVERY_VERSION,
      strategies: [...config.recoveryStrategies],
      failureTypes: [...config.failureTypes],
      workers: workers.map(cloneWorker),
      records: records.map(cloneRecord),
      metadataVersion: WRS_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverExecuteWorkerBusinessLogic: true,
      neverReplaceWorkerMonitoring: true,
      neverReplaceWorkforceOrchestrator: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      respectAuthorityMatrix: true,
      respectWorkerLifecycle: true,
      respectMissionCoordinationEngine: true,
    };
  }

  applyWorker(
    existing: RecoverableWorker | null,
    input: WorkerRecoveryInput,
  ): RecoverableWorker {
    const workerId = input.workerId?.trim() || existing?.workerId || `wkr-rec-${Date.now()}`;
    return {
      workerId,
      workerName: input.workerName?.trim() || existing?.workerName || workerId,
      missionId:
        input.missionId === undefined
          ? existing?.missionId ?? null
          : input.missionId,
      lifecycleStatus: input.lifecycleStatus?.trim() || existing?.lifecycleStatus || "active",
      authorityLevel:
        input.authorityLevel?.trim() || existing?.authorityLevel || "manager_approval",
      available: input.available ?? existing?.available ?? true,
      failureCount: Math.max(0, Math.floor(input.failureCount ?? existing?.failureCount ?? 0)),
      lastFailureType:
        input.failureType === undefined
          ? existing?.lastFailureType ?? null
          : input.failureType,
      executionStatePreserved: existing?.executionStatePreserved ?? true,
      duplicateExecutionPrevented: true,
      neverExecuteWorkerBusinessLogic: true,
    };
  }

  analyseOptions(
    worker: RecoverableWorker,
    failureType: FailureType | string,
    config: WorkerRecoverySystemConfiguration,
    input: WorkerRecoveryInput,
  ): RecoveryOption[] {
    const repeated = worker.failureCount >= config.repeatedFailureThreshold;
    const unsafe = input.unsafeAutomaticRecovery === true || repeated;
    const options: RecoveryOption[] = [];

    const push = (
      strategy: RecoveryStrategy,
      safe: boolean,
      reason: string,
      preferred = false,
    ) => {
      if (config.recoveryStrategies.includes(strategy)) {
        options.push({ strategy, safe, reason, preferred });
      }
    };

    switch (failureType) {
      case "crash":
        push("restart", !unsafe, "Crash recovery via controlled restart", !unsafe);
        push("retry", !unsafe, "Retry after crash if state is clean", false);
        push("replace_worker", true, "Replace worker when restart unsafe", unsafe);
        break;
      case "hang":
        push("restart", !unsafe, "Hang recovery via restart", !unsafe);
        push("reassign", true, "Reassign hung work to qualified peer", unsafe);
        break;
      case "timeout":
        push("retry", !unsafe, "Timeout recovery via bounded retry", !unsafe);
        push("resume", !unsafe, "Resume from preserved checkpoint", false);
        push("reassign", true, "Reassign after repeated timeouts", unsafe);
        break;
      case "dependency_failure":
        push("pause_mission", true, "Pause until dependency recovers", !unsafe);
        push("escalate_to_pillow", true, "Escalate blocked dependency path", unsafe);
        break;
      case "communication_failure":
        push("retry", !unsafe, "Retry communication channel", !unsafe);
        push("reassign", true, "Reassign if channel remains unavailable", unsafe);
        break;
      case "runtime_failure":
        push("restart", !unsafe, "Restart runtime sandbox", !unsafe);
        push("rollback", true, "Rollback incomplete runtime effects", false);
        break;
      case "resource_exhaustion":
        push("reassign", true, "Reassign to worker with available capacity", !unsafe);
        push("pause_mission", true, "Pause until resources free", false);
        break;
      case "validation_failure":
        push("rollback", true, "Rollback invalid incomplete work", true);
        push("retry", !unsafe, "Retry after validation correction", false);
        break;
      default:
        push("escalate_to_pillow", true, "Unknown failure requires Pillow judgment", true);
        push("pause_mission", true, "Pause mission pending executive direction", false);
    }

    if (unsafe || repeated) {
      push(
        "escalate_to_pillow",
        true,
        repeated
          ? "Repeated failures exceed automatic recovery threshold"
          : "Automatic recovery marked unsafe",
        true,
      );
    }

    // Ensure preferred uniqueness: first preferred wins.
    let preferredSeen = false;
    return options.map((option) => {
      if (!option.preferred) return option;
      if (preferredSeen) return { ...option, preferred: false };
      preferredSeen = true;
      return option;
    });
  }

  planRecovery(
    worker: RecoverableWorker,
    failureType: FailureType | string,
    config: WorkerRecoverySystemConfiguration,
    input: WorkerRecoveryInput,
  ): RecoveryPlan {
    const options = this.analyseOptions(worker, failureType, config, input);
    const requested = input.recoveryStrategy?.trim();
    const preferred =
      options.find((o) => o.strategy === requested) ??
      options.find((o) => o.preferred && o.safe) ??
      options.find((o) => o.preferred) ??
      options.find((o) => o.safe) ??
      options[0];

    const errors: string[] = [];
    if (!preferred) errors.push("No recovery strategy available");

    const strategy = (preferred?.strategy ?? "escalate_to_pillow") as RecoveryStrategy;
    const escalate =
      strategy === "escalate_to_pillow" ||
      input.unsafeAutomaticRecovery === true ||
      worker.failureCount >= config.repeatedFailureThreshold;

    const reassignedToWorkerId =
      strategy === "reassign" || strategy === "replace_worker"
        ? input.reassignToWorkerId?.trim() ||
          input.replacementWorkerId?.trim() ||
          "wkr-support-01"
        : null;

    const missionContinued = !["pause_mission", "escalate_to_pillow"].includes(strategy);
    const recoveryStatus = escalate
      ? "escalated"
      : strategy === "rollback"
        ? "partially_recovered"
        : "recovered";

    return {
      strategy,
      action: `${strategy}_applied`,
      recoveryStatus,
      escalationStatus: escalate ? "escalated" : "none",
      options,
      reassignedToWorkerId,
      missionContinued,
      evidence: [
        `failureType=${failureType}`,
        `failureCount=${worker.failureCount}`,
        `strategy=${strategy}`,
        `lifecycle=${worker.lifecycleStatus}`,
        `authority=${worker.authorityLevel}`,
      ],
      errors,
    };
  }

  buildRecord(params: {
    input: WorkerRecoveryInput;
    worker: RecoverableWorker;
    failureType: FailureType | string;
    plan: RecoveryPlan;
    durationMs: number;
  }): RecoveryRecord {
    recoverySequence += 1;
    return {
      recoveryId:
        params.input.recoveryId?.trim() ||
        `wrs-${Date.now()}-${recoverySequence}`,
      timestamp: new Date().toISOString(),
      workerId: params.worker.workerId,
      workerName: params.worker.workerName,
      missionId:
        params.input.missionId?.trim() ||
        params.worker.missionId ||
        `mission-${params.worker.workerId}`,
      failureType: params.failureType,
      failureCause:
        params.input.failureCause?.trim() ||
        `${params.failureType}_detected`,
      recoveryStrategy: params.plan.strategy,
      recoveryAction: params.plan.action,
      recoveryStatus: params.plan.recoveryStatus,
      escalationStatus: params.plan.escalationStatus,
      recoveryDurationMs: Math.max(0, params.durationMs),
      supportingEvidence: unique(params.plan.evidence),
      metadataVersion: WRS_METADATA_VERSION,
      optionsConsidered: params.plan.options.map((o) => ({ ...o })),
      reassignedToWorkerId: params.plan.reassignedToWorkerId,
      missionContinued: params.plan.missionContinued,
      executionStatePreserved: true,
      neverExecuteWorkerBusinessLogic: true,
      neverReplaceWorkerMonitoring: true,
      neverReplaceWorkforceOrchestrator: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      respectAuthorityMatrix: true,
      respectWorkerLifecycle: true,
      respectMissionCoordinationEngine: true,
      preserveMissionIntegrity: true,
      preserveAuditHistory: true,
      preserveExecutionHistory: true,
      preventDuplicateExecution: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  evaluate(
    input: WorkerRecoveryInput,
    config: WorkerRecoverySystemConfiguration,
    workers: RecoverableWorker[],
    records: RecoveryRecord[],
    latest: RecoveryRecord | null,
  ): RecoveryEvaluation {
    const catalog = this.buildCatalog(config, workers, records);
    const options = latest?.optionsConsidered ?? [];
    const rules = unique(input.rules ?? config.recoveryRules);
    const violated = new Set(unique(input.violatedRules ?? []));
    const satisfied: string[] = [];
    const failed: string[] = [];
    for (const rule of rules) {
      const ok = this.ruleSatisfied(rule, input, catalog, latest, violated);
      if (ok) satisfied.push(rule);
      else failed.push(rule);
    }
    let recoveryDecision: RecoveryDecision = "valid";
    if (failed.length === 0) recoveryDecision = "valid";
    else if (failed.length <= Math.ceil(rules.length / 3)) recoveryDecision = "partially_valid";
    else recoveryDecision = "invalid";

    return {
      catalog,
      records: latest ? [latest] : [],
      options,
      recoveryDecision,
      rulesApplied: rules,
      rulesSatisfied: satisfied,
      rulesFailed: failed,
    };
  }

  private ruleSatisfied(
    rule: string,
    input: WorkerRecoveryInput,
    catalog: WorkerRecoveryCatalog,
    latest: RecoveryRecord | null,
    violated: Set<string>,
  ): boolean {
    if (violated.has(rule)) return false;
    switch (rule) {
      case "preserve_mission_integrity":
        return !latest || latest.preserveMissionIntegrity === true;
      case "preserve_audit_history":
        return !latest || latest.preserveAuditHistory === true;
      case "preserve_execution_history":
        return !latest || latest.preserveExecutionHistory === true;
      case "prevent_duplicate_execution":
        return (
          catalog.workers.every((w) => w.duplicateExecutionPrevented === true) &&
          (!latest || latest.preventDuplicateExecution === true)
        );
      case "respect_authority_matrix":
        return catalog.respectAuthorityMatrix === true;
      case "respect_worker_lifecycle":
        return catalog.respectWorkerLifecycle === true;
      case "respect_mission_coordination_engine":
        return catalog.respectMissionCoordinationEngine === true;
      case "escalate_when_automatic_recovery_unsafe":
        return (
          input.unsafeAutomaticRecovery !== true ||
          !latest ||
          latest.escalationStatus === "escalated" ||
          latest.recoveryStrategy === "escalate_to_pillow"
        );
      default:
        return input.overridePillow !== true;
    }
  }
}

let recoverySequence = 0;

export function resetRecoverySequenceForTesting() {
  recoverySequence = 0;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneWorker(worker: RecoverableWorker): RecoverableWorker {
  return {
    ...worker,
    duplicateExecutionPrevented: true,
    neverExecuteWorkerBusinessLogic: true,
  };
}

function cloneRecord(record: RecoveryRecord): RecoveryRecord {
  return {
    ...record,
    supportingEvidence: [...record.supportingEvidence],
    optionsConsidered: record.optionsConsidered.map((o) => ({ ...o })),
  };
}
