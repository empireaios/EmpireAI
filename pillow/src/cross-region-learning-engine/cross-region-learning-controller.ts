import type { CrossRegionLearningEngineConfiguration } from "./configuration.js";
import { CrossRegionLearningManager } from "./cross-region-learning-manager.js";
import type { CrossRegionLearningInput, CrlRunReport, EngineStatus } from "./types.js";
export class CrossRegionLearningController {
  private status: EngineStatus = "idle";
  private latestReport: CrlRunReport | null = null;
  constructor(private readonly manager: CrossRegionLearningManager, private config: CrossRegionLearningEngineConfiguration) {}
  initialize() { this.status = "active"; }
  getStatus() { return this.status; } getManager() { return this.manager; } getConfiguration() { return { ...this.config }; } getLatestReport() { return this.latestReport; }
  connect(input: Record<string, unknown> = {}) { this.status = "connecting"; return this.finish(this.manager.connect(input, this.config)); }
  run(action: string, input: CrossRegionLearningInput = {}) { this.status = action === "recommend_learning" ? "recommending" : action.includes("detect") ? "analyzing" : action.includes("share") ? "sharing" : "capturing"; return this.finish(this.manager.run(action, input, this.config)); }
  diagnostics() { return this.finish(this.manager.diagnostics(this.config)); }
  private finish(report: CrlRunReport) { this.latestReport = report; this.status = "active"; return report; }
}
