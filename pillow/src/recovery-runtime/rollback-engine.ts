import { RECRT_METADATA_VERSION } from "./paths.js";
import { nextRecrtId, type RecoveryStore } from "./recovery-store.js";
import type { RecrtInput, RecoveryCase, RollbackRecord } from "./types.js";

/**
 * Rolls back partial execution structurally where strategy requires.
 * Never fabricates success without recorded rollback step.
 */
export class RollbackEngine {
  rollback(
    store: RecoveryStore,
    recovery: RecoveryCase,
    input: RecrtInput = {},
  ): { recovery: RecoveryCase; rollback: RollbackRecord; awaitingApproval: boolean } {
    if (recovery.highRisk && !recovery.grandKingApproved && !input.grandKingApproved) {
      const awaiting = store.updateCase(recovery.recoveryId, {
        recoveryStatus: "awaiting_approval",
        rollbackStatus: "pending",
        supportingEvidence: [
          ...recovery.supportingEvidence,
          "awaiting_approval:grand_king_required",
        ],
      })!;
      const rollback = this.record(store, awaiting, "pending", input);
      return { recovery: awaiting, rollback, awaitingApproval: true };
    }

    const now = new Date().toISOString();
    const checkpointRef =
      input.checkpointRef ?? recovery.checkpointRef ?? `ckpt://recrt/rollback/${recovery.failureId}`;
    const stateRef =
      input.stateRef ?? recovery.stateRef ?? `state://recrt/rollback/${recovery.failureId}`;

    const rolling = store.updateCase(recovery.recoveryId, {
      recoveryStatus: "rolling_back",
      rollbackStatus: "in_progress",
      startedAt: recovery.startedAt ?? now,
      checkpointRef,
      stateRef,
      grandKingApproved: input.grandKingApproved === true || recovery.grandKingApproved,
      supportingEvidence: [
        ...recovery.supportingEvidence,
        `rollback_started:${checkpointRef}`,
      ],
    })!;

    const rollback = this.record(store, rolling, "completed", input);

    const completed = store.updateCase(rolling.recoveryId, {
      recoveryStatus: "completed",
      rollbackStatus: "completed",
      completedAt: now,
      supportingEvidence: [
        ...rolling.supportingEvidence,
        `rollback_completed:${rollback.rollbackId}`,
      ],
    })!;

    return { recovery: completed, rollback, awaitingApproval: false };
  }

  private record(
    store: RecoveryStore,
    recovery: RecoveryCase,
    rollbackStatus: RollbackRecord["rollbackStatus"],
    input: RecrtInput,
  ): RollbackRecord {
    const record: RollbackRecord = {
      rollbackId: nextRecrtId("rbk"),
      recoveryId: recovery.recoveryId,
      failureId: recovery.failureId,
      rollbackStatus,
      checkpointRef: recovery.checkpointRef,
      stateRef: recovery.stateRef,
      timestamp: new Date().toISOString(),
      supportingEvidence: [`rollback_status:${rollbackStatus}`],
      auditReference:
        input.auditReference ?? `audit://recrt/rollback/${recovery.recoveryId}`,
      fabricated: false,
      structuralSignalOnly: true,
      metadataVersion: RECRT_METADATA_VERSION,
    };
    return store.saveRollback(record);
  }
}
