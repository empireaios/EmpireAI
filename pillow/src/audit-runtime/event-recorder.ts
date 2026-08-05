import type { AuditRuntimeConfiguration } from "./configuration.js";
import { nextAudrtId, type AuditStore } from "./audit-store.js";
import { IntegrityVerifier } from "./integrity-verifier.js";
import { AUDRT_METADATA_VERSION } from "./paths.js";
import type { AuditRecord, AudrtInput } from "./types.js";

export class EventRecorder {
  private readonly integrity = new IntegrityVerifier();

  record(
    store: AuditStore,
    input: AudrtInput,
    config: AuditRuntimeConfiguration,
  ): AuditRecord {
    const auditRecordId = input.auditRecordId ?? nextAudrtId("audrt-rec");
    const eventId = input.eventId ?? nextAudrtId("audrt-evt");
    const timestamp = input.timestamp ?? input.now ?? new Date().toISOString();
    const base = {
      auditRecordId,
      eventId,
      timestamp,
      runtimeComponent: input.runtimeComponent ?? "audit-runtime",
      factoryId: input.factoryId ?? config.factory,
      workerId: input.workerId ?? config.workerId,
      missionId: input.missionId ?? "Q10-13",
      actionPerformed: input.actionPerformed ?? "runtime_event",
      decision: input.decision ?? "recorded",
      currentStatus: input.currentStatus ?? "recorded",
      supportingEvidence: [...(input.supportingEvidence ?? [])],
      relatedRecords: [...(input.relatedRecords ?? [])],
      auditReference: input.auditReference ?? `audit://audrt/${auditRecordId}`,
      category: input.category ?? ("runtime_event" as const),
    };
    const integrityDigest = this.integrity.digestForRecord(base);
    const record: AuditRecord = {
      ...base,
      auditIntegrityStatus: "verified",
      fabricated: false,
      structuralSignalOnly: true,
      integrityDigest,
      metadataVersion: AUDRT_METADATA_VERSION,
    };
    return store.append(record);
  }
}
