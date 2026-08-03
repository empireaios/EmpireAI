import type { EmpireResilienceEngineConfiguration } from "./configuration.js";
import { EmpireResilienceManager } from "./empire-resilience-manager.js";
import type { EmpireResilienceInput, EmpireResilienceRunReport, EngineStatus } from "./types.js";
export class EmpireResilienceController {
  private status: EngineStatus = "idle"; private latestReport: EmpireResilienceRunReport | null = null;
  constructor(private readonly manager: EmpireResilienceManager, private readonly config: EmpireResilienceEngineConfiguration) {}
  initialize() { this.status = "active"; } getStatus() { return this.status; } getManager() { return this.manager; } getConfiguration() { return { ...this.config }; } getLatestReport() { return this.latestReport; }
  connect(input: Record<string, unknown> = {}) { this.status = "connecting"; return this.finish(this.manager.connect(input, this.config)); }
  run(action: string, input: EmpireResilienceInput = {}) { this.status = action.includes("monitor") ? "monitoring" : action.includes("detect") ? "detecting" : action.includes("assess") ? "assessing" : action.includes("recommend") ? "recommending" : action.includes("recovery") ? "recovering" : "active"; return this.finish(this.manager.run(action, input, this.config)); }
  diagnostics() { return this.finish(this.manager.diagnostics(this.config)); } private finish(report: EmpireResilienceRunReport) { this.latestReport = report; this.status = "active"; return report; }
}
