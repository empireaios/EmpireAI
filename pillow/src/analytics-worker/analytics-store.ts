import type {
  AnalyticsReport,
  AnalyticsSession,
  AnalyticsWorkerEngineRecord,
  HistoryEntry,
} from "./types.js";

let reportSeq = 0;
let sessionSeq = 0;
let assetSeq = 0;

export function resetAnwSequenceForTesting() {
  reportSeq = 0;
  sessionSeq = 0;
  assetSeq = 0;
}

export function nextReportId() {
  reportSeq += 1;
  return `anw-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextSessionId() {
  sessionSeq += 1;
  return `anw-sess-${String(sessionSeq).padStart(4, "0")}`;
}

export function nextAssetId(kind: string) {
  assetSeq += 1;
  return `anw-${kind}-${String(assetSeq).padStart(4, "0")}`;
}

export class AnalyticsStore {
  private sessions = new Map<string, AnalyticsSession>();
  private reports = new Map<string, AnalyticsReport>();
  private history: HistoryEntry[] = [];
  private latestSessionId: string | null = null;
  private latestReportId: string | null = null;
  private auditTrail: Array<{ timestamp: string; action: string; detail: string }> = [];

  seed(reports: AnalyticsReport[]) {
    for (const report of reports) {
      this.reports.set(report.reportId, structuredClone(report));
      this.latestReportId = report.reportId;
      for (const entry of report.history) {
        this.history.push({ ...entry });
      }
    }
  }

  saveSession(session: AnalyticsSession) {
    this.sessions.set(session.sessionId, structuredClone(session));
    this.latestSessionId = session.sessionId;
    this.audit(`save_session:${session.sessionId}`, `period=${session.periodLabel}`);
  }

  getLatestSession() {
    return this.latestSessionId
      ? structuredClone(this.sessions.get(this.latestSessionId)!)
      : null;
  }

  saveReport(report: AnalyticsReport) {
    this.reports.set(report.reportId, structuredClone(report));
    this.latestReportId = report.reportId;
    this.audit(`save_report:${report.reportId}`, `project=${report.affiliateProjectId}`);
  }

  getLatestReport() {
    return this.latestReportId
      ? structuredClone(this.reports.get(this.latestReportId)!)
      : null;
  }

  listReports() {
    return Array.from(this.reports.values()).map((r) => structuredClone(r));
  }

  appendHistory(entry: HistoryEntry) {
    this.history.push({ ...entry });
  }

  getHistory(limit = 100) {
    return this.history.slice(-limit).map((e) => ({ ...e }));
  }

  getEngineRecord(): AnalyticsWorkerEngineRecord {
    const latest = this.getLatestReport();
    return {
      healthStatus: latest?.validation.decision === "fail" ? "degraded" : "healthy",
      totalReports: this.reports.size,
      totalHistoryEntries: this.history.length,
      lastReportId: this.latestReportId,
      lastConfidenceScore: latest?.confidenceScore ?? null,
    };
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((e) => ({ ...e }));
  }

  private audit(action: string, detail: string) {
    this.auditTrail.push({ timestamp: new Date().toISOString(), action, detail });
  }
}
