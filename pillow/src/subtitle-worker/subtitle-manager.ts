import type { SubtitleWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type SubtitleWorkerDependencies,
} from "./integrations.js";
import {
  INTEGRATION_TARGETS,
  STW_CAPABILITIES,
  STW_METADATA_VERSION,
  SUBTITLE_WORKER_ID,
} from "./paths.js";
import { SubtitleBuilder } from "./subtitle-builder.js";
import { SubtitleStore } from "./subtitle-store.js";
import { HealthMonitor, RecoveryManager, SubtitleValidator } from "./subtitle-validator.js";
import { appendStwLog } from "./stw-logging.js";
import type {
  IntegrationHandshake,
  OperationalState,
  SubtitleContext,
  SubtitleLanguage,
  SubtitleReport,
  SubtitleWorkerCatalog,
  SubtitleWorkerEngineRecord,
  SubtitleWorkerInput,
  SubtitleWorkerRunReport,
} from "./types.js";

export class SubtitleManager {
  private engineRecord: SubtitleWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: SubtitleWorkerCatalog | null = null;
  private readonly store = new SubtitleStore();
  private readonly builder = new SubtitleBuilder();
  private readonly validator = new SubtitleValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: SubtitleContext = {};

  bindIntegrations(deps: SubtitleWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: SubtitleWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedSubtitleReports);
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

  getSubtitleReports() {
    return this.store.list();
  }

  getLatestSubtitleReportId() {
    return this.store.getLatestSubtitleReportId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: SubtitleWorkerConfiguration,
  ): SubtitleWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendStwLog({
      event: "connect",
      details: `Subtitle Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `stw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Subtitle Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: STW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveApprovedScripts(input: SubtitleWorkerInput, config: SubtitleWorkerConfiguration) {
    return this.runReceive("receive_approved_scripts", input, config, { receivedScript: true });
  }

  receiveApprovedVoiceAssets(input: SubtitleWorkerInput, config: SubtitleWorkerConfiguration) {
    return this.runReceive("receive_approved_voice_assets", input, config, {
      receivedVoice: true,
    });
  }

  generateCompleteTranscripts(input: SubtitleWorkerInput, config: SubtitleWorkerConfiguration) {
    return this.runGenerate("generate_complete_transcripts", input, config, "transcript");
  }

  generateSynchronizedCaptions(input: SubtitleWorkerInput, config: SubtitleWorkerConfiguration) {
    return this.runGenerate("generate_synchronized_captions", input, config, "captions");
  }

  generateSubtitleTiming(input: SubtitleWorkerInput, config: SubtitleWorkerConfiguration) {
    return this.runGenerate("generate_subtitle_timing", input, config, "timing");
  }

  supportMultipleSubtitleLanguages(
    input: SubtitleWorkerInput,
    config: SubtitleWorkerConfiguration,
  ) {
    return this.runGenerate("support_multiple_subtitle_languages", input, config, "languages");
  }

  validateSubtitleTimingAccuracy(
    input: SubtitleWorkerInput,
    config: SubtitleWorkerConfiguration,
  ) {
    return this.runGenerate("validate_subtitle_timing_accuracy", input, config, "validate_timing");
  }

  detectSynchronizationIssues(input: SubtitleWorkerInput, config: SubtitleWorkerConfiguration) {
    return this.runGenerate("detect_synchronization_issues", input, config, "detect_sync");
  }

  produceExportableSubtitleFiles(
    input: SubtitleWorkerInput,
    config: SubtitleWorkerConfiguration,
  ) {
    return this.runGenerate("produce_exportable_subtitle_files", input, config, "exports");
  }

  produceSubtitleReport(input: SubtitleWorkerInput, config: SubtitleWorkerConfiguration) {
    return this.runFull("produce_subtitle_report", input, config);
  }

  submitReport(input: SubtitleWorkerInput, config: SubtitleWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("submit_report", input, config, started);
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let reports = this.store.list();
    if (input.subtitleReportId) {
      const one = this.store.get(input.subtitleReportId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runFull("produce_subtitle_report", input, config);
      reports = generated.subtitleReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) => this.store.markSubmitted(r.subtitleReportId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateSubtitleReports(
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
    appendStwLog({
      event: "submit_report",
      details: `subtitleReports=${reports.length} submitted=${submission.submitted}`,
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

  list(config: SubtitleWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateSubtitleReports(
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

  validate(input: SubtitleWorkerInput, config: SubtitleWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateSubtitleReports(
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

  diagnostics(config: SubtitleWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Subtitle Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendStwLog({ event: "diagnostics", details: `subtitleReports=${this.store.count()}` });
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
    action: SubtitleWorkerRunReport["action"],
    input: SubtitleWorkerInput,
    config: SubtitleWorkerConfiguration,
    flags: Partial<Pick<SubtitleContext, "receivedScript" | "receivedVoice">>,
  ): SubtitleWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.subtitleRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Subtitle Worker is disabled" : "Subtitle rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    this.context = { ...this.context, ...flags };
    const validation = this.validator.validateSubtitleReports(
      null,
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendStwLog({
      event: action,
      details: `script=${this.context.scriptId ?? "pending"} flags=${JSON.stringify(flags)}`,
    });
    return this.report(action, this.getCatalog(), this.store.list(), null, validation, started);
  }

  private runGenerate(
    action: SubtitleWorkerRunReport["action"],
    input: SubtitleWorkerInput,
    config: SubtitleWorkerConfiguration,
    mode:
      | "transcript"
      | "captions"
      | "timing"
      | "languages"
      | "validate_timing"
      | "detect_sync"
      | "exports",
  ): SubtitleWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.subtitleRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Subtitle Worker is disabled" : "Subtitle rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput({ ...input, validated: input.validated ?? true });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readiness = this.builder.canGenerate(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize("fail", [readiness.reason ?? "Not ready"], [], started);
      this.recovery.recordFailure();
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const seq = Date.now();
    const language =
      this.context.subtitleLanguage ??
      this.builder.resolveLanguage(config.defaultLanguage) ??
      ("en-US" as SubtitleLanguage);
    const languages =
      mode === "languages" || !this.context.languages?.length
        ? (["en-US", "es-ES", "fr-FR"] as NonNullable<SubtitleContext["languages"]>)
        : this.context.languages;
    const transcript =
      this.context.transcript?.length
        ? this.context.transcript
        : this.builder.generateCompleteTranscript(this.context);
    let cues =
      this.context.captionTimeline?.length
        ? this.context.captionTimeline
        : this.builder.generateSynchronizedCaptions(
            this.context,
            transcript,
            language ?? "en-US",
            seq,
          );
    if (mode === "captions" || mode === "transcript") {
      cues = this.builder.generateSynchronizedCaptions(
        this.context,
        transcript,
        language ?? "en-US",
        seq,
      );
    }
    if (mode === "timing" || mode === "captions" || mode === "transcript") {
      cues = this.builder.generateSubtitleTiming(cues);
    }
    const timing = this.builder.validateTimingAccuracy(cues, config);
    const syncIssues = this.builder.detectSynchronizationIssues(cues, timing);
    const exports =
      mode === "exports" || !this.context.exportFormats?.length
        ? this.builder.produceExportableSubtitleFiles(cues, transcript, languages, seq)
        : this.context.exportFormats;
    this.context = {
      ...this.context,
      subtitleLanguage: language ?? "en-US",
      languages,
      transcript,
      captionTimeline: cues,
      timingAccuracy: timing,
      syncIssues,
      exportFormats: exports,
    };
    const report = this.builder.buildSubtitleReport(enriched, config, this.context, {
      transcript,
      captionTimeline: cues,
      timingAccuracy: timing,
      syncIssues,
      exportFormats: exports,
    });
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateSubtitleReports([report], enriched, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", report);
    appendStwLog({
      event: action,
      details: `subtitleReport=${report.subtitleReportId} cues=${cues.length} exports=${exports.length}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private runFull(
    action: SubtitleWorkerRunReport["action"],
    input: SubtitleWorkerInput,
    config: SubtitleWorkerConfiguration,
  ): SubtitleWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.subtitleRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Subtitle Worker is disabled" : "Subtitle rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput({ ...input, validated: input.validated ?? true });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readiness = this.builder.canGenerate(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize("fail", [readiness.reason ?? "Not ready"], [], started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const report = this.builder.buildSubtitleReport(enriched, config, this.context);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateSubtitleReports(
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
    appendStwLog({
      event: action,
      details: `subtitleReport=${report.subtitleReportId} script=${report.scriptId} exports=${report.exportFormats.length}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: SubtitleWorkerRunReport["action"],
    input: SubtitleWorkerInput,
    config: SubtitleWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateSubtitleReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: SubtitleWorkerRunReport["action"],
    config: SubtitleWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: SubtitleWorkerInput) {
    return (
      input.rewriteScripts === true ||
      input.assembleVideos === true ||
      input.publishContent === true ||
      input.publishMedia === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ413OrLater === true ||
      input.modifyApprovedScripts === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: SubtitleWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: SubtitleReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `stw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: SUBTITLE_WORKER_ID,
      engineVersion: "PILLOW-STW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...STW_CAPABILITIES],
      totalSubtitleReports: this.store.count(),
      lastSubtitleReportId: report?.subtitleReportId ?? this.store.getLatestSubtitleReportId(),
      lastScriptId: report?.scriptId ?? null,
      lastVideoId: report?.videoId ?? null,
      lastLanguage: report?.subtitleLanguage ?? null,
      lastExportCount: report?.exportFormats.length ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: STW_METADATA_VERSION,
    };
  }

  private report(
    action: SubtitleWorkerRunReport["action"],
    catalog: SubtitleWorkerCatalog | null,
    subtitleReports: SubtitleReport[],
    latestSubtitleReport: SubtitleReport | null,
    validation: SubtitleWorkerRunReport["validation"],
    started: number,
  ): SubtitleWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      subtitleRunReportId: `stw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      subtitleReports,
      latestSubtitleReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: STW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: SubtitleWorkerCatalog): SubtitleWorkerCatalog {
  return {
    ...catalog,
    subtitleReports: catalog.subtitleReports.map((r) => ({
      ...r,
      captionTimeline: r.captionTimeline.map((c) => ({ ...c })),
      timingAccuracy: { ...r.timingAccuracy },
      exportFormats: r.exportFormats.map((f) => ({ ...f })),
      qualityValidation: { ...r.qualityValidation },
      languages: [...r.languages],
      syncIssues: r.syncIssues.map((i) => ({ ...i })),
      transcriptHistory: r.transcriptHistory.map((t) => ({ ...t })),
      traceabilityRefs: [...r.traceabilityRefs],
      preservedDecisions: r.preservedDecisions.map((d) => ({ ...d })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
    supportedLanguages: [...catalog.supportedLanguages],
    supportedExportFormats: [...catalog.supportedExportFormats],
  };
}
