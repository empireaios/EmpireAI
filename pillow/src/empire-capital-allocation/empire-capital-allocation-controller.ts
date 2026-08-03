import type { EmpireCapitalAllocationConfiguration } from "./configuration.js";
import { EmpireCapitalAllocationManager } from "./empire-capital-allocation-manager.js";
import type { EmpireCapitalAllocationInput, EmpireCapitalAllocationRunReport, EngineStatus } from "./types.js";
export class EmpireCapitalAllocationController {
  private status: EngineStatus = "idle"; private latestReport: EmpireCapitalAllocationRunReport | null = null;
  constructor(private readonly manager: EmpireCapitalAllocationManager, private readonly config: EmpireCapitalAllocationConfiguration) {}
  initialize() { this.status = "active"; }
  getStatus() { return this.status; } getManager() { return this.manager; } getConfiguration() { return { ...this.config }; } getLatestReport() { return this.latestReport; }
  connect(input: Record<string, unknown> = {}) { this.status = "connecting"; return this.finish(this.manager.connect(input, this.config)); }
  run(action: string, input: EmpireCapitalAllocationInput = {}) {
    this.status = action.includes("monitor") ? "monitoring" : action.includes("recommend") || action.includes("rank") ? "recommending" : "evaluating";
    return this.finish(this.manager.run(action, input, this.config));
  }
  diagnostics() { return this.finish(this.manager.diagnostics(this.config)); }
  private finish(report: EmpireCapitalAllocationRunReport) { this.latestReport = report; this.status = "active"; return report; }
}
