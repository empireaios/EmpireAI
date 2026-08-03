import type { EmpireMemoryEngineConfiguration } from "./configuration.js";
import { EmpireMemoryManager } from "./empire-memory-manager.js";
import type { EmpireMemoryInput, EmpireMemoryRunReport, EngineStatus } from "./types.js";

export class EmpireMemoryController {
  private status: EngineStatus = "idle";
  private latestReport: EmpireMemoryRunReport | null = null;
  constructor(private readonly manager: EmpireMemoryManager, private readonly config: EmpireMemoryEngineConfiguration) {}
  initialize() { this.status = "active"; }
  getStatus() { return this.status; } getManager() { return this.manager; } getConfiguration() { return { ...this.config }; } getLatestReport() { return this.latestReport; }
  connect(input: Record<string, unknown> = {}) { this.status = "connecting"; return this.finish(this.manager.connect(input, this.config)); }
  run(action: string, input: EmpireMemoryInput = {}) {
    this.status = action.includes("recommend") ? "recommending" : action.includes("detect") ? "analyzing" : action.includes("persist") ? "persisting" : "recording";
    return this.finish(this.manager.run(action, input, this.config));
  }
  diagnostics() { return this.finish(this.manager.diagnostics(this.config)); }
  private finish(report: EmpireMemoryRunReport) { this.latestReport = report; this.status = "active"; return report; }
}
