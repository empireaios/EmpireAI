import type { ServiceOfferReport } from "../service-offer-worker/types.js";
import type { LocalSeoWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type LocalSeoWorkerDependencies,
} from "./integrations.js";
import { SeoBuilder } from "./seo-builder.js";
import { SeoStore } from "./seo-store.js";
import { HealthMonitor, RecoveryManager, SeoValidator } from "./seo-validator.js";
import {
  INTEGRATION_TARGETS,
  LOCAL_SEO_WORKER_ID,
  LSEO_CAPABILITIES,
  LSEO_METADATA_VERSION,
} from "./paths.js";
import { appendLseoLog } from "./lseo-logging.js";
import type {
  IntegrationHandshake,
  LocalSeoInput,
  LocalSeoReport,
  LocalSeoWorkerCatalog,
  LocalSeoWorkerEngineRecord,
  LocalSeoWorkerRunReport,
  OperationalState,
  SeoSession,
  ServiceOfferFixture,
} from "./types.js";

export class SeoManager {
  private engineRecord: LocalSeoWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: LocalSeoWorkerCatalog | null = null;
  private readonly store = new SeoStore();
  private readonly builder = new SeoBuilder();
  private readonly validator = new SeoValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];

  bindIntegrations(deps: LocalSeoWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: LocalSeoWorkerConfiguration) {
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

  getLandingPages() {
    return this.store.listLandingPages();
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
    config: LocalSeoWorkerConfiguration,
  ): LocalSeoWorkerRunReport {
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
    appendLseoLog({
      event: "connect",
      details: `Local SEO Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      [],
      null,
      null,
      {
        validationReportId: `lseo-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Local SEO Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: LSEO_METADATA_VERSION,
      },
      started,
    );
  }

  consumeServiceOffer(input: LocalSeoInput, config: LocalSeoWorkerConfiguration) {
    return this.runSessionStage("consume_service_offer", input, config, (session) => ({
      ...session,
      status: "open" as const,
    }));
  }

  generateGoogleBusinessRecommendations(
    input: LocalSeoInput,
    config: LocalSeoWorkerConfiguration,
  ) {
    return this.runSessionStage(
      "generate_google_business_recommendations",
      input,
      config,
      (session) => this.builder.applyGbp(session, config),
    );
  }

  generateLandingPages(input: LocalSeoInput, config: LocalSeoWorkerConfiguration) {
    return this.runSessionStage("generate_landing_pages", input, config, (session) =>
      this.builder.applyLandingPages(session, config),
    );
  }

  generateServicePages(input: LocalSeoInput, config: LocalSeoWorkerConfiguration) {
    return this.runSessionStage("generate_service_pages", input, config, (session) =>
      this.builder.applyServicePages(session, config),
    );
  }

  generateCityAreaPages(input: LocalSeoInput, config: LocalSeoWorkerConfiguration) {
    return this.runSessionStage("generate_city_area_pages", input, config, (session) =>
      this.builder.applyCityAreaPages(session, config),
    );
  }

  generateSeoTitlesAndMeta(input: LocalSeoInput, config: LocalSeoWorkerConfiguration) {
    return this.runSessionStage("generate_seo_titles_and_meta", input, config, (session) =>
      this.builder.applyMetadata(session, config),
    );
  }

  generateStructuredDataRecommendations(
    input: LocalSeoInput,
    config: LocalSeoWorkerConfiguration,
  ) {
    return this.runSessionStage(
      "generate_structured_data_recommendations",
      input,
      config,
      (session) => this.builder.applyStructuredData(session, config),
    );
  }

  generateLocalKeywords(input: LocalSeoInput, config: LocalSeoWorkerConfiguration) {
    return this.runSessionStage("generate_local_keywords", input, config, (session) =>
      this.builder.applyKeywords(session, config),
    );
  }

  generateInternalLinkingRecommendations(
    input: LocalSeoInput,
    config: LocalSeoWorkerConfiguration,
  ) {
    return this.runSessionStage(
      "generate_internal_linking_recommendations",
      input,
      config,
      (session) => this.builder.applyInternalLinks(session, config),
    );
  }

  generateCitationRecommendations(
    input: LocalSeoInput,
    config: LocalSeoWorkerConfiguration,
  ) {
    return this.runSessionStage(
      "generate_citation_recommendations",
      input,
      config,
      (session) => this.builder.applyCitations(session, config),
    );
  }

  evaluateSeoCompleteness(input: LocalSeoInput, config: LocalSeoWorkerConfiguration) {
    return this.runSessionStage("evaluate_seo_completeness", input, config, (session) =>
      this.builder.applyCompleteness(session, config),
    );
  }

  produceReport(input: LocalSeoInput, config: LocalSeoWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.seoRulesEnabled) {
      return this.disabled(
        "produce_report",
        config,
        !config.enabled
          ? "Local SEO Worker is disabled"
          : "SEO rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("produce_report", input, config, started);
    }

    const resolved = this.resolveOffer(input);
    if (!resolved.offer) {
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

    let session = this.resolveOrCreateSession(input, resolved.offer, resolved.source);
    if (!session) {
      return this.boundaryFail("produce_report", input, config, started);
    }

    const report = this.builder.assembleReport(session, config);
    session = {
      ...session,
      status: "reported",
      updatedAt: report.timestamp,
      landingPages: report.landingPagesGenerated,
      googleBusinessRecommendations: report.googleBusinessRecommendations,
      localKeywords: report.localKeywords,
      metadata: report.metadata,
      structuredDataRecommendations: report.structuredDataRecommendations,
      citationRecommendations: report.citationRecommendations,
      internalLinkingRecommendations: report.internalLinkingRecommendations,
      napConsistencyRecommendations: report.napConsistencyRecommendations,
      faqAssets: report.faqAssets,
      completeness: report.seoCompletenessStatus,
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
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      report,
      session,
    );
    appendLseoLog({
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

  submitReport(input: LocalSeoInput, config: LocalSeoWorkerConfiguration) {
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
      (input.seoId ? this.store.getReport(input.seoId) : null) ??
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
    appendLseoLog({
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

  list(config: LocalSeoWorkerConfiguration) {
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

  validate(input: LocalSeoInput, config: LocalSeoWorkerConfiguration) {
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

  diagnostics(config: LocalSeoWorkerConfiguration) {
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
      config.enabled ? [] : ["Local SEO Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendLseoLog({
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
    action: LocalSeoWorkerRunReport["action"],
    input: LocalSeoInput,
    config: LocalSeoWorkerConfiguration,
    mutate: (session: SeoSession) => SeoSession,
  ): LocalSeoWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.seoRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Local SEO Worker is disabled"
          : "SEO rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail(action, input, config, started);
    }

    const resolved = this.resolveOffer(input);
    if (!resolved.offer && action === "consume_service_offer") {
      const validation = this.validator.validateInput(input, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], [], null, null, validation, started);
    }
    if (!resolved.offer && !input.seoId && !input.reportId) {
      const validation = this.validator.validateInput(input, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], [], null, null, validation, started);
    }

    let session = this.resolveOrCreateSession(input, resolved.offer, resolved.source);
    if (!session || !session.serviceOffer) {
      const validation = this.validator.validateOfferPresence(session, started);
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
    const validation = this.validator.validateOfferPresence(session, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      null,
      session,
    );
    appendLseoLog({
      event: action,
      details: `seo=${session.seoId} status=${session.status}`,
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

  private resolveOffer(input: LocalSeoInput): {
    offer: ServiceOfferReport | ServiceOfferFixture | null;
    source: SeoSession["offerSource"];
  } {
    if (input.serviceOfferReport) {
      return { offer: input.serviceOfferReport, source: "serviceOfferReport" };
    }
    if (input.fixtureServiceOffer) {
      return { offer: input.fixtureServiceOffer, source: "fixtureServiceOffer" };
    }
    if (input.offerReportId?.trim()) {
      const fromDep = this.integrations.resolveOfferById(input.offerReportId.trim());
      if (fromDep) return { offer: fromDep, source: "offerReportId" };
    }
    return { offer: null, source: "none" };
  }

  private resolveOrCreateSession(
    input: LocalSeoInput,
    offer: ServiceOfferReport | ServiceOfferFixture | null,
    offerSource: SeoSession["offerSource"],
  ): SeoSession | null {
    const existingId = input.reportId?.trim() || input.seoId?.trim();
    if (existingId) {
      const existing = this.store.getSession(existingId);
      if (existing) {
        return {
          ...existing,
          input: { ...existing.input, ...input },
          serviceOffer: offer ?? existing.serviceOffer,
          offerSource: offerSource !== "none" ? offerSource : existing.offerSource,
          sourceOfferReportId:
            (offer && "reportId" in offer && offer.reportId) ||
            input.offerReportId ||
            existing.sourceOfferReportId,
        };
      }
    }
    if (!offer) return null;
    const created = this.builder.createSession(input, offer, offerSource);
    return this.store.saveSession(created, "create_session");
  }

  private boundaryFail(
    action: LocalSeoWorkerRunReport["action"],
    input: LocalSeoInput,
    config: LocalSeoWorkerConfiguration,
    started: number,
  ) {
    const boundaryOnly = this.validator.finalize(
      "fail",
      this.collectBoundaryErrors(input),
      [],
      started,
    );
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], [], null, null, boundaryOnly, started);
  }

  private collectBoundaryErrors(input: LocalSeoInput): string[] {
    const report = this.validator.validateInput(
      {
        ...input,
        fixtureServiceOffer: input.fixtureServiceOffer ?? { reportId: "x" },
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
    action: LocalSeoWorkerRunReport["action"],
    config: LocalSeoWorkerConfiguration,
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
    config: LocalSeoWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: LocalSeoReport | null = null,
    latestSession: SeoSession | null = null,
  ) {
    const report = latest ?? this.store.listReports().at(-1) ?? null;
    const session = latestSession ?? this.store.listSessions().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `lseo-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: LOCAL_SEO_WORKER_ID,
      engineVersion: "PILLOW-LSEO-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...LSEO_CAPABILITIES],
      totalReports: this.store.reportCount(),
      totalSessions: this.store.sessionCount(),
      lastServiceCategory: session?.serviceCategory ?? null,
      lastReportId: report?.reportId ?? session?.seoId ?? this.store.getLatestReportId(),
      lastConfidenceScore: report?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: LSEO_METADATA_VERSION,
    };
  }

  private report(
    action: LocalSeoWorkerRunReport["action"],
    catalog: LocalSeoWorkerCatalog | null,
    reports: LocalSeoReport[],
    sessions: SeoSession[],
    latestReport: LocalSeoReport | null,
    latestSession: SeoSession | null,
    validation: LocalSeoWorkerRunReport["validation"],
    started: number,
  ): LocalSeoWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      seoRunReportId: `lseo-run-${Date.now()}`,
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
      metadataVersion: LSEO_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: LocalSeoWorkerCatalog): LocalSeoWorkerCatalog {
  return {
    ...catalog,
    reports: catalog.reports.map((r) => ({ ...r })),
    sessions: catalog.sessions.map((s) => ({ ...s })),
    landingPages: catalog.landingPages.map((p) => ({ ...p })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
