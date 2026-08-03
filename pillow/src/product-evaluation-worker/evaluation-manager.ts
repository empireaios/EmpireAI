import type { ProductEvaluationWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type ProductEvaluationWorkerDependencies,
} from "./integrations.js";
import { appendPewLog } from "./pew-logging.js";
import {
  INTEGRATION_TARGETS,
  PEW_CAPABILITIES,
  PEW_METADATA_VERSION,
  PRODUCT_EVALUATION_WORKER_ID,
} from "./paths.js";
import { EvaluationBuilder } from "./evaluation-builder.js";
import { EvaluationStore } from "./evaluation-store.js";
import {
  EvaluationValidator,
  HealthMonitor,
  RecoveryManager,
} from "./evaluation-validator.js";
import type {
  DiscoveredProductInput,
  IntegrationHandshake,
  OperationalState,
  ProductEvaluationReport,
  ProductEvaluationWorkerCatalog,
  ProductEvaluationWorkerEngineRecord,
  ProductEvaluationWorkerInput,
  ProductEvaluationWorkerRunReport,
} from "./types.js";

export class EvaluationManager {
  private engineRecord: ProductEvaluationWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: ProductEvaluationWorkerCatalog | null = null;
  private readonly store = new EvaluationStore();
  private readonly builder = new EvaluationBuilder();
  private readonly validator = new EvaluationValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private pendingProducts: DiscoveredProductInput[] = [];

  bindIntegrations(deps: ProductEvaluationWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: ProductEvaluationWorkerConfiguration) {
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
    config: ProductEvaluationWorkerConfiguration,
  ): ProductEvaluationWorkerRunReport {
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
    appendPewLog({
      event: "connect",
      details: `Product Evaluation Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `pew-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Product Evaluation Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: PEW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveDiscoveredProducts(
    input: ProductEvaluationWorkerInput,
    config: ProductEvaluationWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("receive_discovered_products", input, config, started);
    }
    const pulled = this.integrations.pullDiscoveredProducts();
    const products = this.builder.resolveProducts(input, pulled);
    this.pendingProducts = products;
    if (!products.length) {
      return this.disabled(
        "receive_discovered_products",
        config,
        "No discovered products received — provide discoveredProduct(s) or bind Product Discovery Worker",
      );
    }
    const validation = this.validator.finalize(
      "pass",
      [],
      [`Received ${products.length} discovered product(s) for evaluation`],
      started,
    );
    this.ensureRecord("active", config, "partial");
    appendPewLog({
      event: "receive_discovered_products",
      details: `products=${products.length}`,
    });
    return this.report(
      "receive_discovered_products",
      this.getCatalog(),
      [],
      null,
      { ...validation, decision: "partial" },
      started,
    );
  }

  scoreMargin(input: ProductEvaluationWorkerInput, config: ProductEvaluationWorkerConfiguration) {
    return this.runEvaluation("score_margin", input, config);
  }

  scoreDemand(input: ProductEvaluationWorkerInput, config: ProductEvaluationWorkerConfiguration) {
    return this.runEvaluation("score_demand", input, config);
  }

  scoreCompetition(
    input: ProductEvaluationWorkerInput,
    config: ProductEvaluationWorkerConfiguration,
  ) {
    return this.runEvaluation("score_competition", input, config);
  }

  scoreShipping(
    input: ProductEvaluationWorkerInput,
    config: ProductEvaluationWorkerConfiguration,
  ) {
    return this.runEvaluation("score_shipping", input, config);
  }

  scoreRisk(input: ProductEvaluationWorkerInput, config: ProductEvaluationWorkerConfiguration) {
    return this.runEvaluation("score_risk", input, config);
  }

  scoreReviews(
    input: ProductEvaluationWorkerInput,
    config: ProductEvaluationWorkerConfiguration,
  ) {
    return this.runEvaluation("score_reviews", input, config);
  }

  scoreCreativePotential(
    input: ProductEvaluationWorkerInput,
    config: ProductEvaluationWorkerConfiguration,
  ) {
    return this.runEvaluation("score_creative_potential", input, config);
  }

  generateOverallScore(
    input: ProductEvaluationWorkerInput,
    config: ProductEvaluationWorkerConfiguration,
  ) {
    return this.runEvaluation("generate_overall_score", input, config);
  }

  recommend(input: ProductEvaluationWorkerInput, config: ProductEvaluationWorkerConfiguration) {
    return this.runEvaluation("recommend", input, config);
  }

  produceReport(
    input: ProductEvaluationWorkerInput,
    config: ProductEvaluationWorkerConfiguration,
  ) {
    return this.runEvaluation("produce_report", input, config);
  }

  submitFindings(
    input: ProductEvaluationWorkerInput,
    config: ProductEvaluationWorkerConfiguration,
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
    appendPewLog({
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

  list(config: ProductEvaluationWorkerConfiguration) {
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

  validate(input: ProductEvaluationWorkerInput, config: ProductEvaluationWorkerConfiguration) {
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

  diagnostics(config: ProductEvaluationWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Product Evaluation Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendPewLog({ event: "diagnostics", details: `evaluations=${this.store.count()}` });
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
    action: ProductEvaluationWorkerRunReport["action"],
    input: ProductEvaluationWorkerInput,
    config: ProductEvaluationWorkerConfiguration,
  ): ProductEvaluationWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.evaluationRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Product Evaluation Worker is disabled"
          : "Evaluation rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    const pulled = this.integrations.pullDiscoveredProducts();
    const products = this.builder.resolveProducts(
      input,
      this.pendingProducts.length ? this.pendingProducts : pulled,
    );
    if (!products.length) {
      return this.disabled(
        action,
        config,
        "Evaluation requires discovered products (discoveredProduct / discoveredProducts / productName)",
      );
    }
    this.pendingProducts = products;

    const evaluations = this.builder.evaluate(input, config, products);
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
    appendPewLog({
      event: action,
      details: `evaluations=${evaluations.length} latest=${latest?.evaluationId ?? "none"} overall=${latest?.overallScore ?? "n/a"} recommendation=${latest?.recommendation ?? "n/a"}`,
    });
    return this.report(action, this.getCatalog(), evaluations, latest, validation, started);
  }

  private boundaryFail(
    action: ProductEvaluationWorkerRunReport["action"],
    input: ProductEvaluationWorkerInput,
    config: ProductEvaluationWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateEvaluations(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: ProductEvaluationWorkerRunReport["action"],
    config: ProductEvaluationWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: ProductEvaluationWorkerInput) {
    return (
      input.discoverProducts === true ||
      input.selectSuppliers === true ||
      input.createListings === true ||
      input.purchaseInventory === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ304OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: ProductEvaluationWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: ProductEvaluationReport | null = null,
  ) {
    const evaluation = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `pew-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: PRODUCT_EVALUATION_WORKER_ID,
      engineVersion: "PILLOW-PEW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...PEW_CAPABILITIES],
      totalEvaluations: this.store.count(),
      lastRecommendation: evaluation?.recommendation ?? null,
      lastEvaluationId: evaluation?.evaluationId ?? this.store.getLatestEvaluationId(),
      lastOverallScore: evaluation?.overallScore ?? null,
      lastConfidenceScore: evaluation?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: PEW_METADATA_VERSION,
    };
  }

  private report(
    action: ProductEvaluationWorkerRunReport["action"],
    catalog: ProductEvaluationWorkerCatalog | null,
    evaluations: ProductEvaluationReport[],
    latestEvaluation: ProductEvaluationReport | null,
    validation: ProductEvaluationWorkerRunReport["validation"],
    started: number,
  ): ProductEvaluationWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      evaluationRunReportId: `pew-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      evaluations,
      latestEvaluation,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: PEW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(
  catalog: ProductEvaluationWorkerCatalog,
): ProductEvaluationWorkerCatalog {
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
