import type { ProductEvaluationWorkerConfiguration } from "./configuration.js";
import type { ProductEvaluationWorkerDependencies } from "./integrations.js";
import { EvaluationManager } from "./evaluation-manager.js";
import type {
  EngineStatus,
  ProductEvaluationWorkerInput,
  ProductEvaluationWorkerRunReport,
} from "./types.js";

export class ProductEvaluationWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: ProductEvaluationWorkerRunReport | null = null;

  constructor(
    private readonly manager: EvaluationManager,
    private readonly config: ProductEvaluationWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: ProductEvaluationWorkerDependencies = {}) {
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

  receiveDiscoveredProducts(input: ProductEvaluationWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveDiscoveredProducts(input, this.config));
  }

  scoreMargin(input: ProductEvaluationWorkerInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.scoreMargin(input, this.config));
  }

  scoreDemand(input: ProductEvaluationWorkerInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.scoreDemand(input, this.config));
  }

  scoreCompetition(input: ProductEvaluationWorkerInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.scoreCompetition(input, this.config));
  }

  scoreShipping(input: ProductEvaluationWorkerInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.scoreShipping(input, this.config));
  }

  scoreRisk(input: ProductEvaluationWorkerInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.scoreRisk(input, this.config));
  }

  scoreReviews(input: ProductEvaluationWorkerInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.scoreReviews(input, this.config));
  }

  scoreCreativePotential(input: ProductEvaluationWorkerInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.scoreCreativePotential(input, this.config));
  }

  generateOverallScore(input: ProductEvaluationWorkerInput = {}) {
    this.status = "scoring";
    return this.finish(this.manager.generateOverallScore(input, this.config));
  }

  recommend(input: ProductEvaluationWorkerInput = {}) {
    this.status = "recommending";
    return this.finish(this.manager.recommend(input, this.config));
  }

  produceReport(input: ProductEvaluationWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceReport(input, this.config));
  }

  submitFindings(input: ProductEvaluationWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitFindings(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: ProductEvaluationWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: ProductEvaluationWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
