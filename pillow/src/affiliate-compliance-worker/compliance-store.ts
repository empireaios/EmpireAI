import type {
  AffiliateComplianceReport,
  AffiliateComplianceWorkerEngineRecord,
  ComplianceSession,
  HistoryEntry,
} from "./types.js";

let reportSeq = 0;
let sessionSeq = 0;
let assetSeq = 0;

export function resetAcwSequenceForTesting() {
  reportSeq = 0;
  sessionSeq = 0;
  assetSeq = 0;
}

export function nextReportId() {
  reportSeq += 1;
  return `acw-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextSessionId() {
  sessionSeq += 1;
  return `acw-sess-${String(sessionSeq).padStart(4, "0")}`;
}

export function nextAssetId(kind: string) {
  assetSeq += 1;
  return `acw-${kind}-${String(assetSeq).padStart(4, "0")}`;
}

export class ComplianceStore {
  private sessions = new Map<string, ComplianceSession>();
  private reports = new Map<string, AffiliateComplianceReport>();
  private history: HistoryEntry[] = [];
  private latestSessionId: string | null = null;
  private latestReportId: string | null = null;
  private auditTrail: Array<{ timestamp: string; action: string; detail: string }> = [];

  seed(reports: AffiliateComplianceReport[]) {
    for (const report of reports) {
      this.reports.set(report.reportId, structuredClone(report));
      this.latestReportId = report.reportId;
      for (const entry of report.history) {
        this.history.push({ ...entry });
      }
    }
  }

  saveSession(session: ComplianceSession) {
    this.sessions.set(session.sessionId, structuredClone(session));
    this.latestSessionId = session.sessionId;
    this.audit(`save_session:${session.sessionId}`, `project=${session.affiliateProjectId}`);
  }

  getLatestSession() {
    return this.latestSessionId
      ? structuredClone(this.sessions.get(this.latestSessionId)!)
      : null;
  }

  saveReport(report: AffiliateComplianceReport) {
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

  getEngineRecord(): AffiliateComplianceWorkerEngineRecord {
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
