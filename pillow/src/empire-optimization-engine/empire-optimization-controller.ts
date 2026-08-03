import type { EmpireOptimizationEngineConfiguration } from "./configuration.js";
import { EmpireOptimizationManager } from "./empire-optimization-manager.js";
import type { EmpireOptimizationInput, EmpireOptimizationRunReport, EngineStatus } from "./types.js";
export class EmpireOptimizationController {
  private status: EngineStatus = "idle"; private latestReport: EmpireOptimizationRunReport | null = null;
  constructor(private readonly manager: EmpireOptimizationManager, private readonly config: EmpireOptimizationEngineConfiguration) {}
  initialize() { this.status = "active"; }
  getStatus() { return this.status; } getManager() { return this.manager; } getConfiguration() { return { ...this.config }; } getLatestReport() { return this.latestReport; }
  connect(input: Record<string, unknown> = {}) { this.status = "connecting"; return this.finish(this.manager.connect(input, this.config)); }
  run(action: string, input: EmpireOptimizationInput = {}) {
    this.status = action.includes("monitor") ? "monitoring" : action.includes("recommend") || action.includes("rank") ? "recommending" : action.includes("optimization") ? "optimizing" : "analyzing";
    return this.finish(this.manager.run(action, input, this.config));
  }
  diagnostics() { return this.finish(this.manager.diagnostics(this.config)); }
  private finish(report: EmpireOptimizationRunReport) { this.latestReport = report; this.status = "active"; return report; }
}
