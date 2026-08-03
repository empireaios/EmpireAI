import type { SupplierEvaluationWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type SupplierEvaluationWorkerDependencies,
} from "./integrations.js";
import { appendSewLog } from "./sew-logging.js";
import {
  INTEGRATION_TARGETS,
  SEW_CAPABILITIES,
  SEW_METADATA_VERSION,
  SUPPLIER_EVALUATION_WORKER_ID,
} from "./paths.js";
import { EvaluationBuilder } from "./evaluation-builder.js";
import { EvaluationStore } from "./evaluation-store.js";
import {
  EvaluationValidator,
  HealthMonitor,
  RecoveryManager,
} from "./evaluation-validator.js";
import type {
  DiscoveredSupplierInput,
  IntegrationHandshake,
  OperationalState,
  SupplierEvaluationReport,
  SupplierEvaluationWorkerCatalog,
  SupplierEvaluationWorkerEngineRecord,
  SupplierEvaluationWorkerInput,
  SupplierEvaluationWorkerRunReport,
} from "./types.js";

export class EvaluationManager {
  private engineRecord: SupplierEvaluationWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: SupplierEvaluationWorkerCatalog | null = null;
  private readonly store = new EvaluationStore();
  private readonly builder = new EvaluationBuilder();
  private readonly validator = new EvaluationValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private pendingSuppliers: DiscoveredSupplierInput[] = [];

  bindIntegrations(deps: SupplierEvaluationWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: SupplierEvaluationWorkerConfiguration) {
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
    config: SupplierEvaluationWorkerConfiguration,
  ): SupplierEvaluationWorkerRunReport {
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
    appendSewLog({
      event: "connect",
      details: `Supplier Evaluation Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `sew-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Supplier Evaluation Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: SEW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveDiscoveryReports(
    input: SupplierEvaluationWorkerInput,
    config: SupplierEvaluationWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("receive_discovery_reports", input, config, started);
    }
    const pulled = this.integrations.pullDiscoveredSuppliers();
    const suppliers = this.builder.resolveSuppliers(input, pulled);
    this.pendingSuppliers = suppliers;
    if (!suppliers.length) {
      return this.disabled(
        "receive_discovery_reports",
        config,
        "No supplier discovery reports received — provide discoveredSupplier(s) or bind Supplier Discovery Worker",
      );
    }
    const validation = this.validator.finalize(
      "pass",
      [],
      [`Received ${suppliers.length} discovered supplier(s) for evaluation`],
      started,
    );
    this.ensureRecord("active", config, "partial");
    appendSewLog({
      event: "receive_discovery_reports",
      details: `suppliers=${suppliers.length}`,
    });
    return this.report(
      "receive_discovery_reports",
      this.getCatalog(),
      [],
      null,
      { ...validation, decision: "partial" },
      started,
    );
  }

  evaluateReliability(
    input: SupplierEvaluationWorkerInput,
    config: SupplierEvaluationWorkerConfiguration,
  ) {
    return this.runEvaluation("evaluate_reliability", input, config);
  }

  evaluatePricing(
    input: SupplierEvaluationWorkerInput,
    config: SupplierEvaluationWorkerConfiguration,
  ) {
    return this.runEvaluation("evaluate_pricing", input, config);
  }

  evaluateShipping(
    input: SupplierEvaluationWorkerInput,
    config: SupplierEvaluationWorkerConfiguration,
  ) {
    return this.runEvaluation("evaluate_shipping", input, config);
  }

  evaluateRefundPolicy(
    input: SupplierEvaluationWorkerInput,
    config: SupplierEvaluationWorkerConfiguration,
  ) {
    return this.runEvaluation("evaluate_refund_policy", input, config);
  }

  evaluateFulfilmentQuality(
    input: SupplierEvaluationWorkerInput,
    config: SupplierEvaluationWorkerConfiguration,
  ) {
    return this.runEvaluation("evaluate_fulfilment_quality", input, config);
  }

  evaluateCommunication(
    input: SupplierEvaluationWorkerInput,
    config: SupplierEvaluationWorkerConfiguration,
  ) {
    return this.runEvaluation("evaluate_communication", input, config);
  }

  evaluateRisk(
    input: SupplierEvaluationWorkerInput,
    config: SupplierEvaluationWorkerConfiguration,
  ) {
    return this.runEvaluation("evaluate_risk", input, config);
  }

  generateOverallScore(
    input: SupplierEvaluationWorkerInput,
    config: SupplierEvaluationWorkerConfiguration,
  ) {
    return this.runEvaluation("generate_overall_score", input, config);
  }

  recommend(input: SupplierEvaluationWorkerInput, config: SupplierEvaluationWorkerConfiguration) {
    return this.runEvaluation("recommend", input, config);
  }

  produceReport(
    input: SupplierEvaluationWorkerInput,
    config: SupplierEvaluationWorkerConfiguration,
  ) {
    return this.runEvaluation("produce_report", input, config);
  }

  submitFindings(
    input: SupplierEvaluationWorkerInput,
    config: SupplierEvaluationWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_findings", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled(
        "submit_findings",
        config,
        "Executive reporting submission is disabled",
      );
    }

    let evaluations = this.store.list();
    if (input.evaluationId) {
      const one = this.store.get(input.evaluationId);
      evaluations = one ? [one] : [];
    }
    if (!evaluations.length) {
      const generated = this.runEvaluation("produce_report", input, config);
      evaluations = generated.evaluations;
      if (!evaluations.length || generated.validation.decision === "fail") return generated;
    }

    const submission = this.integrations.submitFindings(evaluations);
    if (submission.submitted && submission.executiveReportId) {
      evaluations = evaluations.map(
        (e) =>
          this.store.markSubmitted(e.evaluationId, submission.executiveReportId!) ?? e,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = evaluations[evaluations.length - 1] ?? null;
    const validation = this.validator.validateEvaluations(
      evaluations.length ? evaluations : null,
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
      latest,
    );
    appendSewLog({
      event: "submit_findings",
      details: `evaluations=${evaluations.length} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_findings",
      this.getCatalog(),
      evaluations,
      latest,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: SupplierEvaluationWorkerConfiguration) {
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

  validate(input: SupplierEvaluationWorkerInput, config: SupplierEvaluationWorkerConfiguration) {
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

  diagnostics(config: SupplierEvaluationWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Supplier Evaluation Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendSewLog({ event: "diagnostics", details: `evaluations=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runEvaluation(
    action: SupplierEvaluationWorkerRunReport["action"],
    input: SupplierEvaluationWorkerInput,
    config: SupplierEvaluationWorkerConfiguration,
  ): SupplierEvaluationWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.evaluationRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Supplier Evaluation Worker is disabled"
          : "Evaluation rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    const pulled = this.integrations.pullDiscoveredSuppliers();
    const suppliers = this.builder.resolveSuppliers(
      input,
      this.pendingSuppliers.length ? this.pendingSuppliers : pulled,
    );
    if (!suppliers.length) {
      return this.disabled(
        action,
        config,
        "Evaluation requires discovered suppliers (discoveredSupplier / discoveredSuppliers / supplierName)",
      );
    }
    this.pendingSuppliers = suppliers;

    const evaluations = this.builder.evaluate(input, config, suppliers);
    this.store.saveMany(evaluations, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = evaluations[evaluations.length - 1] ?? null;
    const validation = this.validator.validateEvaluations(
      evaluations,
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
    appendSewLog({
      event: action,
      details: `evaluations=${evaluations.length} latest=${latest?.evaluationId ?? "none"} overall=${latest?.overallScore ?? "n/a"} recommendation=${latest?.recommendation ?? "n/a"}`,
    });
    return this.report(action, this.getCatalog(), evaluations, latest, validation, started);
  }

  private boundaryFail(
    action: SupplierEvaluationWorkerRunReport["action"],
    input: SupplierEvaluationWorkerInput,
    config: SupplierEvaluationWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateEvaluations(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: SupplierEvaluationWorkerRunReport["action"],
    config: SupplierEvaluationWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: SupplierEvaluationWorkerInput) {
    return (
      input.discoverSuppliers === true ||
      input.negotiateSuppliers === true ||
      input.placeSupplierOrders === true ||
      input.modifySupplierInformation === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ306OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: SupplierEvaluationWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: SupplierEvaluationReport | null = null,
  ) {
    const evaluation = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `sew-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: SUPPLIER_EVALUATION_WORKER_ID,
      engineVersion: "PILLOW-SEW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...SEW_CAPABILITIES],
      totalEvaluations: this.store.count(),
      lastRecommendation: evaluation?.recommendation ?? null,
      lastEvaluationId: evaluation?.evaluationId ?? this.store.getLatestEvaluationId(),
      lastOverallScore: evaluation?.overallScore ?? null,
      lastConfidenceScore: evaluation?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: SEW_METADATA_VERSION,
    };
  }

  private report(
    action: SupplierEvaluationWorkerRunReport["action"],
    catalog: SupplierEvaluationWorkerCatalog | null,
    evaluations: SupplierEvaluationReport[],
    latestEvaluation: SupplierEvaluationReport | null,
    validation: SupplierEvaluationWorkerRunReport["validation"],
    started: number,
  ): SupplierEvaluationWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      evaluationRunReportId: `sew-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      evaluations,
      latestEvaluation,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: SEW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(
  catalog: SupplierEvaluationWorkerCatalog,
): SupplierEvaluationWorkerCatalog {
  return {
    ...catalog,
    evaluations: catalog.evaluations.map((evaluation) => ({
      ...evaluation,
      facts: [...evaluation.facts],
      assumptions: [...evaluation.assumptions],
      supportingEvidence: evaluation.supportingEvidence.map((e) => ({ ...e })),
      scoreNotes: { ...evaluation.scoreNotes },
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
