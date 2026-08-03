import type { AutonomousInvestmentEngineConfiguration } from "./configuration.js";
import { AutonomousInvestmentManager } from "./autonomous-investment-manager.js";
import type { AutonomousInvestmentInput, AutonomousInvestmentRunReport, EngineStatus } from "./types.js";

export class AutonomousInvestmentController {
  private status: EngineStatus = "idle";
  private latestReport: AutonomousInvestmentRunReport | null = null;

  constructor(
    private readonly manager: AutonomousInvestmentManager,
    private readonly config: AutonomousInvestmentEngineConfiguration,
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

  run(action: string, input: AutonomousInvestmentInput = {}) {
    this.status = action.includes("discover")
      ? "discovering"
      : action.includes("evaluat") || action.includes("return")
        ? "evaluating"
        : action.includes("risk")
          ? "assessing"
          : action.includes("priorit")
            ? "prioritizing"
            : action.includes("recommend")
              ? "recommending"
              : action.includes("execute")
                ? "executing"
                : action.includes("monitor") || action.includes("underperform")
                  ? "monitoring"
                  : "active";
    return this.finish(this.manager.run(action, input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: AutonomousInvestmentRunReport) {
    this.latestReport = report;
    this.status = "active";
    return report;
  }
}
