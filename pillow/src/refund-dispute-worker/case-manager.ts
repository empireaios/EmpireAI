import type { RefundDisputeWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type RefundDisputeWorkerDependencies,
} from "./integrations.js";
import { appendRdwLog } from "./rdw-logging.js";
import {
  INTEGRATION_TARGETS,
  RDW_CAPABILITIES,
  RDW_METADATA_VERSION,
  REFUND_DISPUTE_WORKER_ID,
} from "./paths.js";
import { CaseBuilder } from "./case-builder.js";
import { CaseStore } from "./case-store.js";
import {
  CaseValidator,
  HealthMonitor,
  RecoveryManager,
} from "./case-validator.js";
import type {
  CaseRequestInput,
  CaseType,
  IntegrationHandshake,
  OperationalState,
  RefundDisputeReport,
  RefundDisputeWorkerCatalog,
  RefundDisputeWorkerEngineRecord,
  RefundDisputeWorkerInput,
  RefundDisputeWorkerRunReport,
} from "./types.js";

export class CaseManager {
  private engineRecord: RefundDisputeWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: RefundDisputeWorkerCatalog | null = null;
  private readonly store = new CaseStore();
  private readonly builder = new CaseBuilder();
  private readonly validator = new CaseValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private pendingCase: CaseRequestInput | null = null;
  private pendingContext: RefundDisputeWorkerInput = {};
  private pendingReceiveHint: CaseType | null = null;

  bindIntegrations(deps: RefundDisputeWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: RefundDisputeWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedCases);
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

  getCases() {
    return this.store.list();
  }

  getRefundDisputeReports() {
    return this.store.list();
  }

  getLatestCaseId() {
    return this.store.getLatestCaseId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: RefundDisputeWorkerConfiguration,
  ): RefundDisputeWorkerRunReport {
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
    appendRdwLog({
      event: "connect",
      details: `Refund & Dispute Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `rdw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Refund & Dispute Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: RDW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveRefundRequest(input: RefundDisputeWorkerInput, config: RefundDisputeWorkerConfiguration) {
    return this.receiveCase("receive_refund_request", input, config, "refund");
  }

  receiveReturnRequest(input: RefundDisputeWorkerInput, config: RefundDisputeWorkerConfiguration) {
    return this.receiveCase("receive_return_request", input, config, "return");
  }

  receiveCustomerDispute(
    input: RefundDisputeWorkerInput,
    config: RefundDisputeWorkerConfiguration,
  ) {
    return this.receiveCase("receive_customer_dispute", input, config, "customer_dispute");
  }

  classifyCaseType(input: RefundDisputeWorkerInput, config: RefundDisputeWorkerConfiguration) {
    return this.runCase("classify_case_type", input, config);
  }

  validateAgainstPolicies(
    input: RefundDisputeWorkerInput,
    config: RefundDisputeWorkerConfiguration,
  ) {
    return this.runCase("validate_against_policies", input, config);
  }

  trackCaseStatus(input: RefundDisputeWorkerInput, config: RefundDisputeWorkerConfiguration) {
    return this.runCase("track_case_status", input, config);
  }

  coordinateWithSupplier(
    input: RefundDisputeWorkerInput,
    config: RefundDisputeWorkerConfiguration,
  ) {
    return this.runCase("coordinate_with_supplier", {
      ...input,
      requireSupplierCoordination: input.requireSupplierCoordination ?? true,
    }, config);
  }

  generateCustomerCommunications(
    input: RefundDisputeWorkerInput,
    config: RefundDisputeWorkerConfiguration,
  ) {
    return this.runCase("generate_customer_communications", input, config);
  }

  escalateExceptionalCases(
    input: RefundDisputeWorkerInput,
    config: RefundDisputeWorkerConfiguration,
  ) {
    return this.runCase("escalate_exceptional_cases", input, config);
  }

  recordFinalOutcome(input: RefundDisputeWorkerInput, config: RefundDisputeWorkerConfiguration) {
    return this.runCase("record_final_outcome", input, config, true);
  }

  produceReport(input: RefundDisputeWorkerInput, config: RefundDisputeWorkerConfiguration) {
    return this.runCase("produce_report", input, config);
  }

  submitFindings(input: RefundDisputeWorkerInput, config: RefundDisputeWorkerConfiguration) {
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

    let reports = this.store.list();
    if (input.caseId) {
      const one = this.store.get(input.caseId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runCase("produce_report", input, config);
      reports = generated.cases;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }

    const submission = this.integrations.submitFindings(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) =>
          this.store.markSubmitted(r.caseId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateReports(
      reports.length ? reports : null,
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (!submission.submitted) validation.warnings.push(submission.details);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    appendRdwLog({
      event: "submit_findings",
      details: `reports=${reports.length} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_findings",
      this.getCatalog(),
      reports,
      latest,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: RefundDisputeWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateReports(
      reports.length ? reports : null,
      { validated: true },
      started,
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
    );
    return this.report("list", this.getCatalog(), reports, latest, validation, started);
  }

  validate(input: RefundDisputeWorkerInput, config: RefundDisputeWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateReports(
      reports.length ? reports : null,
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
    return this.report("validate", this.getCatalog(), reports, latest, validation, started);
  }

  diagnostics(config: RefundDisputeWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Refund & Dispute Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendRdwLog({ event: "diagnostics", details: `cases=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private receiveCase(
    action: RefundDisputeWorkerRunReport["action"],
    input: RefundDisputeWorkerInput,
    config: RefundDisputeWorkerConfiguration,
    receiveHint: CaseType,
  ): RefundDisputeWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }
    const withType: RefundDisputeWorkerInput = {
      ...input,
      caseType: input.caseType ?? input.caseRequest?.caseType ?? receiveHint,
    };
    const enriched = this.integrations.enrichFromOrders(withType);
    const pulled = this.integrations.pullCaseContext(enriched);
    const caseRequest = pulled.caseRequest ?? this.builder.resolveCase(enriched);
    if (!caseRequest.orderId?.trim() && !caseRequest.customerId?.trim()) {
      return this.disabled(
        action,
        config,
        "No case request received — provide caseRequest / orderId or customerId, or bind Order Worker",
      );
    }
    caseRequest.caseType = caseRequest.caseType ?? receiveHint;
    this.pendingCase = caseRequest;
    this.pendingContext = enriched;
    this.pendingReceiveHint = receiveHint;
    const validation = this.validator.finalize(
      "pass",
      [],
      [
        `Received ${receiveHint} case for ${caseRequest.orderId ?? caseRequest.customerId}`,
      ],
      started,
    );
    this.ensureRecord("active", config, "partial");
    appendRdwLog({
      event: action,
      details: `order=${caseRequest.orderId ?? caseRequest.customerId} type=${receiveHint}`,
    });
    return this.report(
      action,
      this.getCatalog(),
      [],
      null,
      { ...validation, decision: "partial" },
      started,
    );
  }

  private runCase(
    action: RefundDisputeWorkerRunReport["action"],
    input: RefundDisputeWorkerInput,
    config: RefundDisputeWorkerConfiguration,
    recordFinal = false,
  ): RefundDisputeWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.caseRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Refund & Dispute Worker is disabled"
          : "Case rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    const enriched = this.integrations.enrichFromOrders({
      ...this.pendingContext,
      ...input,
      caseRequest: {
        ...(this.pendingCase ?? {}),
        ...(input.caseRequest ?? {}),
      },
    });
    const pulled = this.integrations.pullCaseContext(enriched);
    const caseRequest = pulled.caseRequest ?? this.builder.resolveCase(enriched);
    if (!caseRequest.orderId?.trim() && !caseRequest.customerId?.trim()) {
      return this.disabled(
        action,
        config,
        "Case requires orderId or customerId (caseRequest / order enrichment)",
      );
    }
    this.pendingCase = caseRequest;
    this.pendingContext = enriched;

    const report = this.builder.buildReport(
      enriched,
      config,
      caseRequest,
      pulled.order,
      this.pendingReceiveHint,
      recordFinal || action === "record_final_outcome",
    );
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateReports(
      [report],
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      report,
    );
    appendRdwLog({
      event: action,
      details: `case=${report.caseId} type=${report.caseType} status=${report.currentStatus} decision=${report.policyEvaluation.decision}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: RefundDisputeWorkerRunReport["action"],
    input: RefundDisputeWorkerInput,
    config: RefundDisputeWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: RefundDisputeWorkerRunReport["action"],
    config: RefundDisputeWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: RefundDisputeWorkerInput) {
    return (
      input.modifyFinancialLedgers === true ||
      input.overrideMarketplacePolicies === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ313OrLater === true ||
      input.authorizeOutsideAuthorityMatrix === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: RefundDisputeWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: RefundDisputeReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `rdw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: REFUND_DISPUTE_WORKER_ID,
      engineVersion: "PILLOW-RDW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...RDW_CAPABILITIES],
      totalCases: this.store.count(),
      lastCaseId: report?.caseId ?? this.store.getLatestCaseId(),
      lastCaseType: report?.caseType ?? null,
      lastCaseStatus: report?.currentStatus ?? null,
      lastConfidenceScore: report?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: RDW_METADATA_VERSION,
    };
  }

  private report(
    action: RefundDisputeWorkerRunReport["action"],
    catalog: RefundDisputeWorkerCatalog | null,
    cases: RefundDisputeReport[],
    latestCase: RefundDisputeReport | null,
    validation: RefundDisputeWorkerRunReport["validation"],
    started: number,
  ): RefundDisputeWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      caseRunReportId: `rdw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      cases,
      latestCase,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: RDW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: RefundDisputeWorkerCatalog): RefundDisputeWorkerCatalog {
  return {
    ...catalog,
    cases: catalog.cases.map((report) => ({
      ...report,
      actionsTaken: report.actionsTaken.map((a) => ({ ...a })),
      customerCommunications: report.customerCommunications.map((c) => ({ ...c })),
      escalations: report.escalations.map((e) => ({ ...e })),
      supplierCoordination: report.supplierCoordination.map((s) => ({ ...s })),
      caseHistory: report.caseHistory.map((h) => ({ ...h })),
      supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
      policyEvaluation: {
        ...report.policyEvaluation,
        marketplaceRuleRefs: [...report.policyEvaluation.marketplaceRuleRefs],
      },
      resolution: { ...report.resolution },
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
