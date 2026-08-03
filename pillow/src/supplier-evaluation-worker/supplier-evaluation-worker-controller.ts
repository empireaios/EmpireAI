import type { SupplierEvaluationWorkerConfiguration } from "./configuration.js";
import type { SupplierEvaluationWorkerDependencies } from "./integrations.js";
import { EvaluationManager } from "./evaluation-manager.js";
import type {
  EngineStatus,
  SupplierEvaluationWorkerInput,
  SupplierEvaluationWorkerRunReport,
} from "./types.js";

export class SupplierEvaluationWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: SupplierEvaluationWorkerRunReport | null = null;

  constructor(
    private readonly manager: EvaluationManager,
    private readonly config: SupplierEvaluationWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: SupplierEvaluationWorkerDependencies = {}) {
    this.manager.bindIntegrations(deps);
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
      scoreDimensions: [...this.config.scoreDimensions],
      recommendations: [...this.config.recommendations],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      seedEvaluations: this.config.seedEvaluations.map((evaluation) => ({
        ...evaluation,
        facts: [...evaluation.facts],
        assumptions: [...evaluation.assumptions],
        supportingEvidence: evaluation.supportingEvidence.map((e) => ({ ...e })),
        scoreNotes: { ...evaluation.scoreNotes },
      })),
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  receiveDiscoveryReports(input: SupplierEvaluationWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveDiscoveryReports(input, this.config));
  }

  evaluateReliability(input: SupplierEvaluationWorkerInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.evaluateReliability(input, this.config));
  }

  evaluatePricing(input: SupplierEvaluationWorkerInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.evaluatePricing(input, this.config));
  }

  evaluateShipping(input: SupplierEvaluationWorkerInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.evaluateShipping(input, this.config));
  }

  evaluateRefundPolicy(input: SupplierEvaluationWorkerInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.evaluateRefundPolicy(input, this.config));
  }

  evaluateFulfilmentQuality(input: SupplierEvaluationWorkerInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.evaluateFulfilmentQuality(input, this.config));
  }

  evaluateCommunication(input: SupplierEvaluationWorkerInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.evaluateCommunication(input, this.config));
  }

  evaluateRisk(input: SupplierEvaluationWorkerInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.evaluateRisk(input, this.config));
  }

  generateOverallScore(input: SupplierEvaluationWorkerInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.generateOverallScore(input, this.config));
  }

  recommend(input: SupplierEvaluationWorkerInput = {}) {
    this.status = "recommending";
    return this.finish(this.manager.recommend(input, this.config));
  }

  produceReport(input: SupplierEvaluationWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitFindings(input: SupplierEvaluationWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitFindings(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: SupplierEvaluationWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: SupplierEvaluationWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
