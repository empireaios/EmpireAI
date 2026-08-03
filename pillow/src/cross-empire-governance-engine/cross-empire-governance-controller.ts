import type { CrossEmpireGovernanceEngineConfiguration } from "./configuration.js";
import { CrossEmpireGovernanceManager } from "./cross-empire-governance-manager.js";
import type { CrossEmpireGovernanceInput, CrossEmpireGovernanceRunReport, EngineStatus } from "./types.js";

export class CrossEmpireGovernanceController {
  private status: EngineStatus = "idle";
  private latestReport: CrossEmpireGovernanceRunReport | null = null;

  constructor(
    private readonly manager: CrossEmpireGovernanceManager,
    private readonly config: CrossEmpireGovernanceEngineConfiguration,
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

  run(action: string, input: CrossEmpireGovernanceInput = {}) {
    this.status = action.includes("policy")
      ? "managing_policies"
      : action.includes("constitutional") || action.includes("rule")
        ? "managing_rules"
        : action.includes("compliance") || action.includes("validate")
          ? "validating"
          : action.includes("monitor") || action.includes("consistency")
            ? "monitoring"
            : action.includes("detect") || action.includes("violation") || action.includes("conflict")
              ? "detecting"
              : action.includes("risk")
                ? "analyzing"
                : action.includes("recommend")
                  ? "recommending"
                  : "active";
    return this.finish(this.manager.run(action, input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: CrossEmpireGovernanceRunReport) {
    this.latestReport = report;
    this.status = "active";
    return report;
  }
}
