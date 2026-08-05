import type { AuditQuery, AuditRecord, AuditRuntimeReport } from "./types.js";

let sequence = 0;

export function resetAudrtSequenceForTesting() {
  sequence = 0;
}

/** Deterministic IDs from sequence only — no wall-clock in the ID. */
export function nextAudrtId(prefix: string) {
  sequence += 1;
  return `${prefix}-${sequence}`;
}

export function peekAudrtSequence() {
  return sequence;
}

/**
 * Append-only audit store. NEVER deletes audit records.
 * Retention policies may mark archived via status fields elsewhere — this store never hard-deletes.
 */
export class AuditStore {
  private records: AuditRecord[] = [];
  private reports: AuditRuntimeReport[] = [];
  private auditTrail: string[] = [];

  append(record: AuditRecord) {
    const snapshot = this.cloneRecord(record);
    this.records.push(snapshot);
    this.auditTrail.push(`record_appended:${record.auditRecordId}@${record.timestamp}`);
    return this.cloneRecord(snapshot);
  }

  get(auditRecordId: string) {
    const record = this.records.find((r) => r.auditRecordId === auditRecordId);
    return record ? this.cloneRecord(record) : null;
  }

  list() {
    return this.records.map((r) => this.cloneRecord(r));
  }

  query(query: AuditQuery = {}) {
    return this.records
      .filter((r) => {
        if (query.category != null && r.category !== query.category) return false;
        if (query.missionId != null && r.missionId !== query.missionId) return false;
        if (query.workerId != null && r.workerId !== query.workerId) return false;
        if (query.factoryId != null && r.factoryId !== query.factoryId) return false;
        if (query.fromTimestamp != null && r.timestamp < query.fromTimestamp) return false;
        if (query.toTimestamp != null && r.timestamp > query.toTimestamp) return false;
        return true;
      })
      .map((r) => this.cloneRecord(r))
      .sort((a, b) => {
        const ts = a.timestamp.localeCompare(b.timestamp);
        return ts !== 0 ? ts : a.auditRecordId.localeCompare(b.auditRecordId);
      });
  }

  exportRecords(query: AuditQuery = {}) {
    return this.query(query);
  }

  saveReport(report: AuditRuntimeReport) {
    this.reports.push({
      ...report,
      workerActivitySummary: {
        ...report.workerActivitySummary,
        byCategory: { ...report.workerActivitySummary.byCategory },
        byStatus: { ...report.workerActivitySummary.byStatus },
        supportingEvidence: [...report.workerActivitySummary.supportingEvidence],
        fabricated: false,
        structuralSignalOnly: true,
      },
      missionActivitySummary: {
        ...report.missionActivitySummary,
        byCategory: { ...report.missionActivitySummary.byCategory },
        byStatus: { ...report.missionActivitySummary.byStatus },
        supportingEvidence: [...report.missionActivitySummary.supportingEvidence],
        fabricated: false,
        structuralSignalOnly: true,
      },
      approvalSummary: {
        ...report.approvalSummary,
        byCategory: { ...report.approvalSummary.byCategory },
        byStatus: { ...report.approvalSummary.byStatus },
        supportingEvidence: [...report.approvalSummary.supportingEvidence],
        fabricated: false,
        structuralSignalOnly: true,
      },
      recoverySummary: {
        ...report.recoverySummary,
        byCategory: { ...report.recoverySummary.byCategory },
        byStatus: { ...report.recoverySummary.byStatus },
        supportingEvidence: [...report.recoverySummary.supportingEvidence],
        fabricated: false,
        structuralSignalOnly: true,
      },
      schedulingSummary: {
        ...report.schedulingSummary,
        byCategory: { ...report.schedulingSummary.byCategory },
        byStatus: { ...report.schedulingSummary.byStatus },
        supportingEvidence: [...report.schedulingSummary.supportingEvidence],
        fabricated: false,
        structuralSignalOnly: true,
      },
      evidenceSummary: {
        ...report.evidenceSummary,
        supportingEvidence: [...report.evidenceSummary.supportingEvidence],
        fabricated: false,
        structuralSignalOnly: true,
      },
      integrityVerification: {
        ...report.integrityVerification,
        failedRecordIds: [...report.integrityVerification.failedRecordIds],
        supportingEvidence: [...report.integrityVerification.supportingEvidence],
        fabricated: false,
        structuralSignalOnly: true,
      },
      outstandingIssues: [...report.outstandingIssues],
    });
    this.auditTrail.push(`report_saved:${report.reportId}@${report.timestamp}`);
    return report;
  }

  listReports() {
    return this.reports.map((r) => ({ ...r }));
  }

  getAuditTrail() {
    return [...this.auditTrail];
  }

  getHistory() {
    return {
      records: this.list(),
      reports: this.listReports(),
    };
  }

  /** Explicitly unavailable — audit records are immutable and never deleted. */
  get hasDeleteMethod() {
    return false;
  }

  private cloneRecord(record: AuditRecord): AuditRecord {
    return {
      ...record,
      supportingEvidence: [...record.supportingEvidence],
      relatedRecords: [...record.relatedRecords],
      fabricated: false,
      structuralSignalOnly: true,
    };
  }
}
