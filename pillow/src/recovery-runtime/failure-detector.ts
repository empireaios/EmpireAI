import { RECRT_METADATA_VERSION } from "./paths.js";
import { nextRecrtId, type RecoveryStore } from "./recovery-store.js";
import type { FailureRecord, RecrtInput } from "./types.js";

/**
 * Detects failures from structural input only — never invents recovery outcomes.
 */
export class FailureDetector {
  detectFailure(store: RecoveryStore, input: RecrtInput): FailureRecord {
    const now = new Date().toISOString();
    const failureId = input.failureId ?? nextRecrtId("fail");
    const existing = store.getFailure(failureId);
    if (existing) {
      return existing;
    }

    const record: FailureRecord = {
      failureId,
      missionId: input.missionId ?? "mission-unknown",
      jobId: input.jobId ?? `job-${failureId}`,
      workerId: input.workerId ?? "wkr-unknown",
      factoryId: input.factoryId ?? "factory-unknown",
      failureClassification: null,
      classificationSignals: [...(input.classificationSignals ?? [])],
      detectedAt: now,
      checkpointRef: input.checkpointRef ?? null,
      stateRef: input.stateRef ?? null,
      highRisk: input.highRisk === true,
      supportingEvidence: [
        `detected:${failureId}`,
        ...(input.auditReference ? [input.auditReference] : []),
      ],
      auditReference: input.auditReference ?? `audit://recrt/failure/${failureId}`,
      fabricated: false,
      structuralSignalOnly: true,
      metadataVersion: RECRT_METADATA_VERSION,
    };

    return store.saveFailure(record);
  }
}
