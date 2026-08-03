import type { MarketResearchWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type MarketResearchWorkerDependencies,
} from "./integrations.js";
import { appendMrwLog } from "./mrw-logging.js";
import {
  INTEGRATION_TARGETS,
  MARKET_RESEARCH_WORKER_ID,
  MRW_CAPABILITIES,
  MRW_METADATA_VERSION,
} from "./paths.js";
import { ResearchBuilder } from "./research-builder.js";
import { ResearchStore } from "./research-store.js";
import { HealthMonitor, RecoveryManager, ResearchValidator } from "./research-validator.js";
import type {
  IntegrationHandshake,
  MarketResearchReport,
  MarketResearchWorkerCatalog,
  MarketResearchWorkerEngineRecord,
  MarketResearchWorkerInput,
  MarketResearchWorkerRunReport,
  OperationalState,
} from "./types.js";

export class ResearchManager {
  private engineRecord: MarketResearchWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: MarketResearchWorkerCatalog | null = null;
  private readonly store = new ResearchStore();
  private readonly builder = new ResearchBuilder();
  private readonly validator = new ResearchValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];

  bindIntegrations(deps: MarketResearchWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: MarketResearchWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedReports);
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

  getReports() {
    return this.store.list();
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
    config: MarketResearchWorkerConfiguration,
  ): MarketResearchWorkerRunReport {
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
    appendMrwLog({
      event: "connect",
      details: `Market Research Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `mrw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Market Research Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: MRW_METADATA_VERSION,
      },
      started,
    );
  }

  researchDemand(input: MarketResearchWorkerInput, config: MarketResearchWorkerConfiguration) {
    return this.runResearch("research_demand", input, config);
  }

  analyseCompetitors(
    input: MarketResearchWorkerInput,
    config: MarketResearchWorkerConfiguration,
  ) {
    return this.runResearch("analyse_competitors", input, config);
  }

  analyseCustomerProblems(
    input: MarketResearchWorkerInput,
    config: MarketResearchWorkerConfiguration,
  ) {
    return this.runResearch("analyse_customer_problems", input, config);
  }

  estimateOpportunity(
    input: MarketResearchWorkerInput,
    config: MarketResearchWorkerConfiguration,
  ) {
    return this.runResearch("estimate_opportunity", input, config);
  }

  identifyRisks(input: MarketResearchWorkerInput, config: MarketResearchWorkerConfiguration) {
    return this.runResearch("identify_risks", input, config);
  }

  produceReport(input: MarketResearchWorkerInput, config: MarketResearchWorkerConfiguration) {
    return this.runResearch("produce_report", input, config);
  }

  submitFindings(input: MarketResearchWorkerInput, config: MarketResearchWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("submit_findings", input, config, started);
    if (!config.executiveReportingEnabled) {
      return this.disabled(
        "submit_findings",
        config,
        "Executive reporting submission is disabled",
      );
    }

    let report =
      (input.reportId ? this.store.get(input.reportId) : null) ??
      this.store.list().at(-1) ??
      null;
    if (!report) {
      const generated = this.runResearch("produce_report", input, config);
      report = generated.latestReport;
      if (!report || generated.validation.decision === "fail") return generated;
    }

    const submission = this.integrations.submitFindings(report);
    if (submission.submitted && submission.executiveReportId) {
      report = this.store.markSubmitted(report.reportId, submission.executiveReportId) ?? report;
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
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
    );
    appendMrwLog({
      event: "submit_findings",
      details: `report=${report?.reportId ?? "none"} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_findings",
      this.getCatalog(),
      report ? [report] : [],
      report,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: MarketResearchWorkerConfiguration) {
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

  validate(input: MarketResearchWorkerInput, config: MarketResearchWorkerConfiguration) {
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

  diagnostics(config: MarketResearchWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Market Research Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendMrwLog({ event: "diagnostics", details: `reports=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runResearch(
    action: MarketResearchWorkerRunReport["action"],
    input: MarketResearchWorkerInput,
    config: MarketResearchWorkerConfiguration,
  ): MarketResearchWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.researchRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Market Research Worker is disabled"
          : "Research rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);

    if (
      !input.businessType &&
      !input.businessIdea &&
      !input.originalCommand &&
      !input.targetMarket
    ) {
      return this.disabled(
        action,
        config,
        "Research requires businessType, businessIdea, originalCommand, or targetMarket",
      );
    }

    const report = this.builder.research(input, config);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
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
    );
    appendMrwLog({
      event: action,
      details: `report=${report.reportId} demand=${report.marketDemand.demandLevel} opportunity=${report.opportunitySize.opportunityLevel} confidence=${report.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: MarketResearchWorkerRunReport["action"],
    input: MarketResearchWorkerInput,
    config: MarketResearchWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: MarketResearchWorkerRunReport["action"],
    config: MarketResearchWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: MarketResearchWorkerInput) {
    return (
      input.decideWhetherToBuild === true ||
      input.generateBranding === true ||
      input.buildMarketingPlan === true ||
      input.launchBusiness === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ205OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: MarketResearchWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: MarketResearchReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `mrw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: MARKET_RESEARCH_WORKER_ID,
      engineVersion: "PILLOW-MRW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...MRW_CAPABILITIES],
      totalReports: this.store.count(),
      lastBusinessType: report?.businessType ?? null,
      lastReportId: report?.reportId ?? this.store.getLatestReportId(),
      lastConfidenceScore: report?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: MRW_METADATA_VERSION,
    };
  }

  private report(
    action: MarketResearchWorkerRunReport["action"],
    catalog: MarketResearchWorkerCatalog | null,
    reports: MarketResearchReport[],
    latestReport: MarketResearchReport | null,
    validation: MarketResearchWorkerRunReport["validation"],
    started: number,
  ): MarketResearchWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      researchRunReportId: `mrw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      reports,
      latestReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: MRW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: MarketResearchWorkerCatalog): MarketResearchWorkerCatalog {
  return {
    ...catalog,
    reports: catalog.reports.map((report) => ({
      ...report,
      customerProblems: [...report.customerProblems],
      customerSegments: [...report.customerSegments],
      industryTrends: [...report.industryTrends],
      barriersToEntry: [...report.barriersToEntry],
      recommendations: [...report.recommendations],
      missingInformation: [...report.missingInformation],
      facts: [...report.facts],
      assumptions: [...report.assumptions],
      supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
      competitorAnalysis: report.competitorAnalysis.map((c) => ({
        ...c,
        strengths: [...c.strengths],
        weaknesses: [...c.weaknesses],
      })),
      risks: report.risks.map((r) => ({ ...r })),
      marketDemand: {
        ...report.marketDemand,
        demandSignals: [...report.marketDemand.demandSignals],
        facts: [...report.marketDemand.facts],
        assumptions: [...report.marketDemand.assumptions],
      },
      marketSize: {
        ...report.marketSize,
        facts: [...report.marketSize.facts],
        assumptions: [...report.marketSize.assumptions],
      },
      opportunitySize: {
        ...report.opportunitySize,
        facts: [...report.opportunitySize.facts],
        assumptions: [...report.opportunitySize.assumptions],
      },
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
