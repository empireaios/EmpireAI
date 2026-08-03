import type {
  EmailFunnelReport,
  EmailFunnelWorkerEngineRecord,
  FunnelSession,
  FunnelVersionEntry,
} from "./types.js";

let reportSeq = 0;
let sessionSeq = 0;
let assetSeq = 0;

export function resetEfwSequenceForTesting() {
  reportSeq = 0;
  sessionSeq = 0;
  assetSeq = 0;
}

export function nextReportId() {
  reportSeq += 1;
  return `efw-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextSessionId() {
  sessionSeq += 1;
  return `efw-sess-${String(sessionSeq).padStart(4, "0")}`;
}

export function nextAssetId(kind: string) {
  assetSeq += 1;
  return `efw-${kind}-${String(assetSeq).padStart(4, "0")}`;
}

export class FunnelStore {
  private sessions = new Map<string, FunnelSession>();
  private reports = new Map<string, EmailFunnelReport>();
  private versionHistory: FunnelVersionEntry[] = [];
  private latestSessionId: string | null = null;
  private latestReportId: string | null = null;
  private auditTrail: Array<{ timestamp: string; action: string; detail: string }> = [];

  seed(reports: EmailFunnelReport[]) {
    for (const report of reports) {
      this.reports.set(report.reportId, structuredClone(report));
      this.latestReportId = report.reportId;
      for (const entry of report.versionHistory) {
        this.versionHistory.push({ ...entry });
      }
    }
  }

  saveSession(session: FunnelSession) {
    this.sessions.set(session.sessionId, structuredClone(session));
    this.latestSessionId = session.sessionId;
    this.audit(`save_session:${session.sessionId}`, `funnel=${session.funnelName}`);
  }

  getLatestSession() {
    return this.latestSessionId
      ? structuredClone(this.sessions.get(this.latestSessionId)!)
      : null;
  }

  saveReport(report: EmailFunnelReport) {
    this.reports.set(report.reportId, structuredClone(report));
    this.latestReportId = report.reportId;
    this.audit(`save_report:${report.reportId}`, `funnel=${report.funnelName}`);
  }

  getLatestReport() {
    return this.latestReportId
      ? structuredClone(this.reports.get(this.latestReportId)!)
      : null;
  }

  listReports() {
    return Array.from(this.reports.values()).map((r) => structuredClone(r));
  }

  appendVersion(entry: FunnelVersionEntry) {
    this.versionHistory.push({ ...entry });
  }

  getVersionHistory() {
    return this.versionHistory.map((e) => ({ ...e }));
  }

  getEngineRecord(): EmailFunnelWorkerEngineRecord {
    const latest = this.getLatestReport();
    return {
      healthStatus: latest?.validation.decision === "fail" ? "degraded" : "healthy",
      totalReports: this.reports.size,
      totalFunnels: this.reports.size,
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
