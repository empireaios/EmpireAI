import type {
  ComparisonSession,
  ComparisonSiteReport,
  ComparisonSiteWorkerEngineRecord,
} from "./types.js";

let reportSeq = 0;
let sessionSeq = 0;
let pageSeq = 0;

export function resetCswSequenceForTesting() {
  reportSeq = 0;
  sessionSeq = 0;
  pageSeq = 0;
}

export function nextReportId() {
  reportSeq += 1;
  return `csw-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextSessionId() {
  sessionSeq += 1;
  return `csw-sess-${String(sessionSeq).padStart(4, "0")}`;
}

export function nextPageId(kind: string) {
  pageSeq += 1;
  return `csw-${kind}-${String(pageSeq).padStart(4, "0")}`;
}

export class ComparisonStore {
  private sessions = new Map<string, ComparisonSession>();
  private reports = new Map<string, ComparisonSiteReport>();
  private latestSessionId: string | null = null;
  private latestReportId: string | null = null;
  private auditTrail: Array<{ timestamp: string; action: string; detail: string }> = [];

  seed(reports: ComparisonSiteReport[]) {
    for (const report of reports) {
      this.reports.set(report.reportId, structuredClone(report));
      this.latestReportId = report.reportId;
    }
  }

  saveSession(session: ComparisonSession) {
    this.sessions.set(session.sessionId, structuredClone(session));
    this.latestSessionId = session.sessionId;
    this.audit(`save_session:${session.sessionId}`, `topic=${session.comparisonTopic}`);
  }

  getLatestSession() {
    return this.latestSessionId
      ? structuredClone(this.sessions.get(this.latestSessionId)!)
      : null;
  }

  saveReport(report: ComparisonSiteReport) {
    this.reports.set(report.reportId, structuredClone(report));
    this.latestReportId = report.reportId;
    this.audit(`save_report:${report.reportId}`, `topic=${report.comparisonTopic}`);
  }

  getLatestReport() {
    return this.latestReportId
      ? structuredClone(this.reports.get(this.latestReportId)!)
      : null;
  }

  listReports() {
    return Array.from(this.reports.values()).map((r) => structuredClone(r));
  }

  getEngineRecord(): ComparisonSiteWorkerEngineRecord {
    const latest = this.getLatestReport();
    const pages =
      (latest?.comparisonPage ? 1 : 0) +
      (latest?.rankingPage ? 1 : 0) +
      (latest?.buyerGuide ? 1 : 0);
    return {
      healthStatus: latest?.validation.decision === "fail" ? "degraded" : "healthy",
      totalReports: this.reports.size,
      totalPages: pages,
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
