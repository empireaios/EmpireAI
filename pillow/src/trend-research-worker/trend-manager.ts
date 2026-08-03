import type { TrendResearchWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type TrendResearchWorkerDependencies,
} from "./integrations.js";
import { appendTrwLog } from "./trw-logging.js";
import {
  INTEGRATION_TARGETS,
  TRW_CAPABILITIES,
  TRW_METADATA_VERSION,
  TREND_RESEARCH_WORKER_ID,
} from "./paths.js";
import { TrendBuilder, focusCategoryForAction } from "./trend-builder.js";
import { TrendStore } from "./trend-store.js";
import { HealthMonitor, RecoveryManager, TrendValidator } from "./trend-validator.js";
import type {
  IntegrationHandshake,
  OperationalState,
  TrendResearchReport,
  TrendResearchWorkerCatalog,
  TrendResearchWorkerEngineRecord,
  TrendResearchWorkerInput,
  TrendResearchWorkerRunReport,
} from "./types.js";

export class TrendManager {
  private engineRecord: TrendResearchWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: TrendResearchWorkerCatalog | null = null;
  private readonly store = new TrendStore();
  private readonly builder = new TrendBuilder();
  private readonly validator = new TrendValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private pendingContext: TrendResearchWorkerInput = {};

  bindIntegrations(deps: TrendResearchWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: TrendResearchWorkerConfiguration) {
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

  getTrendReports() {
    return this.store.list();
  }

  getLatestTrendReportId() {
    return this.store.getLatestTrendReportId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: TrendResearchWorkerConfiguration,
  ): TrendResearchWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendTrwLog({
      event: "connect",
      details: `Trend Research Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `trw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Trend Research Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: TRW_METADATA_VERSION,
      },
      started,
    );
  }

  monitorSearchTrends(input: TrendResearchWorkerInput, config: TrendResearchWorkerConfiguration) {
    return this.runTrend("monitor_search_trends", input, config);
  }

  monitorCompetitorChannels(
    input: TrendResearchWorkerInput,
    config: TrendResearchWorkerConfiguration,
  ) {
    return this.runTrend("monitor_competitor_channels", input, config);
  }

  monitorSocialPlatformTrends(
    input: TrendResearchWorkerInput,
    config: TrendResearchWorkerConfiguration,
  ) {
    return this.runTrend("monitor_social_platform_trends", input, config);
  }

  monitorAudienceBehaviourSignals(
    input: TrendResearchWorkerInput,
    config: TrendResearchWorkerConfiguration,
  ) {
    return this.runTrend("monitor_audience_behaviour_signals", input, config);
  }

  monitorCurrentEvents(input: TrendResearchWorkerInput, config: TrendResearchWorkerConfiguration) {
    return this.runTrend("monitor_current_events", input, config);
  }

  identifyEmergingTrends(
    input: TrendResearchWorkerInput,
    config: TrendResearchWorkerConfiguration,
  ) {
    return this.runTrend("identify_emerging_trends", { ...input, trendDirection: "emerging" }, config);
  }

  identifyDecliningTrends(
    input: TrendResearchWorkerInput,
    config: TrendResearchWorkerConfiguration,
  ) {
    return this.runTrend("identify_declining_trends", { ...input, trendDirection: "declining" }, config);
  }

  categorizeOpportunities(
    input: TrendResearchWorkerInput,
    config: TrendResearchWorkerConfiguration,
  ) {
    return this.runTrend("categorize_opportunities", input, config);
  }

  scoreTrendConfidence(input: TrendResearchWorkerInput, config: TrendResearchWorkerConfiguration) {
    return this.runTrend("score_trend_confidence", input, config);
  }

  produceReport(input: TrendResearchWorkerInput, config: TrendResearchWorkerConfiguration) {
    return this.runTrend("produce_report", input, config);
  }

  submitReport(input: TrendResearchWorkerInput, config: TrendResearchWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("submit_report", input, config, started);
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let reports = this.store.list();
    if (input.trendReportId) {
      const one = this.store.get(input.trendReportId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runTrend("produce_report", input, config);
      reports = generated.trendReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) => this.store.markSubmitted(r.trendReportId, submission.executiveReportId!) ?? r,
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
    appendTrwLog({
      event: "submit_report",
      details: `reports=${reports.length} submitted=${submission.submitted}`,
    });
    return this.report(
      "submit_report",
      this.getCatalog(),
      reports,
      latest,
      validation.warnings.length && validation.decision === "pass"
        ? { ...validation, decision: "partial" }
        : validation,
      started,
    );
  }

  list(config: TrendResearchWorkerConfiguration) {
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

  validate(input: TrendResearchWorkerInput, config: TrendResearchWorkerConfiguration) {
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

  diagnostics(config: TrendResearchWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Trend Research Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendTrwLog({
      event: "diagnostics",
      details: `trendReports=${this.store.count()}`,
    });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runTrend(
    action: TrendResearchWorkerRunReport["action"],
    input: TrendResearchWorkerInput,
    config: TrendResearchWorkerConfiguration,
  ): TrendResearchWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.trendRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Trend Research Worker is disabled" : "Trend rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    if (this.hasUnapprovedSource(input)) {
      return this.boundaryFail(action, input, config, started);
    }
    const enriched = this.integrations.enrichFromMediaWorkers({
      ...this.pendingContext,
      ...input,
    });
    const { enrichment } = this.integrations.pullMediaContext(enriched);
    if (
      !enriched.channelId?.trim() &&
      !enriched.mediaBusinessId?.trim() &&
      !enriched.mediaMissionId?.trim()
    ) {
      return this.disabled(
        action,
        config,
        "Trend research requires channelId, mediaBusinessId, or mediaMissionId",
      );
    }
    this.pendingContext = enriched;
    const focusCategory = focusCategoryForAction(action);
    const report = this.builder.buildReport(enriched, config, enrichment, focusCategory);
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
    appendTrwLog({
      event: action,
      details: `report=${report.trendReportId} topic=${report.trendTopic} direction=${report.trendDirection} confidence=${report.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: TrendResearchWorkerRunReport["action"],
    input: TrendResearchWorkerInput,
    config: TrendResearchWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: TrendResearchWorkerRunReport["action"],
    config: TrendResearchWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: TrendResearchWorkerInput) {
    return (
      input.selectPublishingTopics === true ||
      input.writeScripts === true ||
      input.generateThumbnails === true ||
      input.publishContent === true ||
      input.generateContent === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ404OrLater === true ||
      input.useUnapprovedSource === true
    );
  }

  private hasUnapprovedSource(input: TrendResearchWorkerInput) {
    if (input.useUnapprovedSource === true) return true;
    const source = input.discoverySource?.trim();
    if (!source) return false;
    return !this.validator.isApprovedSource(source);
  }

  private ensureRecord(
    state: OperationalState,
    config: TrendResearchWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: TrendResearchReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `trw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: TREND_RESEARCH_WORKER_ID,
      engineVersion: "PILLOW-TRW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...TRW_CAPABILITIES],
      totalTrendReports: this.store.count(),
      lastTrendReportId: report?.trendReportId ?? this.store.getLatestTrendReportId(),
      lastTrendDirection: report?.trendDirection ?? null,
      lastConfidenceScore: report?.confidenceScore ?? null,
      lastRecommendedPriority: report?.recommendedPriority ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: TRW_METADATA_VERSION,
    };
  }

  private report(
    action: TrendResearchWorkerRunReport["action"],
    catalog: TrendResearchWorkerCatalog | null,
    trendReports: TrendResearchReport[],
    latestTrendReport: TrendResearchReport | null,
    validation: TrendResearchWorkerRunReport["validation"],
    started: number,
  ): TrendResearchWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      trendRunReportId: `trw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      trendReports,
      latestTrendReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: TRW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: TrendResearchWorkerCatalog): TrendResearchWorkerCatalog {
  return {
    ...catalog,
    trendReports: catalog.trendReports.map((report) => ({
      ...report,
      searchDemand: { ...report.searchDemand },
      socialSignals: { ...report.socialSignals },
      competitorActivity: { ...report.competitorActivity },
      currentEventRelevance: { ...report.currentEventRelevance },
      audienceBehaviour: report.audienceBehaviour ? { ...report.audienceBehaviour } : undefined,
      supportingEvidence: report.supportingEvidence.map((e) => ({ ...e })),
      evidenceKinds: [...report.evidenceKinds],
      traceabilityRefs: [...report.traceabilityRefs],
      preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
