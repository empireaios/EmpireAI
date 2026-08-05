import { RECRT_METADATA_VERSION } from "./paths.js";
import type { RecoveryStore } from "./recovery-store.js";
import type { RecrtInput, RecoveryCase } from "./types.js";

/**
 * Resumes interrupted workflows structurally — state/checkpoint refs only.
 */
export class WorkflowResumer {
  resume(
    store: RecoveryStore,
    recovery: RecoveryCase,
    input: RecrtInput = {},
  ): { recovery: RecoveryCase; awaitingApproval: boolean } {
    if (recovery.highRisk && !recovery.grandKingApproved && !input.grandKingApproved) {
      const awaiting = store.updateCase(recovery.recoveryId, {
        recoveryStatus: "awaiting_approval",
        supportingEvidence: [
          ...recovery.supportingEvidence,
          "awaiting_approval:grand_king_required",
        ],
      })!;
      return { recovery: awaiting, awaitingApproval: true };
    }

    const now = new Date().toISOString();
    const stateRef =
      input.stateRef ?? recovery.stateRef ?? `state://recrt/workflow/${recovery.failureId}`;
    const checkpointRef = input.checkpointRef ?? recovery.checkpointRef;

    const resumed = store.updateCase(recovery.recoveryId, {
      recoveryStatus: "resumed",
      startedAt: recovery.startedAt ?? now,
      stateRef,
      checkpointRef: checkpointRef ?? recovery.checkpointRef,
      grandKingApproved: input.grandKingApproved === true || recovery.grandKingApproved,
      supportingEvidence: [
        ...recovery.supportingEvidence,
        `workflow_resumed:${stateRef}`,
        `metadata:${RECRT_METADATA_VERSION}`,
      ],
    })!;

    const completed = store.updateCase(resumed.recoveryId, {
      recoveryStatus: "completed",
      completedAt: now,
      supportingEvidence: [
        ...resumed.supportingEvidence,
        "resume_structural_step_recorded",
      ],
    })!;

    return { recovery: completed, awaitingApproval: false };
  }
}
