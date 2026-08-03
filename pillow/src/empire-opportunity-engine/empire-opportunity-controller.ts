import type { EmpireOpportunityEngineConfiguration } from "./configuration.js";
import { EmpireOpportunityManager } from "./empire-opportunity-manager.js";
import type { EmpireOpportunityInput, EmpireOpportunityRunReport, EngineStatus } from "./types.js";
export class EmpireOpportunityController {
  private status: EngineStatus = "idle"; private latestReport: EmpireOpportunityRunReport | null = null;
  constructor(private readonly manager: EmpireOpportunityManager, private readonly config: EmpireOpportunityEngineConfiguration) {}
  initialize() { this.status = "active"; }
  getStatus() { return this.status; } getManager() { return this.manager; } getConfiguration() { return { ...this.config }; } getLatestReport() { return this.latestReport; }
  connect(input: Record<string, unknown> = {}) { this.status = "connecting"; return this.finish(this.manager.connect(input, this.config)); }
  run(action: string, input: EmpireOpportunityInput = {}) { this.status = action.includes("monitor") ? "monitoring" : action.includes("recommend") || action.includes("rank") ? "recommending" : "evaluating"; return this.finish(this.manager.run(action, input, this.config)); }
  diagnostics() { return this.finish(this.manager.diagnostics(this.config)); }
  private finish(report: EmpireOpportunityRunReport) { this.latestReport = report; this.status = "active"; return report; }
}
