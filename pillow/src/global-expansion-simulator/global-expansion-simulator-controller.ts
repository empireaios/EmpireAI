import type { GlobalExpansionSimulatorConfiguration } from "./configuration.js";
import { GlobalExpansionSimulationManager } from "./global-expansion-simulation-manager.js";
import type { EngineStatus, GesRunReport, GlobalExpansionSimulationInput } from "./types.js";
export class GlobalExpansionSimulatorController {
  private status: EngineStatus = "idle";
  private latestReport: GesRunReport | null = null;
  constructor(private readonly manager: GlobalExpansionSimulationManager, private readonly config: GlobalExpansionSimulatorConfiguration) {}
  initialize() { this.status = "active"; }
  getStatus() { return this.status; } getManager() { return this.manager; } getConfiguration() { return { ...this.config }; } getLatestReport() { return this.latestReport; }
  connect(input: Record<string, unknown> = {}) { this.status = "connecting"; return this.finish(this.manager.connect(input, this.config)); }
  run(action: string, input: GlobalExpansionSimulationInput = {}) { this.status = action.includes("recommend") ? "recommending" : action.includes("compare") || action.includes("rank") ? "comparing" : "simulating"; return this.finish(this.manager.run(action, input, this.config)); }
  diagnostics() { return this.finish(this.manager.diagnostics(this.config)); }
  private finish(report: GesRunReport) { this.latestReport = report; this.status = "active"; return report; }
}
