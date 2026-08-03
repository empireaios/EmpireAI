import type { AuthenticationBuildReport } from "./types.js";
export class AuthenticationStore {
  private readonly reports: AuthenticationBuildReport[] = []; private readonly audit: Array<{ timestamp: string; action: string; buildId: string | null }> = [];
  save(report: AuthenticationBuildReport, action: string) { const index = this.reports.findIndex((item) => item.buildId === report.buildId); if (index >= 0) this.reports[index] = structuredClone(report); else this.reports.push(structuredClone(report)); this.audit.push({ timestamp: new Date().toISOString(), action, buildId: report.buildId }); return report; }
  list() { return this.reports.map((item) => structuredClone(item)); }
  latest() { return this.reports.at(-1) ? structuredClone(this.reports.at(-1)!) : null; }
  trail() { return this.audit.map((item) => ({ ...item })); }
}
