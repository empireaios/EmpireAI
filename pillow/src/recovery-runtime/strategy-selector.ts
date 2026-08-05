import { RECRT_METADATA_VERSION } from "./paths.js";
import { nextRecrtId, type RecoveryStore } from "./recovery-store.js";
import type {
  FailureClassification,
  FailureRecord,
  RecrtInput,
  RecoveryCase,
  RecoveryStrategy,
} from "./types.js";

/**
 * Deterministic strategy selection from failure classification.
 */
export class StrategySelector {
  select(
    store: RecoveryStore,
    failure: FailureRecord,
    input: RecrtInput = {},
    defaultMaxRestarts = 3,
  ): RecoveryCase {
    const existing = store.getCaseByFailureId(failure.failureId);
    const classification = failure.failureClassification ?? "transient";
    const strategy =
      input.recoveryStrategy ?? this.strategyForClassification(classification, failure);

    const highRisk =
      input.highRisk === true ||
      failure.highRisk ||
      classification === "unrecoverable";

    const automaticPermitted =
      input.automaticPermitted === true &&
      !highRisk &&
      strategy !== "escalate_only" &&
      strategy !== "manual_recovery";

    const now = new Date().toISOString();
    const recovery: RecoveryCase = {
      recoveryId: existing?.recoveryId ?? input.recoveryId ?? nextRecrtId("rec"),
      failureId: failure.failureId,
      missionId: failure.missionId,
      jobId: failure.jobId,
      workerId: failure.workerId,
      factoryId: failure.factoryId,
      failureClassification: classification,
      recoveryStrategy: strategy,
      recoveryStatus: "classified",
      restartCount: existing?.restartCount ?? 0,
      maxRestarts: input.maxRestarts ?? existing?.maxRestarts ?? defaultMaxRestarts,
      rollbackStatus: strategy === "rollback_partial" ? "pending" : "not_applicable",
      escalationStatus: strategy === "escalate_only" ? "pending" : "none",
      detectedAt: failure.detectedAt,
      startedAt: existing?.startedAt ?? null,
      completedAt: null,
      checkpointRef: failure.checkpointRef ?? existing?.checkpointRef ?? null,
      stateRef: failure.stateRef ?? existing?.stateRef ?? null,
      supportingEvidence: [
        ...(existing?.supportingEvidence ?? []),
        `strategy:${strategy}`,
        `classification:${classification}`,
      ],
      auditReference:
        input.auditReference ??
        existing?.auditReference ??
        `audit://recrt/recovery/${failure.failureId}`,
      pillowConfirmed: input.pillowConfirmed === true || existing?.pillowConfirmed === true,
      grandKingApproved: input.grandKingApproved === true || existing?.grandKingApproved === true,
      automaticPermitted,
      highRisk,
      fabricated: false,
      structuralSignalOnly: true,
      metadataVersion: RECRT_METADATA_VERSION,
    };

    if (existing) {
      return store.updateCase(existing.recoveryId, recovery) ?? recovery;
    }
    return store.saveCase(recovery);
  }

  strategyForClassification(
    classification: FailureClassification,
    failure: FailureRecord,
  ): RecoveryStrategy {
    switch (classification) {
      case "transient":
      case "timeout":
        return "restart_job";
      case "dependency":
      case "resource":
        return "resume_workflow";
      case "state_corruption":
        return failure.checkpointRef ? "restore_checkpoint" : "rollback_partial";
      case "unrecoverable":
        return "escalate_only";
      case "custom_extension":
        return "custom_extension";
      default:
        return "manual_recovery";
    }
  }
}
