import type { OpportunityEvaluationWorkerConfiguration } from "./configuration.js";
import type { OpportunityEvaluationWorkerDependencies } from "./integrations.js";
import { EvaluationManager } from "./evaluation-manager.js";
import type {
  EngineStatus,
  OpportunityEvaluationWorkerInput,
  OpportunityEvaluationWorkerRunReport,
} from "./types.js";

export class OpportunityEvaluationWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: OpportunityEvaluationWorkerRunReport | null = null;

  constructor(
    private readonly manager: EvaluationManager,
    private readonly config: OpportunityEvaluationWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: OpportunityEvaluationWorkerDependencies = {}) {
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
      businessTypes: [...this.config.businessTypes],
      integrationTargets: [...this.config.integrationTargets],
      reportingLine: [...this.config.reportingLine],
      scoreWeights: { ...this.config.scoreWeights },
      seedEvaluations: this.config.seedEvaluations.map((evaluation) => ({
        ...evaluation,
        supportingEvidence: evaluation.supportingEvidence.map((e) => ({ ...e })),
        facts: [...evaluation.facts],
        assumptions: [...evaluation.assumptions],
        missingInformation: [...evaluation.missingInformation],
        scoreWeights: { ...evaluation.scoreWeights },
        scoreExplanations: {
          demand: {
            ...evaluation.scoreExplanations.demand,
            facts: [...evaluation.scoreExplanations.demand.facts],
            assumptions: [...evaluation.scoreExplanations.demand.assumptions],
            evidenceRefs: [...evaluation.scoreExplanations.demand.evidenceRefs],
          },
          feasibility: {
            ...evaluation.scoreExplanations.feasibility,
            facts: [...evaluation.scoreExplanations.feasibility.facts],
            assumptions: [...evaluation.scoreExplanations.feasibility.assumptions],
            evidenceRefs: [...evaluation.scoreExplanations.feasibility.evidenceRefs],
          },
          revenuePotential: {
            ...evaluation.scoreExplanations.revenuePotential,
            facts: [...evaluation.scoreExplanations.revenuePotential.facts],
            assumptions: [...evaluation.scoreExplanations.revenuePotential.assumptions],
            evidenceRefs: [
              ...evaluation.scoreExplanations.revenuePotential.evidenceRefs,
            ],
          },
          profitPotential: {
            ...evaluation.scoreExplanations.profitPotential,
            facts: [...evaluation.scoreExplanations.profitPotential.facts],
            assumptions: [...evaluation.scoreExplanations.profitPotential.assumptions],
            evidenceRefs: [
              ...evaluation.scoreExplanations.profitPotential.evidenceRefs,
            ],
          },
          operationalComplexity: {
            ...evaluation.scoreExplanations.operationalComplexity,
            facts: [...evaluation.scoreExplanations.operationalComplexity.facts],
            assumptions: [
              ...evaluation.scoreExplanations.operationalComplexity.assumptions,
            ],
            evidenceRefs: [
              ...evaluation.scoreExplanations.operationalComplexity.evidenceRefs,
            ],
          },
          executionRisk: {
            ...evaluation.scoreExplanations.executionRisk,
            facts: [...evaluation.scoreExplanations.executionRisk.facts],
            assumptions: [...evaluation.scoreExplanations.executionRisk.assumptions],
            evidenceRefs: [...evaluation.scoreExplanations.executionRisk.evidenceRefs],
          },
          strategicFit: {
            ...evaluation.scoreExplanations.strategicFit,
            facts: [...evaluation.scoreExplanations.strategicFit.facts],
            assumptions: [...evaluation.scoreExplanations.strategicFit.assumptions],
            evidenceRefs: [...evaluation.scoreExplanations.strategicFit.evidenceRefs],
          },
          overall: {
            ...evaluation.scoreExplanations.overall,
            facts: [...evaluation.scoreExplanations.overall.facts],
            assumptions: [...evaluation.scoreExplanations.overall.assumptions],
            evidenceRefs: [...evaluation.scoreExplanations.overall.evidenceRefs],
          },
        },
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

  receiveBusinessModel(input: OpportunityEvaluationWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveBusinessModel(input, this.config));
  }

  receiveMarketResearch(input: OpportunityEvaluationWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveMarketResearch(input, this.config));
  }

  evaluateDemand(input: OpportunityEvaluationWorkerInput = {}) {
    this.status = "evaluating";
    return this.finish(this.manager.evaluateDemand(input, this.config));
  }

  evaluateFeasibility(input: OpportunityEvaluationWorkerInput = {}) {
    this.status = "evaluating";
    return this.finish(this.manager.evaluateFeasibility(input, this.config));
  }

  evaluateProfit(input: OpportunityEvaluationWorkerInput = {}) {
    this.status = "evaluating";
    return this.finish(this.manager.evaluateProfit(input, this.config));
  }

  evaluateRisk(input: OpportunityEvaluationWorkerInput = {}) {
    this.status = "evaluating";
    return this.finish(this.manager.evaluateRisk(input, this.config));
  }

  evaluateStrategicFit(input: OpportunityEvaluationWorkerInput = {}) {
    this.status = "evaluating";
    return this.finish(this.manager.evaluateStrategicFit(input, this.config));
  }

  produceEvaluation(input: OpportunityEvaluationWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceEvaluation(input, this.config));
  }

  submitReport(input: OpportunityEvaluationWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: OpportunityEvaluationWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: OpportunityEvaluationWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
