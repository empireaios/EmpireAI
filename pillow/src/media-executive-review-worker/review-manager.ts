import type { MediaExecutiveReviewWorkerConfiguration } from "./configuration.js";
import { ReviewBuilder } from "./review-builder.js";
import { ReviewStore } from "./review-store.js";
import {
  HealthMonitor,
  RecoveryManager,
  ReviewValidator,
} from "./review-validator.js";
import {
  IntegrationCoordinator,
  type MediaExecutiveReviewWorkerDependencies,
} from "./integrations.js";
import {
  INTEGRATION_TARGETS,
  MEDIA_EXECUTIVE_REVIEW_WORKER_ID,
  MER_CAPABILITIES,
  MER_METADATA_VERSION,
} from "./paths.js";
import { appendMerLog } from "./mer-logging.js";
import type {
  IntegrationHandshake,
  MediaExecutiveReviewReport,
  MediaExecutiveReviewWorkerCatalog,
  MediaExecutiveReviewWorkerEngineRecord,
  MediaExecutiveReviewWorkerInput,
  MediaExecutiveReviewWorkerRunReport,
  OperationalState,
  ReviewContext,
} from "./types.js";

export class ReviewManager {
  private engineRecord: MediaExecutiveReviewWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: MediaExecutiveReviewWorkerCatalog | null = null;
  private readonly store = new ReviewStore();
  private readonly builder = new ReviewBuilder();
  private readonly validator = new ReviewValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: ReviewContext = {};

  bindIntegrations(deps: MediaExecutiveReviewWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: MediaExecutiveReviewWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedReviewReports);
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

  getReviewReports() {
    return this.store.list();
  }

  getLatestReviewId() {
    return this.store.getLatestReviewId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: MediaExecutiveReviewWorkerConfiguration,
  ): MediaExecutiveReviewWorkerRunReport {
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
    appendMerLog({
      event: "connect",
      details: `Media Executive Review Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `mer-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Media Executive Review Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: MER_METADATA_VERSION,
      },
      started,
    );
  }

  receiveAllCompletedMediaFactoryOutputs(
    input: MediaExecutiveReviewWorkerInput,
    config: MediaExecutiveReviewWorkerConfiguration,
  ) {
    return this.runReceive(
      "receive_all_completed_media_factory_outputs",
      input,
      config,
      { receivedOutputs: true },
    );
  }

  verifyEditorialCompliance(
    input: MediaExecutiveReviewWorkerInput,
    config: MediaExecutiveReviewWorkerConfiguration,
  ) {
    return this.runVerify("verify_editorial_compliance", input, config, "editorial");
  }

  verifyScriptQuality(
    input: MediaExecutiveReviewWorkerInput,
    config: MediaExecutiveReviewWorkerConfiguration,
  ) {
    return this.runVerify("verify_script_quality", input, config, "script");
  }

  verifyThumbnailQuality(
    input: MediaExecutiveReviewWorkerInput,
    config: MediaExecutiveReviewWorkerConfiguration,
  ) {
    return this.runVerify("verify_thumbnail_quality", input, config, "thumbnail");
  }

  verifyVisualAssetReadiness(
    input: MediaExecutiveReviewWorkerInput,
    config: MediaExecutiveReviewWorkerConfiguration,
  ) {
    return this.runVerify("verify_visual_asset_readiness", input, config, "visual");
  }

  verifyVoiceAndSubtitleReadiness(
    input: MediaExecutiveReviewWorkerInput,
    config: MediaExecutiveReviewWorkerConfiguration,
  ) {
    return this.runVerify(
      "verify_voice_and_subtitle_readiness",
      input,
      config,
      "voice_subtitle",
    );
  }

  verifyPublishingPackageCompleteness(
    input: MediaExecutiveReviewWorkerInput,
    config: MediaExecutiveReviewWorkerConfiguration,
  ) {
    return this.runVerify(
      "verify_publishing_package_completeness",
      input,
      config,
      "publishing",
    );
  }

  verifyAnalyticsAndLearningTraceability(
    input: MediaExecutiveReviewWorkerInput,
    config: MediaExecutiveReviewWorkerConfiguration,
  ) {
    return this.runVerify(
      "verify_analytics_and_learning_traceability",
      input,
      config,
      "analytics_learning",
    );
  }

  identifyOutstandingIssues(
    input: MediaExecutiveReviewWorkerInput,
    config: MediaExecutiveReviewWorkerConfiguration,
  ) {
    return this.runVerify("identify_outstanding_issues", input, config, "issues");
  }

  recommendApproveReviseOrReject(
    input: MediaExecutiveReviewWorkerInput,
    config: MediaExecutiveReviewWorkerConfiguration,
  ) {
    return this.runVerify(
      "recommend_approve_revise_or_reject",
      input,
      config,
      "recommend",
    );
  }

  produceMediaExecutiveReviewReport(
    input: MediaExecutiveReviewWorkerInput,
    config: MediaExecutiveReviewWorkerConfiguration,
  ) {
    return this.runFull("produce_media_executive_review_report", input, config);
  }

  submitReport(
    input: MediaExecutiveReviewWorkerInput,
    config: MediaExecutiveReviewWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("submit_report", input, config, started);
    }
    if (!config.executiveReportingEnabled) {
      return this.disabled(
        "submit_report",
        config,
        "Executive reporting submission is disabled",
      );
    }
    let reports = this.store.list();
    if (input.reviewId) {
      const one = this.store.get(input.reviewId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runFull(
        "produce_media_executive_review_report",
        input,
        config,
      );
      reports = generated.reviewReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) => this.store.markSubmitted(r.reviewId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateReviewReports(
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
    appendMerLog({
      event: "submit_report",
      details: `reviewReports=${reports.length} submitted=${submission.submitted}`,
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

  list(config: MediaExecutiveReviewWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateReviewReports(
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

  validate(
    input: MediaExecutiveReviewWorkerInput,
    config: MediaExecutiveReviewWorkerConfiguration,
  ) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateReviewReports(
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

  diagnostics(config: MediaExecutiveReviewWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Media Executive Review Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendMerLog({
      event: "diagnostics",
      details: `reviewReports=${this.store.count()}`,
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

  private runReceive(
    action: MediaExecutiveReviewWorkerRunReport["action"],
    input: MediaExecutiveReviewWorkerInput,
    config: MediaExecutiveReviewWorkerConfiguration,
    flags: Partial<Pick<ReviewContext, "receivedOutputs">>,
  ): MediaExecutiveReviewWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.reviewRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Media Executive Review Worker is disabled"
          : "Review rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }
    const enriched = this.integrations.enrichInput(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    this.context = { ...this.context, ...flags };
    const validation = this.validator.validateReviewReports(
      null,
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendMerLog({
      event: action,
      details: `media=${this.context.mediaId ?? "pending"} publishing=${this.context.publishingSignals?.length ?? 0} analytics=${this.context.analyticsSignals?.length ?? 0} learning=${this.context.learningSignals?.length ?? 0}`,
    });
    return this.report(action, this.getCatalog(), this.store.list(), null, validation, started);
  }

  private runVerify(
    action: MediaExecutiveReviewWorkerRunReport["action"],
    input: MediaExecutiveReviewWorkerInput,
    config: MediaExecutiveReviewWorkerConfiguration,
    mode:
      | "editorial"
      | "script"
      | "thumbnail"
      | "visual"
      | "voice_subtitle"
      | "publishing"
      | "analytics_learning"
      | "issues"
      | "recommend",
  ): MediaExecutiveReviewWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.reviewRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Media Executive Review Worker is disabled"
          : "Review rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }
    const enriched = this.integrations.enrichInput({
      ...input,
      validated: input.validated ?? true,
    });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readinessGate = this.builder.canReview(this.context);
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
    const completeness = this.builder.buildAssetCompleteness(this.context);
    const prerequisites = this.builder.resolvePrerequisiteStatuses(this.context);
    const quality = this.builder.buildQualityAssessment(this.context, completeness);
    const compliance = this.builder.buildComplianceAssessment(this.context, prerequisites);
    const identified = this.builder.identifyOutstandingIssues(
      this.context,
      completeness,
      prerequisites,
      seq,
    );

    this.context = {
      ...this.context,
      assetCompleteness: completeness,
      qualityAssessment: quality,
      complianceAssessment: compliance,
      outstandingIssues: identified.outstandingIssues,
      verifiedFindings: identified.verifiedFindings,
      recommendationFindings: identified.recommendationFindings,
      editorialStatus: this.builder.resolveEditorialStatus(this.context, [
        ...identified.verifiedFindings,
        ...identified.recommendationFindings,
      ]),
    };

    if (mode === "recommend" || mode === "issues") {
      const decision = this.builder.recommendApproveReviseOrReject(
        completeness,
        quality,
        compliance,
        identified.outstandingIssues,
        config,
      );
      this.context = { ...this.context, executiveRecommendation: decision };
    }

    const report = this.builder.buildReviewReport(enriched, config, this.context);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateReviewReports([report], enriched, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord(
      "active",
      config,
      validation.decision === "fail" ? "failed" : "passed",
      report,
    );
    appendMerLog({
      event: action,
      details: `reviewId=${report.reviewId} mode=${mode}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private runFull(
    action: MediaExecutiveReviewWorkerRunReport["action"],
    input: MediaExecutiveReviewWorkerInput,
    config: MediaExecutiveReviewWorkerConfiguration,
  ): MediaExecutiveReviewWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.reviewRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled
          ? "Media Executive Review Worker is disabled"
          : "Review rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail(action, input, config, started);
    }
    const enriched = this.integrations.enrichInput({
      ...input,
      validated: input.validated ?? true,
    });
    this.context = this.builder.mergeContext(enriched, this.context);
    // Receiving outputs implicitly when producing a full report with media context
    if (!this.context.receivedOutputs) {
      this.context = { ...this.context, receivedOutputs: true };
    }
    const readinessGate = this.builder.canReview(this.context);
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
    const report = this.builder.buildReviewReport(enriched, config, this.context);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateReviewReports(
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
    appendMerLog({
      event: action,
      details: `reviewId=${report.reviewId} media=${report.mediaId} recommendation=${report.executiveRecommendation} completeness=${report.assetCompleteness.completenessScore}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: MediaExecutiveReviewWorkerRunReport["action"],
    input: MediaExecutiveReviewWorkerInput,
    config: MediaExecutiveReviewWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateReviewReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: MediaExecutiveReviewWorkerRunReport["action"],
    config: MediaExecutiveReviewWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: MediaExecutiveReviewWorkerInput) {
    return (
      input.publishMedia === true ||
      input.rewriteScripts === true ||
      input.editMediaAssets === true ||
      input.modifyApprovedAssets === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ419OrLater === true ||
      input.bypassPillowGovernance === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: MediaExecutiveReviewWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: MediaExecutiveReviewReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `mer-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: MEDIA_EXECUTIVE_REVIEW_WORKER_ID,
      engineVersion: "PILLOW-MER-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...MER_CAPABILITIES],
      totalReviewReports: this.store.count(),
      lastReviewId: report?.reviewId ?? this.store.getLatestReviewId(),
      lastMediaId: report?.mediaId ?? null,
      lastChannelId: report?.channelId ?? null,
      lastExecutiveRecommendation: report?.executiveRecommendation ?? null,
      lastNeverPublishMedia: report?.neverPublishMedia ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: MER_METADATA_VERSION,
    };
  }

  private report(
    action: MediaExecutiveReviewWorkerRunReport["action"],
    catalog: MediaExecutiveReviewWorkerCatalog | null,
    reviewReports: MediaExecutiveReviewReport[],
    latestReviewReport: MediaExecutiveReviewReport | null,
    validation: MediaExecutiveReviewWorkerRunReport["validation"],
    started: number,
  ): MediaExecutiveReviewWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      reviewRunReportId: `mer-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      reviewReports,
      latestReviewReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: MER_METADATA_VERSION,
    };
  }
}

function cloneCatalog(
  catalog: MediaExecutiveReviewWorkerCatalog,
): MediaExecutiveReviewWorkerCatalog {
  return {
    ...catalog,
    reviewReports: catalog.reviewReports.map((r) => ({
      ...r,
      assetCompleteness: {
        ...r.assetCompleteness,
        missingItems: [...r.assetCompleteness.missingItems],
      },
      qualityAssessment: { ...r.qualityAssessment },
      complianceAssessment: { ...r.complianceAssessment },
      outstandingIssues: r.outstandingIssues.map((f) => ({
        ...f,
        evidenceRefs: [...f.evidenceRefs],
      })),
      supportingEvidence: r.supportingEvidence.map((e) => ({ ...e })),
      prerequisiteWorkerStatuses: r.prerequisiteWorkerStatuses.map((p) => ({ ...p })),
      verifiedFindings: r.verifiedFindings.map((f) => ({
        ...f,
        evidenceRefs: [...f.evidenceRefs],
      })),
      recommendationFindings: r.recommendationFindings.map((f) => ({
        ...f,
        evidenceRefs: [...f.evidenceRefs],
      })),
      sourceTraceabilityRefs: [...r.sourceTraceabilityRefs],
      preservedDecisions: r.preservedDecisions.map((d) => ({ ...d })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
    executiveRecommendations: [...catalog.executiveRecommendations],
  };
}
