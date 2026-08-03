import type { ExecutiveEmpireDashboardConfiguration } from "./configuration.js";
import { ExecutiveEmpireDashboardManager } from "./executive-empire-dashboard-manager.js";
import type { DashboardAnalysisInput, EngineStatus, ExecutiveEmpireDashboardRunReport } from "./types.js";
export class ExecutiveEmpireDashboardController {
  private status: EngineStatus = "idle"; private latestReport: ExecutiveEmpireDashboardRunReport | null = null;
  constructor(private readonly manager: ExecutiveEmpireDashboardManager, private readonly configuration: ExecutiveEmpireDashboardConfiguration) {}
  initialize() { this.status = "active"; } getStatus() { return this.status; } getManager() { return this.manager; } getConfiguration() { return { ...this.configuration }; } getLatestReport() { return this.latestReport; }
  connect(input: Record<string, unknown> = {}) { this.status = "connecting"; return this.finish(this.manager.connect(input, this.configuration)); }
  run(action: string, input: DashboardAnalysisInput = {}) { this.status = action.includes("alert") ? "alerting" : action.includes("recommend") ? "recommending" : action.includes("refresh") ? "refreshing" : "aggregating"; return this.finish(this.manager.run(action, input, this.configuration)); }
  diagnostics() { return this.finish(this.manager.diagnostics(this.configuration)); }
  private finish(report: ExecutiveEmpireDashboardRunReport) { this.latestReport = report; this.status = "active"; return report; }
}
