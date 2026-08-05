import type { MonitoringHistoryEntry, PostLaunchMonitoringReport } from "./types.js";

let reportSeq = 0;
let sessionSeq = 0;
let historySeq = 0;

export function nextReportId() {
  reportSeq += 1;
  return `plmrt-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextSessionId() {
  sessionSeq += 1;
  return `plmrt-sess-${String(sessionSeq).padStart(4, "0")}`;
}

export function nextHistoryEntryId() {
  historySeq += 1;
  return `plmrt-hist-${String(historySeq).padStart(4, "0")}`;
}

export function resetPlmrtSequenceForTesting() {
  reportSeq = 0;
  sessionSeq = 0;
  historySeq = 0;
}

export class AuditStore {
  private reports: PostLaunchMonitoringReport[] = [];
  private history: MonitoringHistoryEntry[] = [];
  private auditTrail: string[] = [];

  seed(reports: PostLaunchMonitoringReport[]) {
    for (const report of reports) {
      this.reports.push({ ...report });
    }
  }

  saveReport(report: PostLaunchMonitoringReport) {
    this.reports.push({ ...report });
    this.auditTrail.push(`report_saved:${report.reportId}@${report.timestamp}`);
  }

  saveHistory(entry: MonitoringHistoryEntry) {
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

  getMonitoringHistory(limit = 100) {
    return this.history.slice(-limit).map((h) => ({ ...h }));
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit);
  }
}

export function resetPostLaunchMonitoringManagerSequencesForTesting() {
  resetPlmrtSequenceForTesting();
}
