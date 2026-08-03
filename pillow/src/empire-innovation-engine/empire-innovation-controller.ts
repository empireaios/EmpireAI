import type { EmpireInnovationEngineConfiguration } from "./configuration.js";
import { EmpireInnovationManager } from "./empire-innovation-manager.js";
import type { EmpireInnovationInput, EmpireInnovationRunReport, EngineStatus } from "./types.js";
export class EmpireInnovationController {
  private status: EngineStatus = "idle"; private latestReport: EmpireInnovationRunReport | null = null;
  constructor(private readonly manager: EmpireInnovationManager, private readonly config: EmpireInnovationEngineConfiguration) {}
  initialize() { this.status = "active"; }
  getStatus() { return this.status; } getManager() { return this.manager; } getConfiguration() { return { ...this.config }; } getLatestReport() { return this.latestReport; }
  connect(input: Record<string, unknown> = {}) { this.status = "connecting"; return this.finish(this.manager.connect(input, this.config)); }
  run(action: string, input: EmpireInnovationInput = {}) { this.status = action.includes("monitor") ? "monitoring" : action.includes("recommend") || action.includes("rank") ? "recommending" : "evaluating"; return this.finish(this.manager.run(action, input, this.config)); }
  diagnostics() { return this.finish(this.manager.diagnostics(this.config)); }
  private finish(report: EmpireInnovationRunReport) { this.latestReport = report; this.status = "active"; return report; }
}
