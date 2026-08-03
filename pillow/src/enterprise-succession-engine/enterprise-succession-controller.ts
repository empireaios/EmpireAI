import type { EnterpriseSuccessionEngineConfiguration } from "./configuration.js";
import { EnterpriseSuccessionManager } from "./enterprise-succession-manager.js";
import type { EnterpriseSuccessionInput, EnterpriseSuccessionRunReport, EngineStatus } from "./types.js";

export class EnterpriseSuccessionController {
  private status: EngineStatus = "idle";
  private latestReport: EnterpriseSuccessionRunReport | null = null;

  constructor(
    private readonly manager: EnterpriseSuccessionManager,
    private readonly config: EnterpriseSuccessionEngineConfiguration,
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

  run(action: string, input: EnterpriseSuccessionInput = {}) {
    this.status = action.includes("plan") || action.includes("continuity") || action.includes("preserv")
      ? "planning"
      : action.includes("detect") || action.includes("risk") || action.includes("gap")
        ? "detecting"
        : action.includes("readiness") || action.includes("evaluat")
          ? "evaluating"
          : action.includes("recommend")
            ? "recommending"
            : action.includes("assess")
              ? "assessing"
              : "active";
    return this.finish(this.manager.run(action, input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: EnterpriseSuccessionRunReport) {
    this.latestReport = report;
    this.status = "active";
    return report;
  }
}
