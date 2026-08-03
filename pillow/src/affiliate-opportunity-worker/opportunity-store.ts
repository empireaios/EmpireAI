import type {
  AffiliateOpportunityReport,
  AffiliateOpportunityWorkerEngineRecord,
  OpportunitySession,
} from "./types.js";

let reportSeq = 0;
let sessionSeq = 0;

export function resetAowSequenceForTesting() {
  reportSeq = 0;
  sessionSeq = 0;
}

export function nextReportId() {
  reportSeq += 1;
  return `aow-rpt-${String(reportSeq).padStart(4, "0")}`;
}

export function nextSessionId() {
  sessionSeq += 1;
  return `aow-sess-${String(sessionSeq).padStart(4, "0")}`;
}

export class OpportunityStore {
  private sessions = new Map<string, OpportunitySession>();
  private reports = new Map<string, AffiliateOpportunityReport>();
  private latestSessionId: string | null = null;
  private latestReportId: string | null = null;
  private auditTrail: Array<{ timestamp: string; action: string; detail: string }> = [];

  seed(reports: AffiliateOpportunityReport[]) {
    for (const report of reports) {
      this.reports.set(report.reportId, structuredClone(report));
      this.latestReportId = report.reportId;
    }
  }

  saveSession(session: OpportunitySession) {
    this.sessions.set(session.sessionId, structuredClone(session));
    this.latestSessionId = session.sessionId;
    this.audit(`save_session:${session.sessionId}`, `business=${session.affiliateBusinessId}`);
  }

  getSession(sessionId: string) {
    const s = this.sessions.get(sessionId);
    return s ? structuredClone(s) : null;
  }

  getLatestSession() {
    return this.latestSessionId ? this.getSession(this.latestSessionId) : null;
  }

  listSessions() {
    return Array.from(this.sessions.values()).map((s) => structuredClone(s));
  }

  saveReport(report: AffiliateOpportunityReport) {
    this.reports.set(report.reportId, structuredClone(report));
    this.latestReportId = report.reportId;
    this.audit(`save_report:${report.reportId}`, `score=${report.opportunityScore}`);
  }

  getReport(reportId: string) {
    const r = this.reports.get(reportId);
    return r ? structuredClone(r) : null;
  }

  getLatestReport() {
    return this.latestReportId ? this.getReport(this.latestReportId) : null;
  }

  listReports() {
    return Array.from(this.reports.values()).map((r) => structuredClone(r));
  }

  getLatestReportId() {
    return this.latestReportId;
  }

  getEngineRecord(): AffiliateOpportunityWorkerEngineRecord {
    const latest = this.getLatestReport();
    return {
      healthStatus: latest?.validation.decision === "fail" ? "degraded" : "healthy",
      totalReports: this.reports.size,
      totalOpportunities: latest?.opportunityRanking.length ?? 0,
      lastReportId: this.latestReportId,
      lastConfidenceScore: latest?.confidenceScore ?? null,
      lastOpportunityScore: latest?.opportunityScore ?? null,
    };
  }

  getAuditTrail(limit = 100) {
    return this.auditTrail.slice(-limit).map((e) => ({ ...e }));
  }

  private audit(action: string, detail: string) {
    this.auditTrail.push({ timestamp: new Date().toISOString(), action, detail });
  }
}
