import type { VideoAssemblyWorkerConfiguration } from "./configuration.js";
import { AssemblyBuilder } from "./assembly-builder.js";
import { AssemblyStore } from "./assembly-store.js";
import { AssemblyValidator, HealthMonitor, RecoveryManager } from "./assembly-validator.js";
import {
  IntegrationCoordinator,
  type VideoAssemblyWorkerDependencies,
} from "./integrations.js";
import {
  INTEGRATION_TARGETS,
  VAW_CAPABILITIES,
  VAW_METADATA_VERSION,
  VIDEO_ASSEMBLY_WORKER_ID,
} from "./paths.js";
import type {
  AssemblyContext,
  IntegrationHandshake,
  OperationalState,
  VideoAssemblyReport,
  VideoAssemblyWorkerCatalog,
  VideoAssemblyWorkerEngineRecord,
  VideoAssemblyWorkerInput,
  VideoAssemblyWorkerRunReport,
} from "./types.js";
import { appendVawLog } from "./vaw-logging.js";

export class AssemblyManager {
  private engineRecord: VideoAssemblyWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: VideoAssemblyWorkerCatalog | null = null;
  private readonly store = new AssemblyStore();
  private readonly builder = new AssemblyBuilder();
  private readonly validator = new AssemblyValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: AssemblyContext = {};

  bindIntegrations(deps: VideoAssemblyWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: VideoAssemblyWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedAssemblyReports);
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

  getAssemblyReports() {
    return this.store.list();
  }

  getLatestAssemblyId() {
    return this.store.getLatestAssemblyId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: VideoAssemblyWorkerConfiguration,
  ): VideoAssemblyWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendVawLog({
      event: "connect",
      details: `Video Assembly Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `vaw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Video Assembly Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: VAW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveApprovedScripts(input: VideoAssemblyWorkerInput, config: VideoAssemblyWorkerConfiguration) {
    return this.runReceive("receive_approved_scripts", input, config, { receivedScript: true });
  }

  receiveApprovedVoiceAssets(input: VideoAssemblyWorkerInput, config: VideoAssemblyWorkerConfiguration) {
    return this.runReceive("receive_approved_voice_assets", input, config, { receivedVoice: true });
  }

  receiveApprovedVisualAssets(input: VideoAssemblyWorkerInput, config: VideoAssemblyWorkerConfiguration) {
    return this.runReceive("receive_approved_visual_assets", input, config, {
      receivedVisuals: true,
    });
  }

  receiveApprovedCreativeAssets(
    input: VideoAssemblyWorkerInput,
    config: VideoAssemblyWorkerConfiguration,
  ) {
    return this.runReceive("receive_approved_creative_assets", input, config, {
      receivedCreatives: true,
    });
  }

  receiveApprovedMusicAssets(input: VideoAssemblyWorkerInput, config: VideoAssemblyWorkerConfiguration) {
    return this.runReceive("receive_approved_music_assets", input, config, { receivedMusic: true });
  }

  synchronizeNarrationAndVisuals(
    input: VideoAssemblyWorkerInput,
    config: VideoAssemblyWorkerConfiguration,
  ) {
    return this.runSyncStage("synchronize_narration_and_visuals", input, config, "sync");
  }

  applySceneTransitions(input: VideoAssemblyWorkerInput, config: VideoAssemblyWorkerConfiguration) {
    return this.runSyncStage("apply_scene_transitions", input, config, "transitions");
  }

  applyMotionEffects(input: VideoAssemblyWorkerInput, config: VideoAssemblyWorkerConfiguration) {
    return this.runSyncStage("apply_motion_effects", input, config, "motion");
  }

  produceMultipleOutputResolutions(
    input: VideoAssemblyWorkerInput,
    config: VideoAssemblyWorkerConfiguration,
  ) {
    return this.runSyncStage("produce_multiple_output_resolutions", input, config, "formats");
  }

  validateRenderingQuality(input: VideoAssemblyWorkerInput, config: VideoAssemblyWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("validate_rendering_quality", input, config, started);
    }
    const enriched = this.integrations.enrichInput(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    const latest = this.store.list().at(-1);
    if (latest) {
      const quality = this.builder.validateRenderingQuality(
        latest.sceneTimeline,
        latest.outputFormats,
        latest.renderSettings,
      );
      this.store.save({ ...latest, qualityValidation: quality }, "validate_rendering_quality");
    }
    const validation = this.validator.validateAssemblyReports(
      latest ? [this.store.list().at(-1)!] : null,
      enriched,
      started,
    );
    return this.report(
      "validate_rendering_quality",
      this.getCatalog(),
      this.store.list(),
      this.store.list().at(-1) ?? null,
      validation,
      started,
    );
  }

  produceVideoAssemblyReport(
    input: VideoAssemblyWorkerInput,
    config: VideoAssemblyWorkerConfiguration,
  ) {
    return this.runFullAssembly("produce_video_assembly_report", input, config);
  }

  submitReport(input: VideoAssemblyWorkerInput, config: VideoAssemblyWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("submit_report", input, config, started);
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let reports = this.store.list();
    if (input.assemblyId) {
      const one = this.store.get(input.assemblyId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runFullAssembly("produce_video_assembly_report", input, config);
      reports = generated.assemblyReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) => this.store.markSubmitted(r.assemblyId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateAssemblyReports(
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
    appendVawLog({
      event: "submit_report",
      details: `assemblyReports=${reports.length} submitted=${submission.submitted}`,
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

  list(config: VideoAssemblyWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateAssemblyReports(
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

  validate(input: VideoAssemblyWorkerInput, config: VideoAssemblyWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateAssemblyReports(
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

  diagnostics(config: VideoAssemblyWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Video Assembly Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendVawLog({ event: "diagnostics", details: `assemblyReports=${this.store.count()}` });
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
    action: VideoAssemblyWorkerRunReport["action"],
    input: VideoAssemblyWorkerInput,
    config: VideoAssemblyWorkerConfiguration,
    flags: Partial<
      Pick<
        AssemblyContext,
        | "receivedScript"
        | "receivedVoice"
        | "receivedVisuals"
        | "receivedCreatives"
        | "receivedMusic"
      >
    >,
  ): VideoAssemblyWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.assemblyRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Video Assembly Worker is disabled" : "Assembly rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    this.context = { ...this.context, ...flags };
    const validation = this.validator.validateAssemblyReports(
      null,
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendVawLog({
      event: action,
      details: `script=${this.context.scriptId ?? "pending"} flags=${JSON.stringify(flags)}`,
    });
    return this.report(action, this.getCatalog(), this.store.list(), null, validation, started);
  }

  private runSyncStage(
    action: VideoAssemblyWorkerRunReport["action"],
    input: VideoAssemblyWorkerInput,
    config: VideoAssemblyWorkerConfiguration,
    mode: "sync" | "transitions" | "motion" | "formats",
  ): VideoAssemblyWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.assemblyRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Video Assembly Worker is disabled" : "Assembly rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput({ ...input, validated: input.validated ?? true });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readiness = this.builder.canAssemble(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize("fail", [readiness.reason ?? "Not ready"], [], started);
      this.recovery.recordFailure();
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const seq = Date.now();
    const assets = this.builder.normalizeAssets(this.context, seq);
    this.context = { ...this.context, ...assets };
    let timeline =
      this.context.sceneTimeline?.length
        ? this.context.sceneTimeline
        : this.builder.synchronizeNarrationAndVisuals(this.context, seq);
    if (mode === "sync") {
      timeline = this.builder.synchronizeNarrationAndVisuals(this.context, seq);
    } else if (mode === "transitions") {
      timeline = this.builder.applySceneTransitions(timeline);
    } else if (mode === "motion") {
      timeline = this.builder.applyMotionEffects(
        this.context.sceneTimeline?.length
          ? timeline
          : this.builder.applySceneTransitions(timeline),
      );
    }
    const settings =
      this.context.renderSettings ?? this.builder.buildRenderSettings(this.context, config, seq);
    const formats =
      mode === "formats" || !this.context.outputFormats?.length
        ? this.builder.produceOutputFormats(settings, seq)
        : this.context.outputFormats;
    this.context = {
      ...this.context,
      sceneTimeline: timeline,
      renderSettings: settings,
      outputFormats: formats,
    };
    const report = this.builder.buildAssemblyReport(enriched, config, this.context, {
      sceneTimeline: timeline,
      renderSettings: settings,
      outputFormats: formats,
    });
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateAssemblyReports([report], enriched, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", report);
    appendVawLog({
      event: action,
      details: `assembly=${report.assemblyId} scenes=${timeline.length} formats=${formats.length}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private runFullAssembly(
    action: VideoAssemblyWorkerRunReport["action"],
    input: VideoAssemblyWorkerInput,
    config: VideoAssemblyWorkerConfiguration,
  ): VideoAssemblyWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.assemblyRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Video Assembly Worker is disabled" : "Assembly rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput({ ...input, validated: input.validated ?? true });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readiness = this.builder.canAssemble(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize("fail", [readiness.reason ?? "Not ready"], [], started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const report = this.builder.buildAssemblyReport(enriched, config, this.context);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateAssemblyReports(
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
    appendVawLog({
      event: action,
      details: `assembly=${report.assemblyId} script=${report.scriptId} formats=${report.outputFormats.length}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: VideoAssemblyWorkerRunReport["action"],
    input: VideoAssemblyWorkerInput,
    config: VideoAssemblyWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateAssemblyReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: VideoAssemblyWorkerRunReport["action"],
    config: VideoAssemblyWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: VideoAssemblyWorkerInput) {
    return (
      input.writeScripts === true ||
      input.generateVoiceovers === true ||
      input.generateThumbnails === true ||
      input.publishMedia === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ412OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: VideoAssemblyWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: VideoAssemblyReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `vaw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: VIDEO_ASSEMBLY_WORKER_ID,
      engineVersion: "PILLOW-VAW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...VAW_CAPABILITIES],
      totalAssemblyReports: this.store.count(),
      lastAssemblyId: report?.assemblyId ?? this.store.getLatestAssemblyId(),
      lastScriptId: report?.scriptId ?? null,
      lastVoiceAssetId: report?.voiceAssetId ?? null,
      lastOutputFormatCount: report?.outputFormats.length ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: VAW_METADATA_VERSION,
    };
  }

  private report(
    action: VideoAssemblyWorkerRunReport["action"],
    catalog: VideoAssemblyWorkerCatalog | null,
    assemblyReports: VideoAssemblyReport[],
    latestAssemblyReport: VideoAssemblyReport | null,
    validation: VideoAssemblyWorkerRunReport["validation"],
    started: number,
  ): VideoAssemblyWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      assemblyRunReportId: `vaw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      assemblyReports,
      latestAssemblyReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: VAW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: VideoAssemblyWorkerCatalog): VideoAssemblyWorkerCatalog {
  return {
    ...catalog,
    assemblyReports: catalog.assemblyReports.map((r) => ({
      ...r,
      visualAssetIds: [...r.visualAssetIds],
      creativeAssetIds: [...r.creativeAssetIds],
      sceneTimeline: r.sceneTimeline.map((s) => ({
        ...s,
        visualAssetIds: [...s.visualAssetIds],
        creativeAssetIds: [...s.creativeAssetIds],
      })),
      renderSettings: {
        ...r.renderSettings,
        aspects: [...r.renderSettings.aspects],
        resolutions: [...r.renderSettings.resolutions],
      },
      outputFormats: r.outputFormats.map((f) => ({ ...f })),
      qualityValidation: { ...r.qualityValidation },
      finalVideoReference: {
        ...r.finalVideoReference,
        formats: r.finalVideoReference.formats.map((f) => ({ ...f })),
      },
      traceabilityRefs: [...r.traceabilityRefs],
      preservedDecisions: r.preservedDecisions.map((d) => ({ ...d })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
    supportedAspects: [...catalog.supportedAspects],
    supportedResolutions: [...catalog.supportedResolutions],
  };
}
