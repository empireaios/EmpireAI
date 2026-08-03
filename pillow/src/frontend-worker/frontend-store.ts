import type { FrontendBuildReport } from "./types.js";
export class FrontendStore {
  private reports = new Map<string, FrontendBuildReport>();
  private latest: string | null = null;
  private audit: Array<{ timestamp: string; buildId: string; action: string; details: string }> = [];
  seed(reports: FrontendBuildReport[]) { this.reports.clear(); this.latest = null; this.audit = []; reports.forEach((report) => this.save(report, "seed")); }
  save(report: FrontendBuildReport, action = "save") { const copy = structuredClone(report); this.reports.set(report.buildId, copy); this.latest = report.buildId; this.audit.push({ timestamp: new Date().toISOString(), buildId: report.buildId, action, details: `platform=${report.platformName} confidence=${report.confidenceScore}` }); return structuredClone(copy); }
  list() { return [...this.reports.values()].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).map((r) => structuredClone(r)); }
  get(id: string) { const r = this.reports.get(id); return r ? structuredClone(r) : null; }
  count() { return this.reports.size; }
  getLatestFrontendBuildReportId() { return this.latest; }
  getAuditTrail(limit = 100) { return this.audit.slice(-limit).map((x) => ({ ...x })); }
  markSubmitted(id: string, executiveReportId: string) { const current = this.get(id); return current ? this.save({ ...current, submittedToExecutiveReporting: true, executiveReportId }, "submit_report") : null; }
}
