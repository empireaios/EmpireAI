import type { AuditRuntimeConfiguration } from "./configuration.js";
import { nextAudrtId, type AuditStore } from "./audit-store.js";
import { IntegrityVerifier } from "./integrity-verifier.js";
import { AUDRT_METADATA_VERSION } from "./paths.js";
import type { AuditRecord, AudrtInput } from "./types.js";

/**
 * Attaches evidence references only — never stores secrets or business payloads.
 */
export class EvidenceCapturer {
  private readonly integrity = new IntegrityVerifier();

  attach(
    store: AuditStore,
    input: AudrtInput,
    config: AuditRuntimeConfiguration,
  ): AuditRecord {
    const refs = [
      ...(input.evidenceRef ? [input.evidenceRef] : []),
      ...(input.evidenceRefs ?? []),
    ].filter((r) => typeof r === "string" && r.length > 0);

    const relatedId = input.auditRecordId ?? input.eventId ?? null;
    const related = relatedId ? store.get(relatedId) : null;
    const relatedByEvent =
      !related && input.eventId
        ? store.list().find((r) => r.eventId === input.eventId) ?? null
        : related;

    const auditRecordId = nextAudrtId("audrt-rec");
    const eventId = nextAudrtId("audrt-evt");
    const timestamp = input.timestamp ?? input.now ?? new Date().toISOString();
    const base = {
      auditRecordId,
      eventId,
      timestamp,
      runtimeComponent: input.runtimeComponent ?? "audit-runtime",
      factoryId: input.factoryId ?? relatedByEvent?.factoryId ?? config.factory,
      workerId: input.workerId ?? relatedByEvent?.workerId ?? config.workerId,
      missionId: input.missionId ?? relatedByEvent?.missionId ?? "Q10-13",
      actionPerformed: "attach_evidence",
      decision: "evidence_attached",
      currentStatus: "recorded",
      supportingEvidence: [...refs],
      relatedRecords: relatedByEvent
        ? [relatedByEvent.auditRecordId, ...(input.relatedRecords ?? [])]
        : [...(input.relatedRecords ?? [])],
      auditReference:
        input.auditReference ??
        relatedByEvent?.auditReference ??
        `audit://audrt/${auditRecordId}`,
      category: "evidence_attachment" as const,
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
