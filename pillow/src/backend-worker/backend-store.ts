import type { BackendBuildReport } from "./types.js";
export class BackendStore {
  private reports = new Map<string, BackendBuildReport>(); private latest: string | null = null; private audit: Array<{ timestamp: string; buildId: string; action: string; details: string }> = [];
  seed(reports: BackendBuildReport[]) { this.reports.clear(); this.latest = null; this.audit = []; reports.forEach((report) => this.save(report, "seed")); }
  save(report: BackendBuildReport, action = "save") { const copy = structuredClone(report); this.reports.set(report.buildId, copy); this.latest = report.buildId; this.audit.push({ timestamp: new Date().toISOString(), buildId: report.buildId, action, details: `platform=${report.platformName} confidence=${report.confidenceScore}` }); return structuredClone(copy); }
  list() { return [...this.reports.values()].sort((a, b) => a.timestamp.localeCompare(b.timestamp)).map((report) => structuredClone(report)); }
  count() { return this.reports.size; } getLatestBackendBuildReportId() { return this.latest; } getAuditTrail(limit = 100) { return this.audit.slice(-limit).map((item) => ({ ...item })); }
  markSubmitted(id: string, executiveReportId: string) { const current = this.reports.get(id); return current ? this.save({ ...structuredClone(current), submittedToExecutiveReporting: true, executiveReportId }, "submit_report") : null; }
}
