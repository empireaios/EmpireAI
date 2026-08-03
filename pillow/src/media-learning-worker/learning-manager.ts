import type { MediaLearningWorkerConfiguration } from "./configuration.js";
import { LearningBuilder } from "./learning-builder.js";
import { LearningStore } from "./learning-store.js";
import {
  HealthMonitor,
  LearningValidator,
  RecoveryManager,
} from "./learning-validator.js";
import {
  IntegrationCoordinator,
  type MediaLearningWorkerDependencies,
} from "./integrations.js";
import {
  INTEGRATION_TARGETS,
  MEDIA_LEARNING_WORKER_ID,
  MLW_CAPABILITIES,
  MLW_METADATA_VERSION,
} from "./paths.js";
import { appendMlwLog } from "./mlw-logging.js";
import type {
  IntegrationHandshake,
  LearningContext,
  MediaLearningReport,
  MediaLearningWorkerCatalog,
  MediaLearningWorkerEngineRecord,
  MediaLearningWorkerInput,
  MediaLearningWorkerRunReport,
  OperationalState,
} from "./types.js";

export class LearningManager {
  private engineRecord: MediaLearningWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: MediaLearningWorkerCatalog | null = null;
  private readonly store = new LearningStore();
  private readonly builder = new LearningBuilder();
  private readonly validator = new LearningValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: LearningContext = {};

  bindIntegrations(deps: MediaLearningWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: MediaLearningWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedLearningReports);
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

  getLearningReports() {
    return this.store.list();
  }

  getLatestLearningReportId() {
    return this.store.getLatestLearningReportId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: MediaLearningWorkerConfiguration,
  ): MediaLearningWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendMlwLog({
      event: "connect",
      details: `Media Learning Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `mlw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Media Learning Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: MLW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveMediaAnalyticsReports(
    input: MediaLearningWorkerInput,
    config: MediaLearningWorkerConfiguration,
  ) {
    return this.runReceive("receive_media_analytics_reports", input, config, {
      receivedAnalytics: true,
    });
  }

  identifySuccessfulContentPatterns(
    input: MediaLearningWorkerInput,
    config: MediaLearningWorkerConfiguration,
  ) {
    return this.runAnalyze("identify_successful_content_patterns", input, config, "successful");
  }

  identifyUnsuccessfulContentPatterns(
    input: MediaLearningWorkerInput,
    config: MediaLearningWorkerConfiguration,
  ) {
    return this.runAnalyze(
      "identify_unsuccessful_content_patterns",
      input,
      config,
      "unsuccessful",
    );
  }

  analyseTopicPerformance(
    input: MediaLearningWorkerInput,
    config: MediaLearningWorkerConfiguration,
  ) {
    return this.runAnalyze("analyse_topic_performance", input, config, "topic");
  }

  analyseHookPerformance(
    input: MediaLearningWorkerInput,
    config: MediaLearningWorkerConfiguration,
  ) {
    return this.runAnalyze("analyse_hook_performance", input, config, "hook");
  }

  analyseThumbnailPerformance(
    input: MediaLearningWorkerInput,
    config: MediaLearningWorkerConfiguration,
  ) {
    return this.runAnalyze("analyse_thumbnail_performance", input, config, "thumbnail");
  }

  analysePacingAndRetention(
    input: MediaLearningWorkerInput,
    config: MediaLearningWorkerConfiguration,
  ) {
    return this.runAnalyze("analyse_pacing_and_retention", input, config, "retention");
  }

  analysePublishingTiming(
    input: MediaLearningWorkerInput,
    config: MediaLearningWorkerConfiguration,
  ) {
    return this.runAnalyze("analyse_publishing_timing", input, config, "publishing");
  }

  generateReusableLearningInsights(
    input: MediaLearningWorkerInput,
    config: MediaLearningWorkerConfiguration,
  ) {
    return this.runAnalyze(
      "generate_reusable_learning_insights",
      input,
      config,
      "insights",
    );
  }

  updateMediaPlaybookRecommendations(
    input: MediaLearningWorkerInput,
    config: MediaLearningWorkerConfiguration,
  ) {
    return this.runAnalyze(
      "update_media_playbook_recommendations",
      input,
      config,
      "playbook",
    );
  }

  produceMediaLearningReport(
    input: MediaLearningWorkerInput,
    config: MediaLearningWorkerConfiguration,
  ) {
    return this.runFull("produce_media_learning_report", input, config);
  }

  submitReport(input: MediaLearningWorkerInput, config: MediaLearningWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("submit_report", input, config, started);
    if (input.verifiedAnalytics === false) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let reports = this.store.list();
    if (input.learningReportId) {
      const one = this.store.get(input.learningReportId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runFull("produce_media_learning_report", input, config);
      reports = generated.learningReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) =>
          this.store.markSubmitted(r.learningReportId, submission.executiveReportId!) ?? r,
      );
    }
    for (const report of reports) {
      this.integrations.recordExperience(report);
      this.integrations.registerPlaybookUpdates(report);
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateLearningReports(
      reports.length ? reports : null,
      { ...input, validated: input.validated ?? true, verifiedAnalytics: input.verifiedAnalytics ?? true },
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
    appendMlwLog({
      event: "submit_report",
      details: `learningReports=${reports.length} submitted=${submission.submitted}`,
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

  list(config: MediaLearningWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateLearningReports(
      reports.length ? reports : null,
      { validated: true, verifiedAnalytics: true },
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

  validate(input: MediaLearningWorkerInput, config: MediaLearningWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateLearningReports(
      reports.length ? reports : null,
      {
        ...input,
        validated: input.validated ?? true,
        verifiedAnalytics: input.verifiedAnalytics ?? true,
      },
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

  diagnostics(config: MediaLearningWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Media Learning Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendMlwLog({ event: "diagnostics", details: `learningReports=${this.store.count()}` });
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
    action: MediaLearningWorkerRunReport["action"],
    input: MediaLearningWorkerInput,
    config: MediaLearningWorkerConfiguration,
    flags: Partial<Pick<LearningContext, "receivedAnalytics">>,
  ): MediaLearningWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.learningRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Media Learning Worker is disabled"
          : "Learning rules are disabled",
      );
    }
    if (this.hasBoundary(input) || input.verifiedAnalytics === false) {
      return this.boundaryFail(action, input, config, started);
    }
    const enriched = this.integrations.enrichInput(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    this.context = { ...this.context, ...flags };
    const validation = this.validator.validateLearningReports(
      null,
      {
        ...enriched,
        validated: enriched.validated ?? true,
        verifiedAnalytics: enriched.verifiedAnalytics ?? true,
      },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendMlwLog({
      event: action,
      details: `channel=${this.context.channelId ?? "pending"} analytics=${this.context.analyticsReports?.length ?? 0}`,
    });
    return this.report(action, this.getCatalog(), this.store.list(), null, validation, started);
  }

  private runAnalyze(
    action: MediaLearningWorkerRunReport["action"],
    input: MediaLearningWorkerInput,
    config: MediaLearningWorkerConfiguration,
    mode:
      | "successful"
      | "unsuccessful"
      | "topic"
      | "hook"
      | "thumbnail"
      | "retention"
      | "publishing"
      | "insights"
      | "playbook",
  ): MediaLearningWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.learningRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Media Learning Worker is disabled"
          : "Learning rules are disabled",
      );
    }
    if (this.hasBoundary(input) || input.verifiedAnalytics === false) {
      return this.boundaryFail(action, input, config, started);
    }
    const enriched = this.integrations.enrichInput({
      ...input,
      validated: input.validated ?? true,
      verifiedAnalytics: input.verifiedAnalytics ?? true,
    });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readinessGate = this.builder.canLearn(this.context);
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
    const reports = this.context.analyticsReports ?? [];
    if (mode === "successful") {
      this.context = {
        ...this.context,
        successfulPatterns: this.builder.identifySuccessfulContentPatterns(reports, seq),
      };
    }
    if (mode === "unsuccessful") {
      this.context = {
        ...this.context,
        failedPatterns: this.builder.identifyUnsuccessfulContentPatterns(reports, seq),
      };
    }
    if (mode === "topic") {
      this.context = {
        ...this.context,
        topicInsights: this.builder.analyseTopicPerformance(
          reports,
          this.context.topicIds ?? [],
          seq,
        ),
      };
    }
    if (mode === "hook") {
      this.context = {
        ...this.context,
        hookInsights: this.builder.analyseHookPerformance(
          reports,
          this.context.hookReportIds ?? [],
          seq,
        ),
      };
    }
    if (mode === "thumbnail") {
      this.context = {
        ...this.context,
        thumbnailInsights: this.builder.analyseThumbnailPerformance(
          reports,
          this.context.thumbnailIds ?? [],
          seq,
        ),
      };
    }
    if (mode === "retention") {
      this.context = {
        ...this.context,
        retentionInsights: this.builder.analysePacingAndRetention(reports, seq),
      };
    }
    if (mode === "publishing") {
      this.context = {
        ...this.context,
        publishingInsights: this.builder.analysePublishingTiming(
          reports,
          this.context.publishingTimingNotes,
          seq,
        ),
      };
    }
    if (mode === "insights") {
      const generated = this.builder.generateReusableLearningInsights(this.context, seq);
      this.context = { ...this.context, ...generated };
    }
    if (mode === "playbook") {
      const draftId = enriched.learningReportId?.trim() || `mlw-rpt-${seq}`;
      const improvements =
        this.context.recommendedImprovements &&
        this.context.recommendedImprovements.length > 0
          ? this.context.recommendedImprovements
          : this.builder.buildRecommendedImprovements(
              this.context.successfulPatterns ?? [],
              this.context.failedPatterns ?? [],
              {
                topicInsights: this.context.topicInsights ?? [],
                hookInsights: this.context.hookInsights ?? [],
                thumbnailInsights: this.context.thumbnailInsights ?? [],
                retentionInsights: this.context.retentionInsights ?? [],
                publishingInsights: this.context.publishingInsights ?? [],
              },
              this.context.contentFormats ?? [],
              seq,
            );
      this.context = {
        ...this.context,
        recommendedImprovements: improvements,
        playbookRecommendationUpdates: this.builder.updateMediaPlaybookRecommendations(
          this.context.channelId?.trim() || `chn-mlw-${seq}`,
          draftId,
          improvements,
          seq,
        ),
      };
    }
    const report = this.builder.buildLearningReport(enriched, config, this.context);
    this.store.save(report, action);
    this.integrations.registerPlaybookUpdates(report);
    this.integrations.recordExperience(report);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateLearningReports([report], enriched, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      report,
    );
    appendMlwLog({
      event: action,
      details: `learningReport=${report.learningReportId} mode=${mode}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private runFull(
    action: MediaLearningWorkerRunReport["action"],
    input: MediaLearningWorkerInput,
    config: MediaLearningWorkerConfiguration,
  ): MediaLearningWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.learningRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Media Learning Worker is disabled"
          : "Learning rules are disabled",
      );
    }
    if (this.hasBoundary(input) || input.verifiedAnalytics === false) {
      return this.boundaryFail(action, input, config, started);
    }
    const enriched = this.integrations.enrichInput({
      ...input,
      validated: input.validated ?? true,
      verifiedAnalytics: input.verifiedAnalytics ?? true,
    });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readinessGate = this.builder.canLearn(this.context);
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
    const report = this.builder.buildLearningReport(enriched, config, this.context);
    this.store.save(report, action);
    this.integrations.registerPlaybookUpdates(report);
    this.integrations.recordExperience(report);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateLearningReports(
      [report],
      {
        ...enriched,
        validated: enriched.validated ?? true,
        verifiedAnalytics: enriched.verifiedAnalytics ?? true,
      },
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
    appendMlwLog({
      event: action,
      details: `learningReport=${report.learningReportId} channel=${report.channelId} confidence=${report.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: MediaLearningWorkerRunReport["action"],
    input: MediaLearningWorkerInput,
    config: MediaLearningWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateLearningReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: MediaLearningWorkerRunReport["action"],
    config: MediaLearningWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: MediaLearningWorkerInput) {
    return (
      input.rewriteExistingContent === true ||
      input.modifyPublishedVideos === true ||
      input.changeEditorialPolicyDirectly === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ417OrLater === true ||
      input.overwriteHistoricalLearning === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: MediaLearningWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: MediaLearningReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `mlw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: MEDIA_LEARNING_WORKER_ID,
      engineVersion: "PILLOW-MLW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...MLW_CAPABILITIES],
      totalLearningReports: this.store.count(),
      lastLearningReportId:
        report?.learningReportId ?? this.store.getLatestLearningReportId(),
      lastChannelId: report?.channelId ?? null,
      lastConfidenceScore: report?.confidenceScore ?? null,
      lastVerifiedAnalyticsOnly: report?.verifiedAnalyticsOnly ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: MLW_METADATA_VERSION,
    };
  }

  private report(
    action: MediaLearningWorkerRunReport["action"],
    catalog: MediaLearningWorkerCatalog | null,
    learningReports: MediaLearningReport[],
    latestLearningReport: MediaLearningReport | null,
    validation: MediaLearningWorkerRunReport["validation"],
    started: number,
  ): MediaLearningWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      learningRunReportId: `mlw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      learningReports,
      latestLearningReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: MLW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: MediaLearningWorkerCatalog): MediaLearningWorkerCatalog {
  return {
    ...catalog,
    learningReports: catalog.learningReports.map((r) => ({
      ...r,
      mediaIdsAnalysed: [...r.mediaIdsAnalysed],
      successfulPatterns: r.successfulPatterns.map((p) => ({
        ...p,
        evidenceRefs: [...p.evidenceRefs],
      })),
      failedPatterns: r.failedPatterns.map((p) => ({
        ...p,
        evidenceRefs: [...p.evidenceRefs],
      })),
      topicInsights: r.topicInsights.map((i) => ({
        ...i,
        measuredSignals: [...i.measuredSignals],
        assumptions: [...i.assumptions],
      })),
      hookInsights: r.hookInsights.map((i) => ({
        ...i,
        measuredSignals: [...i.measuredSignals],
        assumptions: [...i.assumptions],
      })),
      thumbnailInsights: r.thumbnailInsights.map((i) => ({
        ...i,
        measuredSignals: [...i.measuredSignals],
        assumptions: [...i.assumptions],
      })),
      retentionInsights: r.retentionInsights.map((i) => ({
        ...i,
        measuredSignals: [...i.measuredSignals],
        assumptions: [...i.assumptions],
      })),
      publishingInsights: r.publishingInsights.map((i) => ({
        ...i,
        measuredSignals: [...i.measuredSignals],
        assumptions: [...i.assumptions],
      })),
      recommendedImprovements: r.recommendedImprovements.map((rec) => ({ ...rec })),
      playbookRecommendationUpdates: r.playbookRecommendationUpdates.map((u) => ({
        ...u,
        neverOverwroteHistoricalLearning: true as const,
      })),
      analyticsReportIds: [...r.analyticsReportIds],
      learningTraceabilityRefs: [...r.learningTraceabilityRefs],
      preservedDecisions: r.preservedDecisions.map((d) => ({ ...d })),
      historicalLearningRecordIds: [...r.historicalLearningRecordIds],
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
    learningOutcomeKinds: [...catalog.learningOutcomeKinds],
    patternDimensions: [...catalog.patternDimensions],
  };
}
