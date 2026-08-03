import type { DecisionEngineConfiguration } from "./configuration.js";
import { DecisionEngineManager } from "./decision-engine-manager.js";
import type { DecisionEngineInput, DecisionEngineRunReport, EngineStatus } from "./types.js";

export class DecisionEngineController {
  private status: EngineStatus = "idle";
  private latestReport: DecisionEngineRunReport | null = null;

  constructor(
    private readonly manager: DecisionEngineManager,
    private readonly config: DecisionEngineConfiguration,
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
    return {
      ...this.config,
      evaluationCriteria: [...this.config.evaluationCriteria],
      criterionWeights: { ...this.config.criterionWeights },
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  submitProblem(input: DecisionEngineInput) {
    this.status = "recommending";
    return this.finish(this.manager.submitProblem(input, this.config));
  }

  generateOptions(input: DecisionEngineInput) {
    this.status = "generating_options";
    return this.finish(this.manager.generateOptions(input, this.config));
  }

  evaluateOptions(input: DecisionEngineInput) {
    this.status = "evaluating";
    return this.finish(this.manager.evaluateOptions(input, this.config));
  }

  produceDecisionPackage(input: DecisionEngineInput) {
    this.status = "recommending";
    return this.finish(this.manager.produceDecisionPackage(input, this.config));
  }

  validateDecision(input: DecisionEngineInput = { executiveObjective: "" }) {
    this.status = "active";
    return this.finish(this.manager.validateDecision(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: DecisionEngineRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
