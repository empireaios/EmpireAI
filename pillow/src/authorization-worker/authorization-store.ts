import type { AuthorizationBuildReport } from "./types.js";
export class AuthorizationStore {
  private readonly reports: AuthorizationBuildReport[] = []; private readonly auditTrail: Array<{ action: string; at: string; buildId: string | null }> = [];
  save(report: AuthorizationBuildReport, action: string) { const copy = structuredClone(report); const index = this.reports.findIndex((item) => item.buildId === copy.buildId); if (index >= 0) this.reports[index] = copy; else this.reports.push(copy); this.auditTrail.push({ action, at: new Date().toISOString(), buildId: copy.buildId }); }
  list() { return structuredClone(this.reports); } latest() { return this.reports.at(-1) ? structuredClone(this.reports.at(-1)!) : null; } trail() { return structuredClone(this.auditTrail); }
}
