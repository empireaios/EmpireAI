import type { ThumbnailWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type ThumbnailWorkerDependencies,
} from "./integrations.js";
import { ThumbnailBuilder } from "./thumbnail-builder.js";
import { ThumbnailStore } from "./thumbnail-store.js";
import { HealthMonitor, ThumbnailValidator, RecoveryManager } from "./thumbnail-validator.js";
import { appendThwLog } from "./thw-logging.js";
import {
  INTEGRATION_TARGETS,
  THW_CAPABILITIES,
  THW_METADATA_VERSION,
  THUMBNAIL_WORKER_ID,
} from "./paths.js";
import type {
  ThumbnailContext,
  ThumbnailReport,
  ThumbnailWorkerCatalog,
  ThumbnailWorkerEngineRecord,
  ThumbnailWorkerInput,
  ThumbnailWorkerRunReport,
  IntegrationHandshake,
  OperationalState,
} from "./types.js";

export class ThumbnailManager {
  private engineRecord: ThumbnailWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: ThumbnailWorkerCatalog | null = null;
  private readonly store = new ThumbnailStore();
  private readonly builder = new ThumbnailBuilder();
  private readonly validator = new ThumbnailValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: ThumbnailContext = {};

  bindIntegrations(deps: ThumbnailWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: ThumbnailWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedThumbnailReports);
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

  getThumbnailReports() {
    return this.store.list();
  }

  getLatestThumbnailReportId() {
    return this.store.getLatestThumbnailReportId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  getContext() {
    return { ...this.context };
  }

  connect(
    _input: Record<string, unknown>,
    config: ThumbnailWorkerConfiguration,
  ): ThumbnailWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendThwLog({
      event: "connect",
      details: `Thumbnail Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `thw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Thumbnail Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: THW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveApprovedScript(input: ThumbnailWorkerInput, config: ThumbnailWorkerConfiguration) {
    return this.runStage("receive_approved_script", input, config, { receivedScript: true });
  }

  receiveApprovedHooks(input: ThumbnailWorkerInput, config: ThumbnailWorkerConfiguration) {
    return this.runStage("receive_approved_hooks", input, config, { receivedHooks: true });
  }

  generateThumbnailConcepts(input: ThumbnailWorkerInput, config: ThumbnailWorkerConfiguration) {
    return this.runFullGeneration("generate_thumbnail_concepts", input, config);
  }

  generateEmotionalTriggers(input: ThumbnailWorkerInput, config: ThumbnailWorkerConfiguration) {
    return this.runPartial("generate_emotional_triggers", input, config, (ctx, seq) =>
      this.builder.generateEmotionalTriggers(ctx, seq),
    );
  }

  generateTextOverlaySuggestions(input: ThumbnailWorkerInput, config: ThumbnailWorkerConfiguration) {
    return this.runPartial("generate_text_overlay_suggestions", input, config, (ctx, seq) =>
      this.builder.generateTextOverlaySuggestions(ctx, seq),
    );
  }

  recommendCompositionAndFraming(input: ThumbnailWorkerInput, config: ThumbnailWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.thumbnailRulesEnabled) {
      return this.disabled(
        "recommend_composition_and_framing",
        config,
        !config.enabled ? "Thumbnail Worker is disabled" : "Thumbnail rules are disabled",
      );
    }
    if (this.hasBoundary(input)) {
      return this.boundaryFail("recommend_composition_and_framing", input, config, started);
    }
    const enriched = this.integrations.enrichInput(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    const format =
      this.builder.resolveFormat(enriched, this.context) ??
      (config.defaultContentFormat as ThumbnailReport["contentFormat"]);
    const guidance = this.builder.recommendCompositionAndFraming(this.context, format);
    const latest = this.store.list().at(-1);
    if (latest) {
      this.store.save({ ...latest, compositionGuidance: guidance }, "recommend_composition_and_framing");
    }
    const validation = this.validator.validateThumbnailReports(latest ? [latest] : null, enriched, started);
    return this.report(
      "recommend_composition_and_framing",
      this.getCatalog(),
      this.store.list(),
      latest ?? null,
      validation,
      started,
    );
  }

  generateAbVariants(input: ThumbnailWorkerInput, config: ThumbnailWorkerConfiguration) {
    return this.runFullGeneration("generate_ab_variants", input, config);
  }

  validateScriptConsistency(input: ThumbnailWorkerInput, config: ThumbnailWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("validate_script_consistency", input, config, started);
    }
    const enriched = this.integrations.enrichInput(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    const latest = this.store.list().at(-1);
    if (latest) {
      const status = this.builder.validateScriptConsistency(this.context, latest.thumbnailConcepts);
      this.store.save({ ...latest, scriptConsistencyStatus: status }, "validate_script_consistency");
    }
    const validation = this.validator.validateThumbnailReports(
      latest ? [this.store.list().at(-1)!] : null,
      enriched,
      started,
    );
    return this.report(
      "validate_script_consistency",
      this.getCatalog(),
      this.store.list(),
      this.store.list().at(-1) ?? null,
      validation,
      started,
    );
  }

  selfReviewThumbnailQuality(input: ThumbnailWorkerInput, config: ThumbnailWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("self_review_thumbnail_quality", input, config, started);
    }
    const enriched = this.integrations.enrichInput(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    const latest = this.store.list().at(-1);
    if (!latest) {
      const validation = this.validator.finalize("fail", ["No thumbnail report available for self-review"], [], started);
      return this.report("self_review_thumbnail_quality", this.getCatalog(), [], null, validation, started);
    }
    const review = this.builder.selfReviewThumbnailQuality(
      latest.thumbnailConcepts,
      latest.abVariants,
      latest.textOverlays,
      latest.emotionalTriggers,
      this.context,
    );
    const updated: ThumbnailReport = {
      ...latest,
      selfReviewPassed: review.passed,
      selfReviewSummary: review.summary,
      selfReviewFindings: review.findings,
      confidenceScore: review.confidenceScore,
      scriptConsistencyStatus: review.scriptConsistencyStatus,
      brandingNotes: review.brandingNotes,
    };
    this.store.save(updated, "self_review_thumbnail_quality");
    const validation = this.validator.validateThumbnailReports([updated], enriched, started);
    return this.report(
      "self_review_thumbnail_quality",
      this.getCatalog(),
      [updated],
      updated,
      validation,
      started,
    );
  }

  produceThumbnailReport(input: ThumbnailWorkerInput, config: ThumbnailWorkerConfiguration) {
    return this.runFullGeneration("produce_thumbnail_report", input, config);
  }

  submitReport(input: ThumbnailWorkerInput, config: ThumbnailWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("submit_report", input, config, started);
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let reports = this.store.list();
    if (input.thumbnailReportId) {
      const one = this.store.get(input.thumbnailReportId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runFullGeneration("produce_thumbnail_report", input, config);
      reports = generated.thumbnailReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) => this.store.markSubmitted(r.thumbnailReportId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateThumbnailReports(
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
    appendThwLog({
      event: "submit_report",
      details: `thumbnailReports=${reports.length} submitted=${submission.submitted}`,
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

  list(config: ThumbnailWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateThumbnailReports(
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

  validate(input: ThumbnailWorkerInput, config: ThumbnailWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateThumbnailReports(
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

  diagnostics(config: ThumbnailWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Thumbnail Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendThwLog({ event: "diagnostics", details: `thumbnailReports=${this.store.count()}` });
    return this.report(
      "diagnostics",
      this.getCatalog(),
      this.store.list(),
      null,
      validation,
      started,
    );
  }

  private runStage(
    action: ThumbnailWorkerRunReport["action"],
    input: ThumbnailWorkerInput,
    config: ThumbnailWorkerConfiguration,
    flags: { receivedScript?: boolean; receivedHooks?: boolean },
  ): ThumbnailWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.thumbnailRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Thumbnail Worker is disabled" : "Thumbnail rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    if (flags.receivedScript) this.context = { ...this.context, receivedScript: true };
    if (flags.receivedHooks) this.context = { ...this.context, receivedHooks: true };
    const validation = this.validator.validateThumbnailReports(
      null,
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendThwLog({
      event: action,
      details: `script=${this.context.scriptId ?? "pending"} hooks=${Boolean(this.context.receivedHooks)}`,
    });
    return this.report(action, this.getCatalog(), this.store.list(), null, validation, started);
  }

  private runFullGeneration(
    action: ThumbnailWorkerRunReport["action"],
    input: ThumbnailWorkerInput,
    config: ThumbnailWorkerConfiguration,
  ): ThumbnailWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.thumbnailRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Thumbnail Worker is disabled" : "Thumbnail rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput({ ...input, validated: input.validated ?? true });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readiness = this.builder.canGenerateThumbnails(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize("fail", [readiness.reason ?? "Not ready"], [], started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const report = this.builder.buildThumbnailReport(enriched, config, this.context);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateThumbnailReports(
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
    appendThwLog({
      event: action,
      details: `thumbnailReport=${report.thumbnailReportId} script=${report.scriptId} confidence=${report.confidenceScore}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private runPartial(
    action: ThumbnailWorkerRunReport["action"],
    input: ThumbnailWorkerInput,
    config: ThumbnailWorkerConfiguration,
    generate: (ctx: typeof this.context, seq: number) => unknown,
  ): ThumbnailWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.thumbnailRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Thumbnail Worker is disabled" : "Thumbnail rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    const readiness = this.builder.canGenerateThumbnails(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize("fail", [readiness.reason ?? "Not ready"], [], started);
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    generate(this.context, Date.now());
    const report = this.builder.buildThumbnailReport(enriched, config, this.context);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateThumbnailReports([report], enriched, started);
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: ThumbnailWorkerRunReport["action"],
    input: ThumbnailWorkerInput,
    config: ThumbnailWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateThumbnailReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: ThumbnailWorkerRunReport["action"],
    config: ThumbnailWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: ThumbnailWorkerInput) {
    return (
      input.generateFinalArtwork === true ||
      input.editImagesDirectly === true ||
      input.publishThumbnails === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ408OrLater === true ||
      input.useMisleadingThumbnails === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: ThumbnailWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: ThumbnailReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `thw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: THUMBNAIL_WORKER_ID,
      engineVersion: "PILLOW-THW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...THW_CAPABILITIES],
      totalThumbnailReports: this.store.count(),
      lastThumbnailReportId: report?.thumbnailReportId ?? this.store.getLatestThumbnailReportId(),
      lastScriptId: report?.scriptId ?? null,
      lastContentFormat: report?.contentFormat ?? null,
      lastConfidenceScore: report?.confidenceScore ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: THW_METADATA_VERSION,
    };
  }

  private report(
    action: ThumbnailWorkerRunReport["action"],
    catalog: ThumbnailWorkerCatalog | null,
    thumbnailReports: ThumbnailReport[],
    latestThumbnailReport: ThumbnailReport | null,
    validation: ThumbnailWorkerRunReport["validation"],
    started: number,
  ): ThumbnailWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      thumbnailRunReportId: `thw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      thumbnailReports,
      latestThumbnailReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: THW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: ThumbnailWorkerCatalog): ThumbnailWorkerCatalog {
  return {
    ...catalog,
    thumbnailReports: catalog.thumbnailReports.map((r) => ({
      ...r,
      thumbnailConcepts: r.thumbnailConcepts.map((c) => ({ ...c })),
      primaryConcept: { ...r.primaryConcept },
      abVariants: r.abVariants.map((v) => ({ ...v })),
      textOverlays: r.textOverlays.map((t) => ({ ...t })),
      emotionalTriggers: r.emotionalTriggers.map((e) => ({ ...e })),
      compositionGuidance: { ...r.compositionGuidance },
      traceabilityRefs: [...r.traceabilityRefs],
      preservedDecisions: r.preservedDecisions.map((d) => ({ ...d })),
      selfReviewFindings: r.selfReviewFindings.map((f) => ({ ...f })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
  };
}
