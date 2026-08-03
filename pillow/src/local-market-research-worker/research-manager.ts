import type { LocalMarketResearchWorkerConfiguration } from "./configuration.js";
import {
  normalizeFixturePayload,
  resolveFixtureFromInput,
} from "./evidence-adapters.js";
import {
  IntegrationCoordinator,
  type LocalMarketResearchWorkerDependencies,
} from "./integrations.js";
import { appendLmrwLog } from "./lmrw-logging.js";
import {
  INTEGRATION_TARGETS,
  LOCAL_MARKET_RESEARCH_WORKER_ID,
  LMRW_CAPABILITIES,
  LMRW_METADATA_VERSION,
} from "./paths.js";
import { ResearchBuilder } from "./research-builder.js";
import { ResearchStore } from "./research-store.js";
import { HealthMonitor, RecoveryManager, ResearchValidator } from "./research-validator.js";
import type {
  IntegrationHandshake,
  LocalMarketResearchInput,
  LocalMarketResearchReport,
  LocalMarketResearchWorkerCatalog,
  LocalMarketResearchWorkerEngineRecord,
  LocalMarketResearchWorkerRunReport,
  OperationalState,
  ResearchFixturePayload,
  ResearchSession,
} from "./types.js";

export class ResearchManager {
  private engineRecord: LocalMarketResearchWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: LocalMarketResearchWorkerCatalog | null = null;
  private readonly store = new ResearchStore();
  private readonly builder = new ResearchBuilder();
  private readonly validator = new ResearchValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];

  bindIntegrations(deps: LocalMarketResearchWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: LocalMarketResearchWorkerConfiguration) {
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

  getLatestResearchId() {
    return this.store.getLatestResearchId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: LocalMarketResearchWorkerConfiguration,
  ): LocalMarketResearchWorkerRunReport {
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
    appendLmrwLog({
      event: "connect",
      details: `Local Market Research Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      [],
      null,
      null,
      {
        validationReportId: `lmrw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Local Market Research Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: LMRW_METADATA_VERSION,
      },
      started,
    );
  }

  submitResearchRequest(
    input: LocalMarketResearchInput,
    config: LocalMarketResearchWorkerConfiguration,
  ) {
    return this.runSessionStage("submit_research_request", input, config, (session, fixture) => {
      void fixture;
      return { ...session, status: "open" as const };
    });
  }

  researchLocalDemand(
    input: LocalMarketResearchInput,
    config: LocalMarketResearchWorkerConfiguration,
  ) {
    return this.runSessionStage("research_local_demand", input, config, (session, fixture) =>
      this.builder.applyDemand(session, fixture),
    );
  }

  identifyCustomerSegments(
    input: LocalMarketResearchInput,
    config: LocalMarketResearchWorkerConfiguration,
  ) {
    return this.runSessionStage("identify_customer_segments", input, config, (session, fixture) =>
      this.builder.applySegments(session, fixture),
    );
  }

  researchCompetitors(
    input: LocalMarketResearchInput,
    config: LocalMarketResearchWorkerConfiguration,
  ) {
    return this.runSessionStage("research_competitors", input, config, (session, fixture) =>
      this.builder.applyCompetitors(session, fixture),
    );
  }

  profileCompetitors(
    input: LocalMarketResearchInput,
    config: LocalMarketResearchWorkerConfiguration,
  ) {
    return this.runSessionStage("profile_competitors", input, config, (session, fixture) =>
      this.builder.applyCompetitors(session, fixture),
    );
  }

  researchCompetitorServices(
    input: LocalMarketResearchInput,
    config: LocalMarketResearchWorkerConfiguration,
  ) {
    return this.runSessionStage(
      "research_competitor_services",
      input,
      config,
      (session, fixture) => this.builder.applyCompetitorServices(session, fixture),
    );
  }

  researchMarketPricing(
    input: LocalMarketResearchInput,
    config: LocalMarketResearchWorkerConfiguration,
  ) {
    return this.runSessionStage("research_market_pricing", input, config, (session, fixture) =>
      this.builder.applyPricing(session, fixture),
    );
  }

  identifyPainPoints(
    input: LocalMarketResearchInput,
    config: LocalMarketResearchWorkerConfiguration,
  ) {
    return this.runSessionStage("identify_pain_points", input, config, (session, fixture) =>
      this.builder.applyPainPoints(session, fixture),
    );
  }

  identifyServiceGaps(
    input: LocalMarketResearchInput,
    config: LocalMarketResearchWorkerConfiguration,
  ) {
    return this.runSessionStage("identify_service_gaps", input, config, (session, fixture) =>
      this.builder.applyGaps(session, fixture),
    );
  }

  analyzeServiceOpportunities(
    input: LocalMarketResearchInput,
    config: LocalMarketResearchWorkerConfiguration,
  ) {
    return this.runSessionStage(
      "analyze_service_opportunities",
      input,
      config,
      (session, fixture) => this.builder.applyOpportunities(session, fixture),
    );
  }

  assessMarketAttractiveness(
    input: LocalMarketResearchInput,
    config: LocalMarketResearchWorkerConfiguration,
  ) {
    return this.runSessionStage(
      "assess_market_attractiveness",
      input,
      config,
      (session, fixture) => this.builder.applyAttractiveness(session, fixture),
    );
  }

  produceReport(
    input: LocalMarketResearchInput,
    config: LocalMarketResearchWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.researchRulesEnabled) {
      return this.disabled(
        "produce_report",
        config,
        !config.enabled
          ? "Local Market Research Worker is disabled"
          : "Research rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail("produce_report", input, config, started);
    }
    if (!this.validator.hasRequiredLocationCategory(input) && !input.researchId) {
      return this.boundaryFail("produce_report", input, config, started);
    }

    const fixture = this.resolveFixture(input);
    let session = this.resolveOrCreateSession(input, fixture, config);
    if (!session) {
      return this.boundaryFail("produce_report", input, config, started);
    }
    const report = this.builder.assembleReport(session, config, fixture);
    session = {
      ...session,
      status: "reported",
      updatedAt: report.timestamp,
      demandFindings: report.demandFindings,
      competitorProfiles: report.competitorProfiles,
      pricingFindings: report.pricingFindings,
      customerPainPoints: report.customerPainPoints,
      serviceGaps: report.serviceGaps,
      opportunityFindings: report.opportunityFindings,
      marketAttractivenessAssessment: report.marketAttractivenessAssessment,
      customerSegments: report.customerSegments,
      evidenceSources: report.evidenceSources,
      risks: report.risks,
      assumptions: report.assumptions,
      unknowns: report.unknowns,
      evidenceMode: report.evidenceMode,
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
    appendLmrwLog({
      event: "produce_report",
      details: `research=${report.researchId} confidence=${report.confidenceScore}`,
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

  submitReport(
    input: LocalMarketResearchInput,
    config: LocalMarketResearchWorkerConfiguration,
  ) {
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
      (input.researchId ? this.store.getReport(input.researchId) : null) ??
      this.store.listReports().at(-1) ??
      null;
    if (!report) {
      const generated = this.produceReport(input, config);
      report = generated.latestReport;
      if (!report || generated.validation.decision === "fail") return generated;
    }

    const submission = this.integrations.submitReport(report);
    if (submission.submitted && submission.executiveReportId) {
      report = this.store.markSubmitted(report.researchId, submission.executiveReportId) ?? report;
    }
    const session = this.store.getSession(report.researchId);
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
    appendLmrwLog({
      event: "submit_report",
      details: `report=${report?.researchId ?? "none"} submitted=${submission.submitted}`,
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

  list(config: LocalMarketResearchWorkerConfiguration) {
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

  validate(input: LocalMarketResearchInput, config: LocalMarketResearchWorkerConfiguration) {
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

  diagnostics(config: LocalMarketResearchWorkerConfiguration) {
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
      config.enabled ? [] : ["Local Market Research Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendLmrwLog({
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
    action: LocalMarketResearchWorkerRunReport["action"],
    input: LocalMarketResearchInput,
    config: LocalMarketResearchWorkerConfiguration,
    mutate: (
      session: ResearchSession,
      fixture: ResearchFixturePayload | null,
    ) => ResearchSession,
  ): LocalMarketResearchWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.researchRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Local Market Research Worker is disabled"
          : "Research rules are disabled",
      );
    }
    if (this.validator.hasBoundaryViolation(input)) {
      return this.boundaryFail(action, input, config, started);
    }

    const requiresLocation =
      action === "submit_research_request" || !input.researchId;
    if (requiresLocation && !this.validator.hasRequiredLocationCategory(input)) {
      const validation = this.validator.validateInput(input, started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], [], null, null, validation, started);
    }

    const fixture = this.resolveFixture(input);
    let session = this.resolveOrCreateSession(input, fixture, config);
    if (!session) {
      return this.boundaryFail(action, input, config, started);
    }
    session = mutate(session, fixture);
    session = this.store.saveSession(session, action);
    this.catalog = this.builder.buildCatalog(
      config,
      this.store.listReports(),
      this.store.listSessions(),
      this.handshakes,
    );
    const validation = this.validator.validateInput(
      { ...input, ...session.input, validated: input.validated ?? true },
      started,
    );
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      null,
      session,
    );
    appendLmrwLog({
      event: action,
      details: `research=${session.researchId} status=${session.status}`,
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

  private resolveFixture(input: LocalMarketResearchInput): ResearchFixturePayload | null {
    const fromInput = resolveFixtureFromInput(input);
    if (fromInput) return fromInput;
    const external = this.integrations.resolveExternalFixture({
      businessProjectId: input.businessProjectId,
      targetCountry: input.targetCountry,
      targetCity: input.targetCity,
      targetServiceArea: input.targetServiceArea,
      serviceCategory: input.serviceCategory,
      researchId: input.researchId,
    });
    return normalizeFixturePayload(external, "fixture");
  }

  private resolveOrCreateSession(
    input: LocalMarketResearchInput,
    fixture: ResearchFixturePayload | null,
    _config: LocalMarketResearchWorkerConfiguration,
  ): ResearchSession | null {
    if (input.researchId) {
      const existing = this.store.getSession(input.researchId);
      if (existing) {
        return {
          ...existing,
          input: { ...existing.input, ...input },
          fixture: fixture ?? existing.fixture,
        };
      }
    }
    if (!this.validator.hasRequiredLocationCategory(input)) {
      return null;
    }
    const created = this.builder.createSession(input, fixture);
    return this.store.saveSession(created, "create_session");
  }

  private boundaryFail(
    action: LocalMarketResearchWorkerRunReport["action"],
    input: LocalMarketResearchInput,
    config: LocalMarketResearchWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateInput(input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], [], null, null, validation, started);
  }

  private disabled(
    action: LocalMarketResearchWorkerRunReport["action"],
    config: LocalMarketResearchWorkerConfiguration,
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
    config: LocalMarketResearchWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: LocalMarketResearchReport | null = null,
    latestSession: ResearchSession | null = null,
  ) {
    const report = latest ?? this.store.listReports().at(-1) ?? null;
    const session = latestSession ?? this.store.listSessions().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `lmrw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: LOCAL_MARKET_RESEARCH_WORKER_ID,
      engineVersion: "PILLOW-LMRW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...LMRW_CAPABILITIES],
      totalReports: this.store.reportCount(),
      totalSessions: this.store.sessionCount(),
      lastServiceCategory: report?.serviceCategory ?? session?.input.serviceCategory ?? null,
      lastResearchId:
        report?.researchId ?? session?.researchId ?? this.store.getLatestResearchId(),
      lastConfidenceScore: report?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: LMRW_METADATA_VERSION,
    };
  }

  private report(
    action: LocalMarketResearchWorkerRunReport["action"],
    catalog: LocalMarketResearchWorkerCatalog | null,
    reports: LocalMarketResearchReport[],
    sessions: ResearchSession[],
    latestReport: LocalMarketResearchReport | null,
    latestSession: ResearchSession | null,
    validation: LocalMarketResearchWorkerRunReport["validation"],
    started: number,
  ): LocalMarketResearchWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      researchRunReportId: `lmrw-run-${Date.now()}`,
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
      metadataVersion: LMRW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(
  catalog: LocalMarketResearchWorkerCatalog,
): LocalMarketResearchWorkerCatalog {
  return {
    ...catalog,
    reports: catalog.reports.map((r) => ({ ...r })),
    sessions: catalog.sessions.map((s) => ({ ...s })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
