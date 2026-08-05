import type { CertificationHistoryEntry, QSeriesCertificationReport } from "./types.js";

let reportSeq = 0;
let historySeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `qscrt-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextHistoryEntryId() {
  historySeq += 1;
  return `qscrt-hist-${String(historySeq).padStart(4, "0")}`;
}

export function resetQscrtSequenceForTesting() {
  reportSeq = 0;
  historySeq = 0;
}

export class AuditStore {
  private reports: QSeriesCertificationReport[] = [];
  private history: CertificationHistoryEntry[] = [];
  private auditTrail: string[] = [];

  seed(reports: QSeriesCertificationReport[]) {
    for (const report of reports) {
      this.reports.push({ ...report });
    }
  }

  saveReport(report: QSeriesCertificationReport) {
    this.reports.push({ ...report });
    this.auditTrail.push(`report_saved:${report.reportId}@${report.timestamp}`);
  }

  saveHistory(entry: CertificationHistoryEntry) {
    this.history.push({ ...entry });
    this.auditTrail.push(`history_saved:${entry.entryId}@${entry.timestamp}`);
  }

  listReports() {
    return this.reports.map((r) => ({ ...r }));
  }

  getLatestReport() {
    return this.reports.at(-1) ?? null;
  }

  getLatestReportId() {
    return this.getLatestReport()?.reportId ?? null;
  }

  reportCount() {
    return this.reports.length;
  }

  getCertificationHistory(limit = 100) {
    return this.history.slice(-limit).map((h) => ({ ...h }));
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit);
  }
}

export function resetQSeriesCertificationManagerSequencesForTesting() {
  resetQscrtSequenceForTesting();
}
