import { RECRT_METADATA_VERSION } from "./paths.js";
import { nextRecrtId, type RecoveryStore } from "./recovery-store.js";
import type { EscalationRecord, RecrtInput, RecoveryCase } from "./types.js";

/**
 * Escalates unrecoverable failures. Never fabricates resolution.
 */
export class EscalationEngine {
  escalate(
    store: RecoveryStore,
    recovery: RecoveryCase,
    input: RecrtInput = {},
  ): { recovery: RecoveryCase; escalation: EscalationRecord } {
    const now = new Date().toISOString();
    const reasonRef =
      input.auditReference ??
      `audit://recrt/escalate/${recovery.failureId}/${recovery.failureClassification}`;

    // Escalation itself records structural escalation — does not claim resolved success.
    const escalation: EscalationRecord = {
      escalationId: nextRecrtId("esc"),
      recoveryId: recovery.recoveryId,
      failureId: recovery.failureId,
      escalationStatus: "escalated",
      reasonRef,
      timestamp: now,
      supportingEvidence: [
        `escalated:${recovery.failureClassification}`,
        `strategy:${recovery.recoveryStrategy}`,
        "never_fabricated_resolution",
      ],
      auditReference: reasonRef,
      fabricated: false,
      structuralSignalOnly: true,
      metadataVersion: RECRT_METADATA_VERSION,
    };
    store.saveEscalation(escalation);

    const updated = store.updateCase(recovery.recoveryId, {
      recoveryStatus: "escalated",
      escalationStatus: "escalated",
      startedAt: recovery.startedAt ?? now,
      completedAt: now,
      grandKingApproved: input.grandKingApproved === true || recovery.grandKingApproved,
      supportingEvidence: [
        ...recovery.supportingEvidence,
        `escalation_recorded:${escalation.escalationId}`,
        "resolution_not_fabricated",
      ],
    })!;

    return { recovery: updated, escalation };
  }
}
