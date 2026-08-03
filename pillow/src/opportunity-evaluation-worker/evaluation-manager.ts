import type { OpportunityEvaluationWorkerConfiguration } from "./configuration.js";
import { EvaluationBuilder } from "./evaluation-builder.js";
import { EvaluationStore } from "./evaluation-store.js";
import {
  EvaluationValidator,
  HealthMonitor,
  RecoveryManager,
} from "./evaluation-validator.js";
import {
  IntegrationCoordinator,
  type OpportunityEvaluationWorkerDependencies,
} from "./integrations.js";
import { appendOewLog } from "./oew-logging.js";
import {
  INTEGRATION_TARGETS,
  OEW_CAPABILITIES,
  OEW_METADATA_VERSION,
  OPPORTUNITY_EVALUATION_WORKER_ID,
} from "./paths.js";
import type {
  IntegrationHandshake,
  OpportunityEvaluationReport,
  OpportunityEvaluationWorkerCatalog,
  OpportunityEvaluationWorkerEngineRecord,
  OpportunityEvaluationWorkerInput,
  OpportunityEvaluationWorkerRunReport,
  OperationalState,
} from "./types.js";

export class EvaluationManager {
  private engineRecord: OpportunityEvaluationWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: OpportunityEvaluationWorkerCatalog | null = null;
  private readonly store = new EvaluationStore();
  private readonly builder = new EvaluationBuilder();
  private readonly validator = new EvaluationValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private pendingModel: OpportunityEvaluationWorkerInput["businessModel"] = null;
  private pendingResearch: OpportunityEvaluationWorkerInput["marketResearch"] = null;

  bindIntegrations(deps: OpportunityEvaluationWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: OpportunityEvaluationWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedEvaluations);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.seeded = true;
    this.ensureRecord("connected", config);
  }

  getEngineRecord() {
    return this.engineRecord
      ? {
          ...this.engineRecord,
          supportedCapabilities: [...this.engineRecord.supportedCapabilities],
          integrationTargets: [...this.engineRecord.integrationTargets],
        }
      : null;
  }

  getCatalog() {
    return this.catalog ? cloneCatalog(this.catalog) : null;
  }

  getEvaluations() {
    return this.store.list();
  }

  getLatestEvaluationId() {
    return this.store.getLatestEvaluationId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: OpportunityEvaluationWorkerConfiguration,
  ): OpportunityEvaluationWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length
        ? config.integrationTargets
        : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendOewLog({
      event: "connect",
      details: `Opportunity Evaluation Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `oew-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Opportunity Evaluation Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: OEW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveBusinessModel(
    input: OpportunityEvaluationWorkerInput,
    config: OpportunityEvaluationWorkerConfiguration,
  ) {
    this.pendingModel = input.businessModel ?? this.pendingModel;
    return this.runEvaluate("receive_business_model", input, config, true);
  }

  receiveMarketResearch(
    input: OpportunityEvaluationWorkerInput,
    config: OpportunityEvaluationWorkerConfiguration,
  ) {
    this.pendingResearch = input.marketResearch ?? this.pendingResearch;
    return this.runEvaluate("receive_market_research", input, config, true);
  }

  evaluateDemand(
    input: OpportunityEvaluationWorkerInput,
    config: OpportunityEvaluationWorkerConfiguration,
  ) {
    return this.runEvaluate("evaluate_demand", input, config);
  }

  evaluateFeasibility(
    input: OpportunityEvaluationWorkerInput,
    config: OpportunityEvaluationWorkerConfiguration,
  ) {
    return this.runEvaluate("evaluate_feasibility", input, config);
  }

  evaluateProfit(
    input: OpportunityEvaluationWorkerInput,
    config: OpportunityEvaluationWorkerConfiguration,
  ) {
    return this.runEvaluate("evaluate_profit", input, config);
  }

  evaluateRisk(
    input: OpportunityEvaluationWorkerInput,
    config: OpportunityEvaluationWorkerConfiguration,
  ) {
    return this.runEvaluate("evaluate_risk", input, config);
  }

  evaluateStrategicFit(
    input: OpportunityEvaluationWorkerInput,
    config: OpportunityEvaluationWorkerConfiguration,
  ) {
    return this.runEvaluate("evaluate_strategic_fit", input, config);
  }

  produceEvaluation(
    input: OpportunityEvaluationWorkerInput,
    config: OpportunityEvaluationWorkerConfiguration,
  ) {
    return this.runEvaluate("produce_evaluation", input, config);
  }

  submitReport(
    input: OpportunityEvaluationWorkerInput,
    config: OpportunityEvaluationWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled(
        "submit_report",
        config,
        "Executive reporting submission is disabled",
      );
    }

    let evaluation =
      (input.evaluationId ? this.store.get(input.evaluationId) : null) ??
      this.store.list().at(-1) ??
      null;
    if (!evaluation) {
      const generated = this.runEvaluate("produce_evaluation", input, config);
      evaluation = generated.latestEvaluation;
      if (!evaluation || generated.validation.decision === "fail") return generated;
    }

    const submission = this.integrations.submitReport(evaluation);
    if (submission.submitted && submission.executiveReportId) {
      evaluation =
        this.store.markSubmitted(evaluation.evaluationId, submission.executiveReportId) ??
        evaluation;
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateEvaluations(
      evaluation ? [evaluation] : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (!submission.submitted) {
      validation.warnings.push(submission.details);
    }
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      evaluation,
    );
    appendOewLog({
      event: "submit_report",
      details: `evaluation=${evaluation?.evaluationId ?? "none"} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_report",
      this.getCatalog(),
      evaluation ? [evaluation] : [],
      evaluation,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: OpportunityEvaluationWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const evaluations = this.store.list();
    const latest = evaluations[evaluations.length - 1] ?? null;
    const validation = this.validator.validateEvaluations(
      evaluations.length ? evaluations : null,
      { validated: true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), evaluations, latest, validation, started);
  }

  validate(
    input: OpportunityEvaluationWorkerInput,
    config: OpportunityEvaluationWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const evaluations = this.store.list();
    const latest = evaluations[evaluations.length - 1] ?? null;
    const validation = this.validator.validateEvaluations(
      evaluations.length ? evaluations : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("validate", this.getCatalog(), evaluations, latest, validation, started);
  }

  diagnostics(config: OpportunityEvaluationWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Opportunity Evaluation Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendOewLog({ event: "diagnostics", details: `evaluations=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runEvaluate(
    action: OpportunityEvaluationWorkerRunReport["action"],
    input: OpportunityEvaluationWorkerInput,
    config: OpportunityEvaluationWorkerConfiguration,
    allowPartialInputs = false,
  ): OpportunityEvaluationWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.evaluationRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Opportunity Evaluation Worker is disabled"
          : "Evaluation rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    const merged: OpportunityEvaluationWorkerInput = {
      ...input,
      businessModel: input.businessModel ?? this.pendingModel,
      marketResearch: input.marketResearch ?? this.pendingResearch,
    };
    if (merged.businessModel) this.pendingModel = merged.businessModel;
    if (merged.marketResearch) this.pendingResearch = merged.marketResearch;

    const hasModel = !!merged.businessModel;
    const hasResearch = !!merged.marketResearch;
    if (!allowPartialInputs && (!hasModel || !hasResearch)) {
      return this.disabled(
        action,
        config,
        "Evaluation requires both businessModel and marketResearch inputs from prior Q2 workers",
      );
    }
    if (allowPartialInputs && !hasModel && !hasResearch) {
      return this.disabled(
        action,
        config,
        "Receive actions require a businessModel or marketResearch payload",
      );
    }
    if (allowPartialInputs && (!hasModel || !hasResearch)) {
      const validation = this.validator.finalize(
        "partial",
        [],
        [
          hasModel
            ? "Business model received; awaiting market research before full evaluation"
            : "Market research received; awaiting business model before full evaluation",
        ],
        started,
      );
      this.ensureRecord("active", config, "partial");
      appendOewLog({
        event: action,
        details: `partial_receive model=${hasModel} research=${hasResearch}`,
      });
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }

    const evaluation = this.builder.evaluate(merged, config);
    this.store.save(evaluation, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateEvaluations(
      [evaluation],
      { ...merged, validated: merged.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      evaluation,
    );
    appendOewLog({
      event: action,
      details: `evaluation=${evaluation.evaluationId} overall=${evaluation.overallOpportunityScore} recommendation=${evaluation.recommendation}`,
    });
    return this.report(
      action,
      this.getCatalog(),
      [evaluation],
      evaluation,
      validation,
      started,
    );
  }

  private boundaryFail(
    action: OpportunityEvaluationWorkerRunReport["action"],
    input: OpportunityEvaluationWorkerInput,
    config: OpportunityEvaluationWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateEvaluations(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: OpportunityEvaluationWorkerRunReport["action"],
    config: OpportunityEvaluationWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: OpportunityEvaluationWorkerInput) {
    return (
      input.approveBusiness === true ||
      input.modifyBusinessModel === true ||
      input.launchBusiness === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ206OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: OpportunityEvaluationWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: OpportunityEvaluationReport | null = null,
  ) {
    const evaluation = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `oew-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: OPPORTUNITY_EVALUATION_WORKER_ID,
      engineVersion: "PILLOW-OEW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...OEW_CAPABILITIES],
      totalEvaluations: this.store.count(),
      lastBusinessType: evaluation?.businessType ?? null,
      lastEvaluationId: evaluation?.evaluationId ?? this.store.getLatestEvaluationId(),
      lastOverallScore: evaluation?.overallOpportunityScore ?? null,
      lastRecommendation: evaluation?.recommendation ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: OEW_METADATA_VERSION,
    };
  }

  private report(
    action: OpportunityEvaluationWorkerRunReport["action"],
    catalog: OpportunityEvaluationWorkerCatalog | null,
    evaluations: OpportunityEvaluationReport[],
    latestEvaluation: OpportunityEvaluationReport | null,
    validation: OpportunityEvaluationWorkerRunReport["validation"],
    started: number,
  ): OpportunityEvaluationWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      evaluationRunReportId: `oew-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      evaluations,
      latestEvaluation,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: OEW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(
  catalog: OpportunityEvaluationWorkerCatalog,
): OpportunityEvaluationWorkerCatalog {
  const cloneScore = (
    s: OpportunityEvaluationReport["scoreExplanations"]["demand"],
  ) => ({
    ...s,
    facts: [...s.facts],
    assumptions: [...s.assumptions],
    evidenceRefs: [...s.evidenceRefs],
  });
  return {
    ...catalog,
    evaluations: catalog.evaluations.map((evaluation) => ({
      ...evaluation,
      supportingEvidence: evaluation.supportingEvidence.map((e) => ({ ...e })),
      facts: [...evaluation.facts],
      assumptions: [...evaluation.assumptions],
      missingInformation: [...evaluation.missingInformation],
      scoreWeights: { ...evaluation.scoreWeights },
      scoreExplanations: {
        demand: cloneScore(evaluation.scoreExplanations.demand),
        feasibility: cloneScore(evaluation.scoreExplanations.feasibility),
        revenuePotential: cloneScore(evaluation.scoreExplanations.revenuePotential),
        profitPotential: cloneScore(evaluation.scoreExplanations.profitPotential),
        operationalComplexity: cloneScore(
          evaluation.scoreExplanations.operationalComplexity,
        ),
        executionRisk: cloneScore(evaluation.scoreExplanations.executionRisk),
        strategicFit: cloneScore(evaluation.scoreExplanations.strategicFit),
        overall: cloneScore(evaluation.scoreExplanations.overall),
      },
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
