import { AUDRT_METADATA_VERSION } from "./paths.js";
import { nextAudrtId } from "./audit-store.js";
import type { AuditRecord, IntegrityVerificationResult } from "./types.js";

/**
 * Deterministic djb2-style hash over a canonical field string.
 * No crypto dependency — same fields always produce the same digest.
 */
export function computeIntegrityDigest(fields: {
  auditRecordId: string;
  eventId: string;
  timestamp: string;
  runtimeComponent: string;
  factoryId: string;
  workerId: string;
  missionId: string;
  actionPerformed: string;
  decision: string;
  currentStatus: string;
  supportingEvidence: string[];
  relatedRecords: string[];
  auditReference: string;
  category: string;
}): string {
  const canonical = [
    fields.auditRecordId,
    fields.eventId,
    fields.timestamp,
    fields.runtimeComponent,
    fields.factoryId,
    fields.workerId,
    fields.missionId,
    fields.actionPerformed,
    fields.decision,
    fields.currentStatus,
    fields.supportingEvidence.join("|"),
    fields.relatedRecords.join("|"),
    fields.auditReference,
    fields.category,
    "fabricated:false",
    "structuralSignalOnly:true",
  ].join("\u001f");

  let hash = 5381;
  for (let i = 0; i < canonical.length; i += 1) {
    hash = ((hash << 5) + hash + canonical.charCodeAt(i)) >>> 0;
  }
  return `djb2:${hash.toString(16).padStart(8, "0")}`;
}

export class IntegrityVerifier {
  digestForRecord(
    record: Omit<AuditRecord, "integrityDigest" | "auditIntegrityStatus" | "metadataVersion" | "fabricated" | "structuralSignalOnly"> &
      Partial<Pick<AuditRecord, "fabricated" | "structuralSignalOnly">>,
  ): string {
    return computeIntegrityDigest({
      auditRecordId: record.auditRecordId,
      eventId: record.eventId,
      timestamp: record.timestamp,
      runtimeComponent: record.runtimeComponent,
      factoryId: record.factoryId,
      workerId: record.workerId,
      missionId: record.missionId,
      actionPerformed: record.actionPerformed,
      decision: record.decision,
      currentStatus: record.currentStatus,
      supportingEvidence: record.supportingEvidence,
      relatedRecords: record.relatedRecords,
      auditReference: record.auditReference,
      category: record.category,
    });
  }

  verifyRecord(record: AuditRecord): boolean {
    const expected = this.digestForRecord(record);
    return expected === record.integrityDigest;
  }

  verifyAll(records: AuditRecord[]): IntegrityVerificationResult {
    const failedRecordIds: string[] = [];
    let verifiedCount = 0;
    let failedCount = 0;
    let tamperedSuspectedCount = 0;
    let pendingCount = 0;

    for (const record of records) {
      if (record.auditIntegrityStatus === "pending") {
        pendingCount += 1;
      }
      if (!this.verifyRecord(record)) {
        failedCount += 1;
        tamperedSuspectedCount += 1;
        failedRecordIds.push(record.auditRecordId);
      } else {
        verifiedCount += 1;
      }
    }

    const allPassed = failedCount === 0;
    return {
      verificationId: nextAudrtId("audrt-verify"),
      timestamp: new Date().toISOString(),
      totalChecked: records.length,
      verifiedCount,
      failedCount,
      tamperedSuspectedCount,
      pendingCount,
      allPassed,
      failedRecordIds,
      supportingEvidence: [
        `checked=${records.length}`,
        `verified=${verifiedCount}`,
        `failed=${failedCount}`,
        "digest_algorithm=djb2_canonical",
        "never_fabricated",
      ],
      fabricated: false,
      structuralSignalOnly: true,
      metadataVersion: AUDRT_METADATA_VERSION,
    };
  }
}
