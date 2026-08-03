import type { CivilizationKnowledgeEngineConfiguration } from "./configuration.js";
import { CivilizationKnowledgeManager } from "./civilization-knowledge-manager.js";
import type { CivilizationKnowledgeInput, CivilizationKnowledgeRunReport, EngineStatus } from "./types.js";

export class CivilizationKnowledgeController {
  private status: EngineStatus = "idle";
  private latestReport: CivilizationKnowledgeRunReport | null = null;

  constructor(
    private readonly manager: CivilizationKnowledgeManager,
    private readonly config: CivilizationKnowledgeEngineConfiguration,
  ) {}

  initialize() {
    this.status = "active";
  }

  getStatus() {
    return this.status;
  }

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return { ...this.config };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  run(action: string, input: CivilizationKnowledgeInput = {}) {
    this.status = action.includes("monitor")
      ? "monitoring"
      : action.includes("acquir")
        ? "acquiring"
        : action.includes("analyz") || action.includes("identif")
          ? "analyzing"
          : action.includes("rank")
            ? "ranking"
            : action.includes("recommend")
              ? "recommending"
              : "active";
    return this.finish(this.manager.run(action, input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: CivilizationKnowledgeRunReport) {
    this.latestReport = report;
    this.status = "active";
    return report;
  }
}
