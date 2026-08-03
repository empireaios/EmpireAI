import type { LocalMarketResearchReport } from "../local-market-research-worker/types.js";
import type { ServiceOfferWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type ServiceOfferWorkerDependencies,
} from "./integrations.js";
import { hasPricingEvidence, OfferBuilder } from "./offer-builder.js";
import { OfferStore } from "./offer-store.js";
import { HealthMonitor, OfferValidator, RecoveryManager } from "./offer-validator.js";
import {
  INTEGRATION_TARGETS,
  SERVICE_OFFER_WORKER_ID,
  SOW_CAPABILITIES,
  SOW_METADATA_VERSION,
} from "./paths.js";
import { appendSowLog } from "./sow-logging.js";
import type {
  IntegrationHandshake,
  OfferSession,
  OperationalState,
  ResearchFixture,
  ServiceOfferInput,
  ServiceOfferReport,
  ServiceOfferWorkerCatalog,
  ServiceOfferWorkerEngineRecord,
  ServiceOfferWorkerRunReport,
} from "./types.js";

export class OfferManager {
  private engineRecord: ServiceOfferWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: ServiceOfferWorkerCatalog | null = null;
  private readonly store = new OfferStore();
  private readonly builder = new OfferBuilder();
  private readonly validator = new OfferValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];

  bindIntegrations(deps: ServiceOfferWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: ServiceOfferWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedReports);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listReports(),
      this.store.listSessions(),
      this.handshakes,
    );
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

  getReports() {
    return this.store.listReports();
  }

  getSessions() {
    return this.store.listSessions();
  }

  getLatestReportId() {
    return this.store.getLatestReportId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: ServiceOfferWorkerConfiguration,
  ): ServiceOfferWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length
        ? config.integrationTargets
        : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listReports(),
      this.store.listSessions(),
      this.handshakes,
    );
    this.ensureRecord("connected", config);
    appendSowLog({
      event: "connect",
      details: `Service Offer Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      [],
      null,
      null,
      {
        validationReportId: `sow-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Service Offer Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: SOW_METADATA_VERSION,
      },
      started,
    );
  }

  consumeMarketResearch(input: ServiceOfferInput, config: ServiceOfferWorkerConfiguration) {
    return this.runSessionStage("consume_market_research", input, config, (session) => ({
      ...session,
      status: "open" as const,
    }));
  }

  defineServiceCatalogue(input: ServiceOfferInput, config: ServiceOfferWorkerConfiguration) {
    return this.runSessionStage("define_service_catalogue", input, config, (session) =>
      this.builder.applyCatalogue(session, config),
    );
  }

  defineServicePackages(input: ServiceOfferInput, config: ServiceOfferWorkerConfiguration) {
    return this.runSessionStage("define_service_packages", input, config, (session) =>
      this.builder.applyPackages(session, config),
    );
  }

  recommendPricingStructure(input: ServiceOfferInput, config: ServiceOfferWorkerConfiguration) {
    return this.runSessionStage("recommend_pricing_structure", input, config, (session) =>
      this.builder.applyPricing(session, config),
    );
  }

  definePackageInclusions(input: ServiceOfferInput, config: ServiceOfferWorkerConfiguration) {
    return this.runSessionStage("define_package_inclusions", input, config, (session) =>
      this.builder.applyInclusions(session, config),
    );
  }

  definePackageExclusions(input: ServiceOfferInput, config: ServiceOfferWorkerConfiguration) {
    return this.runSessionStage("define_package_exclusions", input, config, (session) =>
      this.builder.applyExclusions(session, config),
    );
  }

  defineGuarantees(input: ServiceOfferInput, config: ServiceOfferWorkerConfiguration) {
    return this.runSessionStage("define_guarantees", input, config, (session) =>
      this.builder.applyGuarantees(session, config),
    );
  }

  defineFulfilmentRequirements(
    input: ServiceOfferInput,
    config: ServiceOfferWorkerConfiguration,
  ) {
    return this.runSessionStage("define_fulfilment_requirements", input, config, (session) =>
      this.builder.applyFulfilment(session, config),
    );
  }

  defineRequiredResources(input: ServiceOfferInput, config: ServiceOfferWorkerConfiguration) {
    return this.runSessionStage("define_required_resources", input, config, (session) =>
      this.builder.applyFulfilment(session, config),
    );
  }

  produceReport(input: ServiceOfferInput, config: ServiceOfferWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.offerRulesEnabled) {
      return this.disabled(
        "produce_report",
        config,
        !config.enabled
          ? "Service Offer Worker is disabled"
          : "Offer rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("produce_report", input, config, started);
    }

    const resolved = this.resolveResearch(input);
    if (!resolved.research) {
      const validation = this.validator.validateInput(input, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(
        "produce_report",
        this.getCatalog(),
        [],
        [],
        null,
        null,
        validation,
        started,
      );
    }

    let session = this.resolveOrCreateSession(input, resolved.research, resolved.source);
    if (!session) {
      return this.boundaryFail("produce_report", input, config, started);
    }

    const report = this.builder.assembleReport(session, config);
    session = {
      ...session,
      status: "reported",
      updatedAt: report.timestamp,
      serviceCatalogue: report.serviceCatalogue,
      servicePackages: report.servicePackages,
      pricingRecommendations: report.pricingRecommendations,
      packageInclusions: report.packageInclusions,
      packageExclusions: report.packageExclusions,
      guarantees: report.guarantees,
      fulfilmentRequirements: report.fulfilmentRequirements,
      operationalAssumptions: report.operationalAssumptions,
      risks: report.risks,
      outstandingQuestions: report.outstandingQuestions,
    };
    this.store.saveSession(session, "produce_report");
    this.store.saveReport(report, "produce_report");
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listReports(),
      this.store.listSessions(),
      this.handshakes,
    );
    const validation = this.validator.validateReports(
      [report],
      { ...input, validated: input.validated ?? true },
      started,
    );
    if (!session.pricingEvidenceAvailable && validation.decision === "pass") {
      validation.decision = "partial";
      validation.warnings.push(
        "Q7-02 pricing findings incomplete — assumptions/unknowns recorded; never fabricated",
      );
    }
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      report,
      session,
    );
    appendSowLog({
      event: "produce_report",
      details: `report=${report.reportId} confidence=${report.confidenceScore}`,
    });
    return this.report(
      "produce_report",
      this.getCatalog(),
      [report],
      [session],
      report,
      session,
      validation,
      started,
    );
  }

  submitReport(input: ServiceOfferInput, config: ServiceOfferWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled(
        "submit_report",
        config,
        "Executive reporting submission is disabled",
      );
    }

    let report =
      (input.reportId ? this.store.getReport(input.reportId) : null) ??
      (input.offerId ? this.store.getReport(input.offerId) : null) ??
      this.store.listReports().at(-1) ??
      null;
    if (!report) {
      const generated = this.produceReport(input, config);
      report = generated.latestReport;
      if (!report || generated.validation.decision === "fail") return generated;
    }

    const submission = this.integrations.submitReport(report);
    if (submission.submitted && submission.executiveReportId) {
      report = this.store.markSubmitted(report.reportId, submission.executiveReportId) ?? report;
    }
    const session = this.store.getSession(report.reportId);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listReports(),
      this.store.listSessions(),
      this.handshakes,
    );
    const validation = this.validator.validateReports(
      report ? [report] : null,
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
      report,
      session,
    );
    appendSowLog({
      event: "submit_report",
      details: `report=${report?.reportId ?? "none"} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_report",
      this.getCatalog(),
      report ? [report] : [],
      session ? [session] : [],
      report,
      session,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: ServiceOfferWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listReports(),
      this.store.listSessions(),
      this.handshakes,
    );
    const reports = this.store.listReports();
    const sessions = this.store.listSessions();
    const latest = reports[reports.length - 1] ?? null;
    const latestSession = sessions[sessions.length - 1] ?? null;
    const validation = this.validator.validateReports(
      reports.length ? reports : null,
      { validated: true },
      started,
      { allowIncompleteReport: !reports.length },
    );
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
      latestSession,
    );
    return this.report(
      "list",
      this.getCatalog(),
      reports,
      sessions,
      latest,
      latestSession,
      validation,
      started,
    );
  }

  validate(input: ServiceOfferInput, config: ServiceOfferWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listReports(),
      this.store.listSessions(),
      this.handshakes,
    );
    const reports = this.store.listReports();
    const sessions = this.store.listSessions();
    const latest = reports[reports.length - 1] ?? null;
    const latestSession = sessions[sessions.length - 1] ?? null;
    const validation =
      Object.keys(input).length && !reports.length
        ? this.validator.validateInput(input, started)
        : this.validator.validateReports(
            reports.length ? reports : null,
            { ...input, validated: input.validated ?? true },
            started,
            { allowIncompleteReport: !reports.length },
          );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      latest,
      latestSession,
    );
    return this.report(
      "validate",
      this.getCatalog(),
      reports,
      sessions,
      latest,
      latestSession,
      validation,
      started,
    );
  }

  diagnostics(config: ServiceOfferWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listReports(),
      this.store.listSessions(),
      this.handshakes,
    );
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Service Offer Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendSowLog({
      event: "diagnostics",
      details: `reports=${this.store.reportCount()} sessions=${this.store.sessionCount()}`,
    });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.listReports(),
      this.store.listSessions(),
      null,
      null,
      validation,
      started,
    );
  }

  private runSessionStage(
    action: ServiceOfferWorkerRunReport["action"],
    input: ServiceOfferInput,
    config: ServiceOfferWorkerConfiguration,
    mutate: (session: OfferSession) => OfferSession,
  ): ServiceOfferWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.offerRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Service Offer Worker is disabled"
          : "Offer rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail(action, input, config, started);
    }

    const resolved = this.resolveResearch(input);
    if (!resolved.research && action === "consume_market_research") {
      const validation = this.validator.validateInput(input, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], [], null, null, validation, started);
    }
    if (!resolved.research && !input.offerId && !input.reportId) {
      const validation = this.validator.validateInput(input, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], [], null, null, validation, started);
    }

    let session = this.resolveOrCreateSession(
      input,
      resolved.research,
      resolved.source,
    );
    if (!session || !session.marketResearch) {
      const validation = this.validator.validateResearchPresence(session, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], [], null, null, validation, started);
    }

    session = mutate(session);
    session = this.store.saveSession(session, action);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listReports(),
      this.store.listSessions(),
      this.handshakes,
    );
    const validation = this.validator.validateResearchPresence(session, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      null,
      session,
    );
    appendSowLog({
      event: action,
      details: `offer=${session.offerId} status=${session.status}`,
    });
    return this.report(
      action,
      this.getCatalog(),
      [],
      [session],
      null,
      session,
      validation,
      started,
    );
  }

  private resolveResearch(input: ServiceOfferInput): {
    research: LocalMarketResearchReport | ResearchFixture | null;
    source: OfferSession["researchSource"];
  } {
    if (input.marketResearchReport) {
      return { research: input.marketResearchReport, source: "marketResearchReport" };
    }
    if (input.fixtureMarketResearch) {
      return { research: input.fixtureMarketResearch, source: "fixtureMarketResearch" };
    }
    if (input.researchId?.trim()) {
      const fromDep = this.integrations.resolveMarketResearchById(input.researchId.trim());
      if (fromDep) return { research: fromDep, source: "researchId" };
    }
    return { research: null, source: "none" };
  }

  private resolveOrCreateSession(
    input: ServiceOfferInput,
    research: LocalMarketResearchReport | ResearchFixture | null,
    researchSource: OfferSession["researchSource"],
  ): OfferSession | null {
    const existingId = input.reportId?.trim() || input.offerId?.trim();
    if (existingId) {
      const existing = this.store.getSession(existingId);
      if (existing) {
        return {
          ...existing,
          input: { ...existing.input, ...input },
          marketResearch: research ?? existing.marketResearch,
          researchSource:
            researchSource !== "none" ? researchSource : existing.researchSource,
          sourceResearchId:
            (research && "researchId" in research && research.researchId) ||
            input.researchId ||
            existing.sourceResearchId,
          pricingEvidenceAvailable: research
            ? hasPricingEvidence(research)
            : existing.pricingEvidenceAvailable,
        };
      }
    }
    if (!research) return null;
    const created = this.builder.createSession(input, research, researchSource);
    return this.store.saveSession(created, "create_session");
  }

  private boundaryFail(
    action: ServiceOfferWorkerRunReport["action"],
    input: ServiceOfferInput,
    config: ServiceOfferWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateInput(
      {
        ...input,
        // ensure boundary errors surface even when research keys absent
        fixtureMarketResearch: input.fixtureMarketResearch ?? { researchId: "boundary-check" },
      },
      started,
    );
    // Re-validate to push boundary-only errors without requiring research when boundary violated
    const boundaryOnly = this.validator.finalize(
      "fail",
      this.validator.hasBoundaryViolation(input)
        ? this.collectBoundaryErrors(input)
        : validation.errors,
      [],
      started,
    );
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], [], null, null, boundaryOnly, started);
  }

  private collectBoundaryErrors(input: ServiceOfferInput): string[] {
    const report = this.validator.validateInput(
      {
        ...input,
        fixtureMarketResearch: input.fixtureMarketResearch ?? { researchId: "x" },
      },
      Date.now(),
    );
    return report.errors.filter(
      (e) =>
        e.includes("must never") ||
        e.includes("rejects forbidden") ||
        e.includes("fabricate"),
    );
  }

  private disabled(
    action: ServiceOfferWorkerRunReport["action"],
    config: ServiceOfferWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], [], null, null, validation, started);
  }

  private ensureRecord(
    state: OperationalState,
    config: ServiceOfferWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: ServiceOfferReport | null = null,
    latestSession: OfferSession | null = null,
  ) {
    const report = latest ?? this.store.listReports().at(-1) ?? null;
    const session = latestSession ?? this.store.listSessions().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `sow-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: SERVICE_OFFER_WORKER_ID,
      engineVersion: "PILLOW-SOW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...SOW_CAPABILITIES],
      totalReports: this.store.reportCount(),
      totalSessions: this.store.sessionCount(),
      lastServiceCategory:
        session?.input.serviceCategory ??
        (session?.marketResearch && "serviceCategory" in session.marketResearch
          ? session.marketResearch.serviceCategory
          : null) ??
        null,
      lastReportId: report?.reportId ?? session?.offerId ?? this.store.getLatestReportId(),
      lastConfidenceScore: report?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: SOW_METADATA_VERSION,
    };
  }

  private report(
    action: ServiceOfferWorkerRunReport["action"],
    catalog: ServiceOfferWorkerCatalog | null,
    reports: ServiceOfferReport[],
    sessions: OfferSession[],
    latestReport: ServiceOfferReport | null,
    latestSession: OfferSession | null,
    validation: ServiceOfferWorkerRunReport["validation"],
    started: number,
  ): ServiceOfferWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      offerRunReportId: `sow-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      reports,
      sessions,
      latestReport,
      latestSession,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: SOW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: ServiceOfferWorkerCatalog): ServiceOfferWorkerCatalog {
  return {
    ...catalog,
    reports: catalog.reports.map((r) => ({ ...r })),
    sessions: catalog.sessions.map((s) => ({ ...s })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
