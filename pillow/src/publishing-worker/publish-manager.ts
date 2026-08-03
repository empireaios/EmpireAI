import type { PublishingWorkerConfiguration } from "./configuration.js";
import { PublishBuilder } from "./publish-builder.js";
import { PublishStore } from "./publish-store.js";
import { PublishValidator, HealthMonitor, RecoveryManager } from "./publish-validator.js";
import {
  IntegrationCoordinator,
  type PublishingWorkerDependencies,
} from "./integrations.js";
import {
  INTEGRATION_TARGETS,
  PBW_CAPABILITIES,
  PBW_METADATA_VERSION,
  PUBLISHING_WORKER_ID,
} from "./paths.js";
import { appendPbwLog } from "./pbw-logging.js";
import type {
  IntegrationHandshake,
  OperationalState,
  PublishContext,
  PublishingReport,
  PublishingWorkerCatalog,
  PublishingWorkerEngineRecord,
  PublishingWorkerInput,
  PublishingWorkerRunReport,
} from "./types.js";

export class PublishManager {
  private engineRecord: PublishingWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: PublishingWorkerCatalog | null = null;
  private readonly store = new PublishStore();
  private readonly builder = new PublishBuilder();
  private readonly validator = new PublishValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: PublishContext = {};

  bindIntegrations(deps: PublishingWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: PublishingWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedPublishingReports);
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

  getPublishingReports() {
    return this.store.list();
  }

  getLatestPublishingReportId() {
    return this.store.getLatestPublishingReportId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: PublishingWorkerConfiguration,
  ): PublishingWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendPbwLog({
      event: "connect",
      details: `Publishing Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `pbw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Publishing Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: PBW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveCompletedMediaAssets(
    input: PublishingWorkerInput,
    config: PublishingWorkerConfiguration,
  ) {
    return this.runReceive("receive_completed_media_assets", input, config, {
      receivedMedia: true,
    });
  }

  generateOptimizedVideoTitles(
    input: PublishingWorkerInput,
    config: PublishingWorkerConfiguration,
  ) {
    return this.runPrepare("generate_optimized_video_titles", input, config, "titles");
  }

  generatePlatformDescriptions(
    input: PublishingWorkerInput,
    config: PublishingWorkerConfiguration,
  ) {
    return this.runPrepare("generate_platform_descriptions", input, config, "descriptions");
  }

  generateTagsAndKeywords(
    input: PublishingWorkerInput,
    config: PublishingWorkerConfiguration,
  ) {
    return this.runPrepare("generate_tags_and_keywords", input, config, "tags");
  }

  selectApprovedThumbnails(
    input: PublishingWorkerInput,
    config: PublishingWorkerConfiguration,
  ) {
    return this.runPrepare("select_approved_thumbnails", input, config, "thumbnails");
  }

  generatePlaylists(input: PublishingWorkerInput, config: PublishingWorkerConfiguration) {
    return this.runPrepare("generate_playlists", input, config, "playlists");
  }

  generatePublishingSchedules(
    input: PublishingWorkerInput,
    config: PublishingWorkerConfiguration,
  ) {
    return this.runPrepare("generate_publishing_schedules", input, config, "schedules");
  }

  preparePlatformUploadPackages(
    input: PublishingWorkerInput,
    config: PublishingWorkerConfiguration,
  ) {
    return this.runPrepare("prepare_platform_upload_packages", input, config, "packages");
  }

  validatePublishingReadiness(
    input: PublishingWorkerInput,
    config: PublishingWorkerConfiguration,
  ) {
    return this.runPrepare("validate_publishing_readiness", input, config, "readiness");
  }

  producePublishingReport(input: PublishingWorkerInput, config: PublishingWorkerConfiguration) {
    return this.runFull("produce_publishing_report", input, config);
  }

  submitReport(input: PublishingWorkerInput, config: PublishingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("submit_report", input, config, started);
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let reports = this.store.list();
    if (input.publishingReportId) {
      const one = this.store.get(input.publishingReportId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runFull("produce_publishing_report", input, config);
      reports = generated.publishingReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) =>
          this.store.markSubmitted(r.publishingReportId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validatePublishingReports(
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
    appendPbwLog({
      event: "submit_report",
      details: `publishingReports=${reports.length} submitted=${submission.submitted}`,
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

  list(config: PublishingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validatePublishingReports(
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

  validate(input: PublishingWorkerInput, config: PublishingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validatePublishingReports(
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

  diagnostics(config: PublishingWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Publishing Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendPbwLog({ event: "diagnostics", details: `publishingReports=${this.store.count()}` });
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
    action: PublishingWorkerRunReport["action"],
    input: PublishingWorkerInput,
    config: PublishingWorkerConfiguration,
    flags: Partial<Pick<PublishContext, "receivedMedia">>,
  ): PublishingWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.publishingRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Publishing Worker is disabled" : "Publishing rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    this.context = { ...this.context, ...flags };
    const validation = this.validator.validatePublishingReports(
      null,
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendPbwLog({
      event: action,
      details: `media=${this.context.mediaId ?? "pending"} flags=${JSON.stringify(flags)}`,
    });
    return this.report(action, this.getCatalog(), this.store.list(), null, validation, started);
  }

  private runPrepare(
    action: PublishingWorkerRunReport["action"],
    input: PublishingWorkerInput,
    config: PublishingWorkerConfiguration,
    mode:
      | "titles"
      | "descriptions"
      | "tags"
      | "thumbnails"
      | "playlists"
      | "schedules"
      | "packages"
      | "readiness",
  ): PublishingWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.publishingRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Publishing Worker is disabled" : "Publishing rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput({
      ...input,
      validated: input.validated ?? true,
    });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readinessGate = this.builder.canPreparePublishing(this.context);
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
    const platform = this.builder.defaultPlatform(this.context, config);
    let title =
      this.context.videoTitle?.trim() ||
      this.builder.generateOptimizedVideoTitle(this.context, platform);
    if (mode === "titles") {
      title = this.builder.generateOptimizedVideoTitle(this.context, platform);
    }
    let description =
      this.context.description?.trim() ||
      this.builder.generatePlatformDescription(this.context, platform, title);
    if (mode === "descriptions") {
      description = this.builder.generatePlatformDescription(this.context, platform, title);
    }
    // Empty-array trap for tags
    let tags =
      this.context.tags && this.context.tags.length > 0
        ? this.context.tags
        : this.builder.generateTagsAndKeywords(this.context, platform, title, description);
    if (mode === "tags") {
      tags = this.builder.generateTagsAndKeywords(this.context, platform, title, description);
    }
    let thumbnail =
      this.context.thumbnailReference ??
      this.builder.selectApprovedThumbnail(this.context, seq);
    if (mode === "thumbnails") {
      thumbnail = this.builder.selectApprovedThumbnail(this.context, seq);
    }
    let playlist =
      this.context.playlist ?? this.builder.generatePlaylist(this.context, platform, seq);
    if (mode === "playlists") {
      playlist = this.builder.generatePlaylist(this.context, platform, seq);
    }
    let scheduledPublishTime =
      this.context.scheduledPublishTime ??
      this.builder.generatePublishingSchedule(this.context);
    if (mode === "schedules") {
      scheduledPublishTime = this.builder.generatePublishingSchedule(this.context);
    }
    let uploadPackage =
      this.context.uploadPackage ??
      this.builder.preparePlatformUploadPackage(
        this.context,
        platform,
        title,
        description,
        tags,
        thumbnail,
        playlist,
        seq,
      );
    if (mode === "packages") {
      uploadPackage = this.builder.preparePlatformUploadPackage(
        this.context,
        platform,
        title,
        description,
        tags,
        thumbnail,
        playlist,
        seq,
      );
    }
    let publishingReadiness =
      this.context.publishingReadiness ??
      this.builder.validatePublishingReadiness(
        this.context,
        title,
        tags,
        thumbnail,
        platform,
      );
    if (mode === "readiness" || mode === "packages") {
      publishingReadiness = this.builder.validatePublishingReadiness(
        this.context,
        title,
        tags,
        thumbnail,
        platform,
      );
    }
    this.context = {
      ...this.context,
      targetPlatform: platform,
      videoTitle: title,
      description,
      tags,
      thumbnailReference: thumbnail,
      playlist,
      scheduledPublishTime,
      uploadPackage,
      publishingReadiness,
    };
    const report = this.builder.buildPublishingReport(enriched, config, this.context, {
      videoTitle: title,
      description,
      tags,
      thumbnailReference: thumbnail,
      playlist,
      scheduledPublishTime,
      uploadPackage,
      publishingReadiness,
    });
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validatePublishingReports([report], enriched, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      report,
    );
    appendPbwLog({
      event: action,
      details: `publishingReport=${report.publishingReportId} platform=${platform} mode=${mode}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private runFull(
    action: PublishingWorkerRunReport["action"],
    input: PublishingWorkerInput,
    config: PublishingWorkerConfiguration,
  ): PublishingWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.publishingRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Publishing Worker is disabled" : "Publishing rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput({
      ...input,
      validated: input.validated ?? true,
    });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readinessGate = this.builder.canPreparePublishing(this.context);
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
    const report = this.builder.buildPublishingReport(enriched, config, this.context);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validatePublishingReports(
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
    appendPbwLog({
      event: action,
      details: `publishingReport=${report.publishingReportId} media=${report.mediaId} readiness=${report.publishingReadiness.status}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: PublishingWorkerRunReport["action"],
    input: PublishingWorkerInput,
    config: PublishingWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validatePublishingReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: PublishingWorkerRunReport["action"],
    config: PublishingWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: PublishingWorkerInput) {
    return (
      input.automaticallyPublishContent === true ||
      input.modifyApprovedMediaAssets === true ||
      input.overrideApprovalWorkflows === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ415OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: PublishingWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: PublishingReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `pbw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: PUBLISHING_WORKER_ID,
      engineVersion: "PILLOW-PBW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...PBW_CAPABILITIES],
      totalPublishingReports: this.store.count(),
      lastPublishingReportId:
        report?.publishingReportId ?? this.store.getLatestPublishingReportId(),
      lastMediaId: report?.mediaId ?? null,
      lastTargetPlatform: report?.targetPlatform ?? null,
      lastReadinessStatus: report?.publishingReadiness.status ?? null,
      lastApprovalStatus: report?.approvalStatus ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: PBW_METADATA_VERSION,
    };
  }

  private report(
    action: PublishingWorkerRunReport["action"],
    catalog: PublishingWorkerCatalog | null,
    publishingReports: PublishingReport[],
    latestPublishingReport: PublishingReport | null,
    validation: PublishingWorkerRunReport["validation"],
    started: number,
  ): PublishingWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      publishingRunReportId: `pbw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      publishingReports,
      latestPublishingReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: PBW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: PublishingWorkerCatalog): PublishingWorkerCatalog {
  return {
    ...catalog,
    publishingReports: catalog.publishingReports.map((r) => ({
      ...r,
      tags: [...r.tags],
      thumbnailReference: { ...r.thumbnailReference, approved: true },
      playlist: { ...r.playlist },
      uploadPackage: {
        ...r.uploadPackage,
        tags: [...r.uploadPackage.tags],
        assetRefs: [...r.uploadPackage.assetRefs],
      },
      publishingReadiness: { ...r.publishingReadiness },
      traceabilityRefs: [...r.traceabilityRefs],
      preservedDecisions: r.preservedDecisions.map((d) => ({ ...d })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
    supportedPlatforms: [...catalog.supportedPlatforms],
    readinessStatuses: [...catalog.readinessStatuses],
  };
}
