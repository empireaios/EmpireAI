import type { ExecutivePlannerConfiguration } from "./configuration.js";
import { ExecutivePlannerManager } from "./executive-planner-manager.js";
import type { EngineStatus, ExecutivePlannerInput, ExecutivePlannerRunReport } from "./types.js";

export class ExecutivePlannerController {
  private status: EngineStatus = "idle";
  private latestReport: ExecutivePlannerRunReport | null = null;

  constructor(
    private readonly manager: ExecutivePlannerManager,
    private readonly config: ExecutivePlannerConfiguration,
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

  submitObjective(input: ExecutivePlannerInput) {
    this.status = "planning";
    return this.finish(this.manager.submitObjective(input, this.config));
  }

  analyzeObjective(input: ExecutivePlannerInput) {
    this.status = "analyzing";
    return this.finish(this.manager.analyzeObjective(input, this.config));
  }

  produceExecutionPlan(input: ExecutivePlannerInput) {
    this.status = "planning";
    return this.finish(this.manager.produceExecutionPlan(input, this.config));
  }

  identifyWorkforceCategories(input: ExecutivePlannerInput) {
    this.status = "analyzing";
    return this.finish(this.manager.identifyWorkforceCategories(input, this.config));
  }

  validatePlan(input: ExecutivePlannerInput = { objective: "" }) {
    this.status = "active";
    return this.finish(this.manager.validatePlan(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: ExecutivePlannerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
