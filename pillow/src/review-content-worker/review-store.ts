import type {
  ReviewContentReport,
  ReviewContentWorkerEngineRecord,
  ReviewSession,
  ReviewVersionEntry,
} from "./types.js";

let reportSeq = 0;
let sessionSeq = 0;
let assetSeq = 0;

export function resetRcwSequenceForTesting() {
  reportSeq = 0;
  sessionSeq = 0;
  assetSeq = 0;
}

export function nextReportId() {
  reportSeq += 1;
  return `rcw-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextSessionId() {
  sessionSeq += 1;
  return `rcw-sess-${String(sessionSeq).padStart(4, "0")}`;
}

export function nextAssetId(kind: string) {
  assetSeq += 1;
  return `rcw-${kind}-${String(assetSeq).padStart(4, "0")}`;
}

export class ReviewStore {
  private sessions = new Map<string, ReviewSession>();
  private reports = new Map<string, ReviewContentReport>();
  private versionHistory: ReviewVersionEntry[] = [];
  private latestSessionId: string | null = null;
  private latestReportId: string | null = null;
  private auditTrail: Array<{ timestamp: string; action: string; detail: string }> = [];

  seed(reports: ReviewContentReport[]) {
    for (const report of reports) {
      this.reports.set(report.reportId, structuredClone(report));
      this.latestReportId = report.reportId;
      for (const entry of report.versionHistory) {
        this.versionHistory.push({ ...entry });
      }
    }
  }

  saveSession(session: ReviewSession) {
    this.sessions.set(session.sessionId, structuredClone(session));
    this.latestSessionId = session.sessionId;
    this.audit(`save_session:${session.sessionId}`, `product=${session.productOrServiceReviewed}`);
  }

  getLatestSession() {
    return this.latestSessionId
      ? structuredClone(this.sessions.get(this.latestSessionId)!)
      : null;
  }

  saveReport(report: ReviewContentReport) {
    this.reports.set(report.reportId, structuredClone(report));
    this.latestReportId = report.reportId;
    this.audit(`save_report:${report.reportId}`, `product=${report.productOrServiceReviewed}`);
  }

  getLatestReport() {
    return this.latestReportId
      ? structuredClone(this.reports.get(this.latestReportId)!)
      : null;
  }

  listReports() {
    return Array.from(this.reports.values()).map((r) => structuredClone(r));
  }

  appendVersion(entry: ReviewVersionEntry) {
    this.versionHistory.push({ ...entry });
  }

  getVersionHistory(productId?: string) {
    const all = this.versionHistory.map((e) => ({ ...e }));
    if (!productId) return all;
    return all.filter((e) => {
      const report = Array.from(this.reports.values()).find((r) => r.reportId === e.reportId);
      return !report || report.productId === productId || e.articleId.includes(productId);
    });
  }

  getEngineRecord(): ReviewContentWorkerEngineRecord {
    const latest = this.getLatestReport();
    return {
      healthStatus: latest?.validation.decision === "fail" ? "degraded" : "healthy",
      totalReports: this.reports.size,
      totalReviews: this.reports.size,
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
