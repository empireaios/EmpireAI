import type { GrandKingAdvisoryEngineConfiguration } from "./configuration.js";
import { GrandKingAdvisoryManager } from "./grand-king-advisory-manager.js";
import type { GrandKingAdvisoryInput, GrandKingAdvisoryRunReport, EngineStatus } from "./types.js";

export class GrandKingAdvisoryController {
  private status: EngineStatus = "idle";
  private latestReport: GrandKingAdvisoryRunReport | null = null;

  constructor(
    private readonly manager: GrandKingAdvisoryManager,
    private readonly config: GrandKingAdvisoryEngineConfiguration,
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

  run(action: string, input: GrandKingAdvisoryInput = {}) {
    this.status = action.includes("analyz") || action.includes("performance")
      ? "analyzing"
      : action.includes("identif") || action.includes("risk") || action.includes("opportunit")
        ? "identifying"
        : action.includes("priorit")
          ? "prioritizing"
          : action.includes("recommend")
            ? "recommending"
            : action.includes("track")
              ? "tracking"
              : "active";
    return this.finish(this.manager.run(action, input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: GrandKingAdvisoryRunReport) {
    this.latestReport = report;
    this.status = "active";
    return report;
  }
}
