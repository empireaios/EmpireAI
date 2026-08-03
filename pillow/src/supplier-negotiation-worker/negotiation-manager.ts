import type { SupplierNegotiationWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type SupplierNegotiationWorkerDependencies,
} from "./integrations.js";
import { appendSnwLog } from "./snw-logging.js";
import {
  INTEGRATION_TARGETS,
  SNW_CAPABILITIES,
  SNW_METADATA_VERSION,
  SUPPLIER_NEGOTIATION_WORKER_ID,
} from "./paths.js";
import { NegotiationBuilder } from "./negotiation-builder.js";
import { NegotiationStore } from "./negotiation-store.js";
import {
  HealthMonitor,
  NegotiationValidator,
  RecoveryManager,
} from "./negotiation-validator.js";
import type {
  EvaluatedSupplierInput,
  IntegrationHandshake,
  OperationalState,
  SupplierNegotiationReport,
  SupplierNegotiationWorkerCatalog,
  SupplierNegotiationWorkerEngineRecord,
  SupplierNegotiationWorkerInput,
  SupplierNegotiationWorkerRunReport,
} from "./types.js";

export class NegotiationManager {
  private engineRecord: SupplierNegotiationWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: SupplierNegotiationWorkerCatalog | null = null;
  private readonly store = new NegotiationStore();
  private readonly builder = new NegotiationBuilder();
  private readonly validator = new NegotiationValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private pendingEvaluations: EvaluatedSupplierInput[] = [];

  bindIntegrations(deps: SupplierNegotiationWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: SupplierNegotiationWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedNegotiations);
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

  getNegotiations() {
    return this.store.list();
  }

  getLatestNegotiationId() {
    return this.store.getLatestNegotiationId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: SupplierNegotiationWorkerConfiguration,
  ): SupplierNegotiationWorkerRunReport {
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
    appendSnwLog({
      event: "connect",
      details: `Supplier Negotiation Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `snw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Supplier Negotiation Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: SNW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveEvaluationReports(
    input: SupplierNegotiationWorkerInput,
    config: SupplierNegotiationWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("receive_evaluation_reports", input, config, started);
    }
    const pulled = this.integrations.pullEvaluatedSuppliers();
    const evaluations = this.builder.resolveEvaluations(input, pulled);
    this.pendingEvaluations = evaluations;
    if (!evaluations.length) {
      return this.disabled(
        "receive_evaluation_reports",
        config,
        "No supplier evaluation reports received — provide evaluatedSupplier(s) or bind Supplier Evaluation Worker",
      );
    }
    const validation = this.validator.finalize(
      "pass",
      [],
      [`Received ${evaluations.length} evaluated supplier(s) for negotiation preparation`],
      started,
    );
    this.ensureRecord("active", config, "partial");
    appendSnwLog({
      event: "receive_evaluation_reports",
      details: `evaluations=${evaluations.length}`,
    });
    return this.report(
      "receive_evaluation_reports",
      this.getCatalog(),
      [],
      null,
      { ...validation, decision: "partial" },
      started,
    );
  }

  compareSuppliers(input: SupplierNegotiationWorkerInput, config: SupplierNegotiationWorkerConfiguration) {
    return this.runNegotiation("compare_suppliers", input, config);
  }

  identifyOpportunities(
    input: SupplierNegotiationWorkerInput,
    config: SupplierNegotiationWorkerConfiguration,
  ) {
    return this.runNegotiation("identify_opportunities", input, config);
  }

  prepareMoqQuestions(
    input: SupplierNegotiationWorkerInput,
    config: SupplierNegotiationWorkerConfiguration,
  ) {
    return this.runNegotiation("prepare_moq_questions", input, config);
  }

  preparePricingQuestions(
    input: SupplierNegotiationWorkerInput,
    config: SupplierNegotiationWorkerConfiguration,
  ) {
    return this.runNegotiation("prepare_pricing_questions", input, config);
  }

  prepareShippingTerms(
    input: SupplierNegotiationWorkerInput,
    config: SupplierNegotiationWorkerConfiguration,
  ) {
    return this.runNegotiation("prepare_shipping_terms", input, config);
  }

  prepareFulfilmentQuestions(
    input: SupplierNegotiationWorkerInput,
    config: SupplierNegotiationWorkerConfiguration,
  ) {
    return this.runNegotiation("prepare_fulfilment_questions", input, config);
  }

  prepareRefundQuestions(
    input: SupplierNegotiationWorkerInput,
    config: SupplierNegotiationWorkerConfiguration,
  ) {
    return this.runNegotiation("prepare_refund_questions", input, config);
  }

  prepareDraftMessage(
    input: SupplierNegotiationWorkerInput,
    config: SupplierNegotiationWorkerConfiguration,
  ) {
    return this.runNegotiation("prepare_draft_message", input, config);
  }

  recommendPreferred(
    input: SupplierNegotiationWorkerInput,
    config: SupplierNegotiationWorkerConfiguration,
  ) {
    return this.runNegotiation("recommend_preferred", input, config);
  }

  produceReport(
    input: SupplierNegotiationWorkerInput,
    config: SupplierNegotiationWorkerConfiguration,
  ) {
    return this.runNegotiation("produce_report", input, config);
  }

  submitFindings(
    input: SupplierNegotiationWorkerInput,
    config: SupplierNegotiationWorkerConfiguration,
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

    let negotiations = this.store.list();
    if (input.negotiationId) {
      const one = this.store.get(input.negotiationId);
      negotiations = one ? [one] : [];
    }
    if (!negotiations.length) {
      const generated = this.runNegotiation("produce_report", input, config);
      negotiations = generated.negotiations;
      if (!negotiations.length || generated.validation.decision === "fail") return generated;
    }

    const submission = this.integrations.submitFindings(negotiations);
    if (submission.submitted && submission.executiveReportId) {
      negotiations = negotiations.map(
        (n) =>
          this.store.markSubmitted(n.negotiationId, submission.executiveReportId!) ?? n,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = negotiations[negotiations.length - 1] ?? null;
    const validation = this.validator.validateNegotiations(
      negotiations.length ? negotiations : null,
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
    appendSnwLog({
      event: "submit_findings",
      details: `negotiations=${negotiations.length} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_findings",
      this.getCatalog(),
      negotiations,
      latest,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: SupplierNegotiationWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const negotiations = this.store.list();
    const latest = negotiations[negotiations.length - 1] ?? null;
    const validation = this.validator.validateNegotiations(
      negotiations.length ? negotiations : null,
      { validated: true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), negotiations, latest, validation, started);
  }

  validate(input: SupplierNegotiationWorkerInput, config: SupplierNegotiationWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const negotiations = this.store.list();
    const latest = negotiations[negotiations.length - 1] ?? null;
    const validation = this.validator.validateNegotiations(
      negotiations.length ? negotiations : null,
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
    return this.report("validate", this.getCatalog(), negotiations, latest, validation, started);
  }

  diagnostics(config: SupplierNegotiationWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Supplier Negotiation Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendSnwLog({ event: "diagnostics", details: `negotiations=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runNegotiation(
    action: SupplierNegotiationWorkerRunReport["action"],
    input: SupplierNegotiationWorkerInput,
    config: SupplierNegotiationWorkerConfiguration,
  ): SupplierNegotiationWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.negotiationRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Supplier Negotiation Worker is disabled"
          : "Negotiation rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    const pulled = this.integrations.pullEvaluatedSuppliers();
    const evaluations = this.builder.resolveEvaluations(
      input,
      this.pendingEvaluations.length ? this.pendingEvaluations : pulled,
    );
    if (!evaluations.length) {
      return this.disabled(
        action,
        config,
        "Negotiation requires evaluated suppliers (evaluatedSupplier / evaluatedSuppliers)",
      );
    }
    this.pendingEvaluations = evaluations;

    const negotiation = this.builder.negotiate(input, config, evaluations);
    this.store.save(negotiation, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateNegotiations(
      [negotiation],
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      negotiation,
    );
    appendSnwLog({
      event: action,
      details: `negotiation=${negotiation.negotiationId} preferred=${negotiation.preferredSupplier?.supplierName ?? "none"} recommendation=${negotiation.recommendation}`,
    });
    return this.report(
      action,
      this.getCatalog(),
      [negotiation],
      negotiation,
      validation,
      started,
    );
  }

  private boundaryFail(
    action: SupplierNegotiationWorkerRunReport["action"],
    input: SupplierNegotiationWorkerInput,
    config: SupplierNegotiationWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateNegotiations(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: SupplierNegotiationWorkerRunReport["action"],
    config: SupplierNegotiationWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: SupplierNegotiationWorkerInput) {
    return (
      input.contactSuppliers === true ||
      input.commitAgreements === true ||
      input.placeOrders === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ307OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: SupplierNegotiationWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: SupplierNegotiationReport | null = null,
  ) {
    const negotiation = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `snw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: SUPPLIER_NEGOTIATION_WORKER_ID,
      engineVersion: "PILLOW-SNW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...SNW_CAPABILITIES],
      totalNegotiations: this.store.count(),
      lastRecommendation: negotiation?.recommendation ?? null,
      lastNegotiationId: negotiation?.negotiationId ?? this.store.getLatestNegotiationId(),
      lastPreferredSupplierId: negotiation?.preferredSupplier?.supplierId ?? null,
      lastConfidenceScore: negotiation?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: SNW_METADATA_VERSION,
    };
  }

  private report(
    action: SupplierNegotiationWorkerRunReport["action"],
    catalog: SupplierNegotiationWorkerCatalog | null,
    negotiations: SupplierNegotiationReport[],
    latestNegotiation: SupplierNegotiationReport | null,
    validation: SupplierNegotiationWorkerRunReport["validation"],
    started: number,
  ): SupplierNegotiationWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      negotiationRunReportId: `snw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      negotiations,
      latestNegotiation,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: SNW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(
  catalog: SupplierNegotiationWorkerCatalog,
): SupplierNegotiationWorkerCatalog {
  return {
    ...catalog,
    negotiations: catalog.negotiations.map((negotiation) => ({
      ...negotiation,
      candidateSuppliers: negotiation.candidateSuppliers.map((c) => ({
        ...c,
        strengths: [...c.strengths],
        weaknesses: [...c.weaknesses],
      })),
      preferredSupplier: negotiation.preferredSupplier
        ? {
            ...negotiation.preferredSupplier,
            strengths: [...negotiation.preferredSupplier.strengths],
            weaknesses: [...negotiation.preferredSupplier.weaknesses],
          }
        : null,
      negotiationOpportunities: [...negotiation.negotiationOpportunities],
      moqNegotiation: {
        ...negotiation.moqNegotiation,
        opportunities: [...negotiation.moqNegotiation.opportunities],
        questions: [...negotiation.moqNegotiation.questions],
      },
      priceNegotiation: {
        ...negotiation.priceNegotiation,
        opportunities: [...negotiation.priceNegotiation.opportunities],
        questions: [...negotiation.priceNegotiation.questions],
      },
      shippingNegotiation: {
        ...negotiation.shippingNegotiation,
        opportunities: [...negotiation.shippingNegotiation.opportunities],
        questions: [...negotiation.shippingNegotiation.questions],
      },
      fulfilmentQuestions: {
        ...negotiation.fulfilmentQuestions,
        opportunities: [...negotiation.fulfilmentQuestions.opportunities],
        questions: [...negotiation.fulfilmentQuestions.questions],
      },
      refundQuestions: {
        ...negotiation.refundQuestions,
        opportunities: [...negotiation.refundQuestions.opportunities],
        questions: [...negotiation.refundQuestions.questions],
      },
      supportingEvidence: negotiation.supportingEvidence.map((e) => ({ ...e })),
      evaluationIds: [...negotiation.evaluationIds],
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
