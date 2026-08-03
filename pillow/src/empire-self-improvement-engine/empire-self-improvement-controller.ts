import type { EmpireSelfImprovementEngineConfiguration } from "./configuration.js";
import { EmpireSelfImprovementManager } from "./empire-self-improvement-manager.js";
import type { EmpireSelfImprovementInput, EmpireSelfImprovementRunReport, EngineStatus } from "./types.js";
export class EmpireSelfImprovementController {
  private status: EngineStatus = "idle"; private latestReport: EmpireSelfImprovementRunReport | null = null;
  constructor(private readonly manager: EmpireSelfImprovementManager, private readonly config: EmpireSelfImprovementEngineConfiguration) {}
  initialize() { this.status = "active"; } getStatus() { return this.status; } getManager() { return this.manager; } getConfiguration() { return { ...this.config }; } getLatestReport() { return this.latestReport; }
  connect(input: Record<string, unknown> = {}) { this.status = "connecting"; return this.finish(this.manager.connect(input, this.config)); }
  run(action: string, input: EmpireSelfImprovementInput = {}) { this.status = action.includes("monitor") ? "monitoring" : action.includes("identify") ? "discovering" : action.includes("evaluate") ? "evaluating" : action.includes("learn") ? "learning" : action.includes("rank") ? "ranking" : action.includes("recommend") ? "recommending" : action.includes("evolution") ? "evolving" : action.includes("assess") ? "assessing" : "active"; return this.finish(this.manager.run(action, input, this.config)); }
  diagnostics() { return this.finish(this.manager.diagnostics(this.config)); } private finish(report: EmpireSelfImprovementRunReport) { this.latestReport = report; this.status = "active"; return report; }
}
