import type { EmpireLegacyEngineConfiguration } from "./configuration.js";
import { EmpireLegacyManager } from "./empire-legacy-manager.js";
import type { EmpireLegacyInput, EmpireLegacyRunReport, EngineStatus } from "./types.js";

export class EmpireLegacyController {
  private status: EngineStatus = "idle";
  private latestReport: EmpireLegacyRunReport | null = null;

  constructor(
    private readonly manager: EmpireLegacyManager,
    private readonly config: EmpireLegacyEngineConfiguration,
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

  run(action: string, input: EmpireLegacyInput = {}) {
    this.status = action.includes("timeline") || action.includes("chronolog")
      ? "timeline"
      : action.includes("achievement")
        ? "registering"
        : action.includes("missing") || action.includes("detect")
          ? "detecting"
          : action.includes("recommend")
            ? "recommending"
            : action.includes("preserv") || action.includes("archiv")
              ? "archiving"
              : "active";
    return this.finish(this.manager.run(action, input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: EmpireLegacyRunReport) {
    this.latestReport = report;
    this.status = "active";
    return report;
  }
}
