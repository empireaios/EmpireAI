import { RECRT_METADATA_VERSION } from "./paths.js";
import { nextRecrtId, type RecoveryStore } from "./recovery-store.js";
import type { RecrtInput, RecoveryCase, RestartRecord } from "./types.js";

/**
 * Restarts failed jobs structurally. Increments restartCount.
 * Fails if maxRestarts exceeded — never fabricates success.
 */
export class JobRestarter {
  restart(
    store: RecoveryStore,
    recovery: RecoveryCase,
    input: RecrtInput = {},
  ): { recovery: RecoveryCase; restart: RestartRecord; awaitingApproval: boolean } {
    if (recovery.highRisk && !recovery.grandKingApproved && !input.grandKingApproved) {
      const awaiting = store.updateCase(recovery.recoveryId, {
        recoveryStatus: "awaiting_approval",
        supportingEvidence: [
          ...recovery.supportingEvidence,
          "awaiting_approval:grand_king_required",
        ],
      })!;
      const restart = this.record(store, recovery, "pending", input);
      return { recovery: awaiting, restart, awaitingApproval: true };
    }

    const nextAttempt = recovery.restartCount + 1;
    const now = new Date().toISOString();

    if (nextAttempt > recovery.maxRestarts) {
      const restart = this.record(store, recovery, "max_exceeded", input, nextAttempt);
      const failed = store.updateCase(recovery.recoveryId, {
        recoveryStatus: "failed",
        escalationStatus: "pending",
        completedAt: now,
        supportingEvidence: [
          ...recovery.supportingEvidence,
          `max_restarts_exceeded:${recovery.maxRestarts}`,
        ],
      })!;
      return { recovery: failed, restart, awaitingApproval: false };
    }

    const restarting = store.updateCase(recovery.recoveryId, {
      recoveryStatus: "restarting",
      startedAt: recovery.startedAt ?? now,
      restartCount: nextAttempt,
      grandKingApproved: input.grandKingApproved === true || recovery.grandKingApproved,
      supportingEvidence: [
        ...recovery.supportingEvidence,
        `restart_attempt:${nextAttempt}`,
      ],
    })!;

    const restart = this.record(store, restarting, "restarted", input, nextAttempt);

    const completed = store.updateCase(restarting.recoveryId, {
      recoveryStatus: "completed",
      completedAt: now,
      supportingEvidence: [
        ...restarting.supportingEvidence,
        `restart_completed:${restart.restartId}`,
      ],
    })!;

    return { recovery: completed, restart, awaitingApproval: false };
  }

  private record(
    store: RecoveryStore,
    recovery: RecoveryCase,
    status: RestartRecord["status"],
    input: RecrtInput,
    attempt = recovery.restartCount,
  ): RestartRecord {
    const restart: RestartRecord = {
      restartId: nextRecrtId("rst"),
      recoveryId: recovery.recoveryId,
      failureId: recovery.failureId,
      jobId: recovery.jobId,
      attempt,
      maxRestarts: recovery.maxRestarts,
      status,
      timestamp: new Date().toISOString(),
      supportingEvidence: [`restart_status:${status}`, `job:${recovery.jobId}`],
      auditReference:
        input.auditReference ?? `audit://recrt/restart/${recovery.recoveryId}`,
      fabricated: false,
      structuralSignalOnly: true,
      metadataVersion: RECRT_METADATA_VERSION,
    };
    return store.saveRestart(restart);
  }
}
