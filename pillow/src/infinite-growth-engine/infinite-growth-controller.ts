import type { InfiniteGrowthEngineConfiguration } from "./configuration.js";
import { InfiniteGrowthManager } from "./infinite-growth-manager.js";
import type { EngineStatus, InfiniteGrowthInput, InfiniteGrowthRunReport } from "./types.js";

export class InfiniteGrowthController {
  private status: EngineStatus = "idle";
  private latestReport: InfiniteGrowthRunReport | null = null;

  constructor(
    private readonly manager: InfiniteGrowthManager,
    private readonly config: InfiniteGrowthEngineConfiguration,
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

  run(action: string, input: InfiniteGrowthInput = {}) {
    this.status = action.includes("monitor")
      ? "monitoring"
      : action.includes("evaluat") || action.includes("sustainab")
        ? "evaluating"
        : action.includes("detect") || action.includes("constraint") || action.includes("risk")
          ? "detecting"
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

  private finish(report: InfiniteGrowthRunReport) {
    this.latestReport = report;
    this.status = "active";
    return report;
  }
}
