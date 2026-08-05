import { RECRT_METADATA_VERSION } from "./paths.js";
import { nextRecrtId, type RecoveryStore } from "./recovery-store.js";
import type { CheckpointRecord, RecrtInput, RecoveryCase } from "./types.js";

/**
 * Restores checkpoint/state refs structurally — no business payload.
 * Success only after recorded restore step.
 */
export class StateRestorer {
  restore(
    store: RecoveryStore,
    recovery: RecoveryCase,
    input: RecrtInput = {},
  ): { recovery: RecoveryCase; checkpoint: CheckpointRecord; awaitingApproval: boolean } {
    if (recovery.highRisk && !recovery.grandKingApproved && !input.grandKingApproved) {
      const awaiting = store.updateCase(recovery.recoveryId, {
        recoveryStatus: "awaiting_approval",
        grandKingApproved: false,
        supportingEvidence: [
          ...recovery.supportingEvidence,
          "awaiting_approval:grand_king_required",
        ],
      })!;
      return {
        recovery: awaiting,
        checkpoint: this.registerPending(store, recovery, input),
        awaitingApproval: true,
      };
    }

    const checkpointRef =
      input.checkpointRef ?? recovery.checkpointRef ?? `ckpt://recrt/${recovery.failureId}`;
    const stateRef = input.stateRef ?? recovery.stateRef ?? `state://recrt/${recovery.failureId}`;
    const now = new Date().toISOString();

    const restoring = store.updateCase(recovery.recoveryId, {
      recoveryStatus: "restoring",
      startedAt: recovery.startedAt ?? now,
      checkpointRef,
      stateRef,
      grandKingApproved: input.grandKingApproved === true || recovery.grandKingApproved,
      supportingEvidence: [
        ...recovery.supportingEvidence,
        `restore_started:${checkpointRef}`,
      ],
    })!;

    const checkpoint: CheckpointRecord = {
      checkpointId: nextRecrtId("ckpt"),
      recoveryId: restoring.recoveryId,
      failureId: restoring.failureId,
      checkpointRef,
      stateRef,
      restoredAt: now,
      status: "restored",
      supportingEvidence: [`restored:${checkpointRef}`, `state:${stateRef}`],
      auditReference:
        input.auditReference ?? `audit://recrt/checkpoint/${restoring.recoveryId}`,
      fabricated: false,
      structuralSignalOnly: true,
      metadataVersion: RECRT_METADATA_VERSION,
    };
    store.saveCheckpoint(checkpoint);

    const completed = store.updateCase(restoring.recoveryId, {
      recoveryStatus: "completed",
      completedAt: now,
      checkpointRef,
      stateRef,
      supportingEvidence: [
        ...restoring.supportingEvidence,
        `restore_completed:${checkpoint.checkpointId}`,
      ],
    })!;

    return { recovery: completed, checkpoint, awaitingApproval: false };
  }

  private registerPending(
    store: RecoveryStore,
    recovery: RecoveryCase,
    input: RecrtInput,
  ): CheckpointRecord {
    const checkpoint: CheckpointRecord = {
      checkpointId: nextRecrtId("ckpt"),
      recoveryId: recovery.recoveryId,
      failureId: recovery.failureId,
      checkpointRef: input.checkpointRef ?? recovery.checkpointRef ?? `ckpt://recrt/${recovery.failureId}`,
      stateRef: input.stateRef ?? recovery.stateRef,
      restoredAt: null,
      status: "registered",
      supportingEvidence: ["awaiting_approval"],
      auditReference:
        input.auditReference ?? `audit://recrt/checkpoint/${recovery.recoveryId}`,
      fabricated: false,
      structuralSignalOnly: true,
      metadataVersion: RECRT_METADATA_VERSION,
    };
    return store.saveCheckpoint(checkpoint);
  }
}
