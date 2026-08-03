import type { MediaAnalyticsWorkerConfiguration } from "./configuration.js";
import { AnalyticsBuilder } from "./analytics-builder.js";
import { AnalyticsStore } from "./analytics-store.js";
import {
  AnalyticsValidator,
  HealthMonitor,
  RecoveryManager,
} from "./analytics-validator.js";
import {
  IntegrationCoordinator,
  type MediaAnalyticsWorkerDependencies,
} from "./integrations.js";
import {
  INTEGRATION_TARGETS,
  MAW_CAPABILITIES,
  MAW_METADATA_VERSION,
  MEDIA_ANALYTICS_WORKER_ID,
} from "./paths.js";
import { appendMawLog } from "./maw-logging.js";
import type {
  AnalyticsContext,
  IntegrationHandshake,
  MediaAnalyticsReport,
  MediaAnalyticsWorkerCatalog,
  MediaAnalyticsWorkerEngineRecord,
  MediaAnalyticsWorkerInput,
  MediaAnalyticsWorkerRunReport,
  OperationalState,
} from "./types.js";

export class AnalyticsManager {
  private engineRecord: MediaAnalyticsWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: MediaAnalyticsWorkerCatalog | null = null;
  private readonly store = new AnalyticsStore();
  private readonly builder = new AnalyticsBuilder();
  private readonly validator = new AnalyticsValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: AnalyticsContext = {};

  bindIntegrations(deps: MediaAnalyticsWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: MediaAnalyticsWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedAnalyticsReports);
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

  getAnalyticsReports() {
    return this.store.list();
  }

  getLatestAnalyticsReportId() {
    return this.store.getLatestAnalyticsReportId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: MediaAnalyticsWorkerConfiguration,
  ): MediaAnalyticsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendMawLog({
      event: "connect",
      details: `Media Analytics Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `maw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Media Analytics Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: MAW_METADATA_VERSION,
      },
      started,
    );
  }

  receivePlatformMetrics(
    input: MediaAnalyticsWorkerInput,
    config: MediaAnalyticsWorkerConfiguration,
  ) {
    return this.runReceive("receive_platform_metrics", input, config, {
      receivedMetrics: true,
    });
  }

  trackViews(input: MediaAnalyticsWorkerInput, config: MediaAnalyticsWorkerConfiguration) {
    return this.runTrack("track_views", input, config, "views");
  }

  trackImpressions(input: MediaAnalyticsWorkerInput, config: MediaAnalyticsWorkerConfiguration) {
    return this.runTrack("track_impressions", input, config, "impressions");
  }

  trackClickThroughRate(
    input: MediaAnalyticsWorkerInput,
    config: MediaAnalyticsWorkerConfiguration,
  ) {
    return this.runTrack("track_click_through_rate", input, config, "ctr");
  }

  trackWatchTime(input: MediaAnalyticsWorkerInput, config: MediaAnalyticsWorkerConfiguration) {
    return this.runTrack("track_watch_time", input, config, "watch_time");
  }

  trackAudienceRetention(
    input: MediaAnalyticsWorkerInput,
    config: MediaAnalyticsWorkerConfiguration,
  ) {
    return this.runTrack("track_audience_retention", input, config, "retention");
  }

  trackSubscriberGrowth(
    input: MediaAnalyticsWorkerInput,
    config: MediaAnalyticsWorkerConfiguration,
  ) {
    return this.runTrack("track_subscriber_growth", input, config, "subscribers");
  }

  trackEngagementMetrics(
    input: MediaAnalyticsWorkerInput,
    config: MediaAnalyticsWorkerConfiguration,
  ) {
    return this.runTrack("track_engagement_metrics", input, config, "engagement");
  }

  trackRevenueWhereAvailable(
    input: MediaAnalyticsWorkerInput,
    config: MediaAnalyticsWorkerConfiguration,
  ) {
    return this.runTrack("track_revenue_where_available", input, config, "revenue");
  }

  detectPerformancePatterns(
    input: MediaAnalyticsWorkerInput,
    config: MediaAnalyticsWorkerConfiguration,
  ) {
    return this.runAnalyze("detect_performance_patterns", input, config, "patterns");
  }

  compareVideosFormatsTopicsHooksChannels(
    input: MediaAnalyticsWorkerInput,
    config: MediaAnalyticsWorkerConfiguration,
  ) {
    return this.runAnalyze(
      "compare_videos_formats_topics_hooks_channels",
      input,
      config,
      "comparisons",
    );
  }

  produceMediaAnalyticsReport(
    input: MediaAnalyticsWorkerInput,
    config: MediaAnalyticsWorkerConfiguration,
  ) {
    return this.runFull("produce_media_analytics_report", input, config);
  }

  submitReport(input: MediaAnalyticsWorkerInput, config: MediaAnalyticsWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("submit_report", input, config, started);
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let reports = this.store.list();
    if (input.analyticsReportId) {
      const one = this.store.get(input.analyticsReportId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runFull("produce_media_analytics_report", input, config);
      reports = generated.analyticsReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) =>
          this.store.markSubmitted(r.analyticsReportId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateAnalyticsReports(
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
    appendMawLog({
      event: "submit_report",
      details: `analyticsReports=${reports.length} submitted=${submission.submitted}`,
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

  list(config: MediaAnalyticsWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateAnalyticsReports(
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

  validate(input: MediaAnalyticsWorkerInput, config: MediaAnalyticsWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateAnalyticsReports(
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

  diagnostics(config: MediaAnalyticsWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Media Analytics Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendMawLog({ event: "diagnostics", details: `analyticsReports=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runReceive(
    action: MediaAnalyticsWorkerRunReport["action"],
    input: MediaAnalyticsWorkerInput,
    config: MediaAnalyticsWorkerConfiguration,
    flags: Partial<Pick<AnalyticsContext, "receivedMetrics">>,
  ): MediaAnalyticsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.analyticsRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Media Analytics Worker is disabled"
          : "Analytics rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    this.context = { ...this.context, ...flags };
    const validation = this.validator.validateAnalyticsReports(
      null,
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendMawLog({
      event: action,
      details: `media=${this.context.mediaId ?? "pending"} flags=${JSON.stringify(flags)}`,
    });
    return this.report(action, this.getCatalog(), this.store.list(), null, validation, started);
  }

  private runTrack(
    action: MediaAnalyticsWorkerRunReport["action"],
    input: MediaAnalyticsWorkerInput,
    config: MediaAnalyticsWorkerConfiguration,
    _mode: string,
  ): MediaAnalyticsWorkerRunReport {
    return this.runFull(action, input, config);
  }

  private runAnalyze(
    action: MediaAnalyticsWorkerRunReport["action"],
    input: MediaAnalyticsWorkerInput,
    config: MediaAnalyticsWorkerConfiguration,
    mode: "patterns" | "comparisons",
  ): MediaAnalyticsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.analyticsRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Media Analytics Worker is disabled"
          : "Analytics rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput({
      ...input,
      validated: input.validated ?? true,
    });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readinessGate = this.builder.canAnalyze(this.context);
    if (!readinessGate.ready) {
      const validation = this.validator.finalize(
        "fail",
        [readinessGate.reason ?? "Not ready"],
        [],
        started,
      );
      this.recovery.recordFailure();
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const seq = Date.now();
    const now = new Date().toISOString();
    const mediaId = this.context.mediaId!.trim();
    const views = this.builder.trackViews(this.context, now);
    const impressions = this.builder.trackImpressions(this.context, now);
    const ctr = this.builder.trackClickThroughRate(this.context, views, impressions, now);
    const retention = this.builder.trackAudienceRetention(this.context);
    const engagement = this.builder.trackEngagementMetrics(this.context, views);
    const revenue = this.builder.trackRevenueWhereAvailable(this.context);
    if (mode === "patterns") {
      this.context = {
        ...this.context,
        performancePatterns: this.builder.detectPerformancePatterns(
          this.context,
          ctr,
          retention,
          engagement,
          revenue,
          seq,
        ),
      };
    }
    if (mode === "comparisons") {
      this.context = {
        ...this.context,
        comparisons: this.builder.compareVideosFormatsTopicsHooksChannels(
          this.context,
          mediaId,
          views,
          ctr,
          retention,
          seq,
        ),
      };
    }
    const report = this.builder.buildAnalyticsReport(enriched, config, this.context);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateAnalyticsReports([report], enriched, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      report,
    );
    appendMawLog({
      event: action,
      details: `analyticsReport=${report.analyticsReportId} mode=${mode}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private runFull(
    action: MediaAnalyticsWorkerRunReport["action"],
    input: MediaAnalyticsWorkerInput,
    config: MediaAnalyticsWorkerConfiguration,
  ): MediaAnalyticsWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.analyticsRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Media Analytics Worker is disabled"
          : "Analytics rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput({
      ...input,
      validated: input.validated ?? true,
    });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readinessGate = this.builder.canAnalyze(this.context);
    if (!readinessGate.ready) {
      const validation = this.validator.finalize(
        "fail",
        [readinessGate.reason ?? "Not ready"],
        [],
        started,
      );
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const report = this.builder.buildAnalyticsReport(enriched, config, this.context);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateAnalyticsReports(
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
    appendMawLog({
      event: action,
      details: `analyticsReport=${report.analyticsReportId} media=${report.mediaId} confidence=${report.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: MediaAnalyticsWorkerRunReport["action"],
    input: MediaAnalyticsWorkerInput,
    config: MediaAnalyticsWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateAnalyticsReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: MediaAnalyticsWorkerRunReport["action"],
    config: MediaAnalyticsWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: MediaAnalyticsWorkerInput) {
    return (
      input.rewriteContent === true ||
      input.changePublishingSchedules === true ||
      input.modifyChannelStrategy === true ||
      input.executeOptimizations === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ416OrLater === true ||
      input.alterSourceAnalyticsData === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: MediaAnalyticsWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: MediaAnalyticsReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `maw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: MEDIA_ANALYTICS_WORKER_ID,
      engineVersion: "PILLOW-MAW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...MAW_CAPABILITIES],
      totalAnalyticsReports: this.store.count(),
      lastAnalyticsReportId:
        report?.analyticsReportId ?? this.store.getLatestAnalyticsReportId(),
      lastMediaId: report?.mediaId ?? null,
      lastPlatform: report?.platform ?? null,
      lastConfidenceScore: report?.confidenceScore ?? null,
      lastMeaningfulChangeDetected: report?.meaningfulChangeDetected ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: MAW_METADATA_VERSION,
    };
  }

  private report(
    action: MediaAnalyticsWorkerRunReport["action"],
    catalog: MediaAnalyticsWorkerCatalog | null,
    analyticsReports: MediaAnalyticsReport[],
    latestAnalyticsReport: MediaAnalyticsReport | null,
    validation: MediaAnalyticsWorkerRunReport["validation"],
    started: number,
  ): MediaAnalyticsWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      analyticsRunReportId: `maw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      analyticsReports,
      latestAnalyticsReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: MAW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: MediaAnalyticsWorkerCatalog): MediaAnalyticsWorkerCatalog {
  return {
    ...catalog,
    analyticsReports: catalog.analyticsReports.map((r) => ({
      ...r,
      views: { ...r.views },
      impressions: { ...r.impressions },
      clickThroughRate: { ...r.clickThroughRate },
      watchTime: { ...r.watchTime },
      retentionMetrics: { ...r.retentionMetrics },
      subscriberImpact: { ...r.subscriberImpact },
      engagementMetrics: { ...r.engagementMetrics },
      revenueMetrics: { ...r.revenueMetrics },
      performancePatterns: r.performancePatterns.map((p) => ({
        ...p,
        evidenceRefs: [...p.evidenceRefs],
      })),
      comparisons: r.comparisons.map((c) => ({
        ...c,
        metricsCompared: [...c.metricsCompared],
      })),
      metricTraceabilityRefs: [...r.metricTraceabilityRefs],
      preservedDecisions: r.preservedDecisions.map((d) => ({ ...d })),
      historicalSnapshotIds: [...r.historicalSnapshotIds],
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
    supportedPlatforms: [...catalog.supportedPlatforms],
    metricSources: [...catalog.metricSources],
  };
}
