import type { EmpireKnowledgeEngineConfiguration } from "./configuration.js";
import { EmpireKnowledgeManager } from "./empire-knowledge-manager.js";
import type { EmpireKnowledgeInput, EmpireKnowledgeRunReport, EngineStatus } from "./types.js";

export class EmpireKnowledgeController {
  private status: EngineStatus = "idle";
  private latestReport: EmpireKnowledgeRunReport | null = null;
  constructor(private readonly manager: EmpireKnowledgeManager, private readonly config: EmpireKnowledgeEngineConfiguration) {}
  initialize() { this.status = "active"; }
  getStatus() { return this.status; } getManager() { return this.manager; } getConfiguration() { return { ...this.config }; } getLatestReport() { return this.latestReport; }
  connect(input: Record<string, unknown> = {}) { this.status = "connecting"; return this.finish(this.manager.connect(input, this.config)); }
  run(action: string, input: EmpireKnowledgeInput = {}) {
    this.status = action.includes("recommend") ? "recommending" : action.includes("detect") ? "analyzing" : action.includes("share") ? "sharing" : action.includes("map") || action.includes("graph") ? "mapping" : "capturing";
    return this.finish(this.manager.run(action, input, this.config));
  }
  diagnostics() { return this.finish(this.manager.diagnostics(this.config)); }
  private finish(report: EmpireKnowledgeRunReport) { this.latestReport = report; this.status = "active"; return report; }
}
