import type { CompletionHistoryEntry, QSeriesCompletionReport } from "./types.js";

let reportSeq = 0;
let historySeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `qscpt-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextHistoryEntryId() {
  historySeq += 1;
  return `qscpt-hist-${String(historySeq).padStart(4, "0")}`;
}

export function resetQscptSequenceForTesting() {
  reportSeq = 0;
  historySeq = 0;
}

export class AuditStore {
  private reports: QSeriesCompletionReport[] = [];
  private history: CompletionHistoryEntry[] = [];
  private auditTrail: string[] = [];

  seed(reports: QSeriesCompletionReport[]) {
    for (const report of reports) {
      this.reports.push({ ...report });
    }
  }

  saveReport(report: QSeriesCompletionReport) {
    this.reports.push({ ...report });
    this.auditTrail.push(`report_saved:${report.reportId}@${report.timestamp}`);
  }

  saveHistory(entry: CompletionHistoryEntry) {
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

  getCompletionHistory(limit = 100) {
    return this.history.slice(-limit).map((h) => ({ ...h }));
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit);
  }
}

export function resetQSeriesCompletionManagerSequencesForTesting() {
  resetQscptSequenceForTesting();
}
