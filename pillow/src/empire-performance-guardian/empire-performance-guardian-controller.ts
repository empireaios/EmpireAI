import type { EmpirePerformanceGuardianConfiguration } from "./configuration.js";
import { EmpirePerformanceGuardianManager } from "./empire-performance-guardian-manager.js";
import type { EmpirePerformanceGuardianInput, EmpirePerformanceGuardianRunReport, EngineStatus } from "./types.js";

export class EmpirePerformanceGuardianController {
  private status: EngineStatus = "idle";
  private latestReport: EmpirePerformanceGuardianRunReport | null = null;

  constructor(
    private readonly manager: EmpirePerformanceGuardianManager,
    private readonly config: EmpirePerformanceGuardianConfiguration,
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

  run(action: string, input: EmpirePerformanceGuardianInput = {}) {
    this.status = action.includes("monitor")
      ? "monitoring"
      : action.includes("analyz")
        ? "analyzing"
        : action.includes("detect") || action.includes("anomal") || action.includes("degrad")
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

  private finish(report: EmpirePerformanceGuardianRunReport) {
    this.latestReport = report;
    this.status = "active";
    return report;
  }
}
