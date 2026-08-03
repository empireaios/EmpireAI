import type { VoiceWorkerConfiguration } from "./configuration.js";
import {
  IntegrationCoordinator,
  type VoiceWorkerDependencies,
} from "./integrations.js";
import {
  INTEGRATION_TARGETS,
  VOICE_WORKER_ID,
  VOW_CAPABILITIES,
  VOW_METADATA_VERSION,
} from "./paths.js";
import type {
  OperationalState,
  VoiceContext,
  VoiceReport,
  VoiceWorkerCatalog,
  VoiceWorkerEngineRecord,
  VoiceWorkerInput,
  VoiceWorkerRunReport,
  IntegrationHandshake,
} from "./types.js";
import { VoiceBuilder } from "./voice-builder.js";
import { VoiceStore } from "./voice-store.js";
import { HealthMonitor, RecoveryManager, VoiceValidator } from "./voice-validator.js";
import { appendVowLog } from "./vow-logging.js";

export class VoiceManager {
  private engineRecord: VoiceWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: VoiceWorkerCatalog | null = null;
  private readonly store = new VoiceStore();
  private readonly builder = new VoiceBuilder();
  private readonly validator = new VoiceValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: VoiceContext = {};

  bindIntegrations(deps: VoiceWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: VoiceWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedVoiceReports);
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

  getVoiceReports() {
    return this.store.list();
  }

  getLatestVoiceReportId() {
    return this.store.getLatestVoiceReportId();
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
    config: VoiceWorkerConfiguration,
  ): VoiceWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendVowLog({
      event: "connect",
      details: `Voice Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `vow-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Voice Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: VOW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveApprovedScripts(input: VoiceWorkerInput, config: VoiceWorkerConfiguration) {
    return this.runStage("receive_approved_scripts", input, config, {
      receivedApprovedScript: true,
    });
  }

  prepareNarrationSegments(input: VoiceWorkerInput, config: VoiceWorkerConfiguration) {
    return this.runPrepare("prepare_narration_segments", input, config);
  }

  configureVoiceGenerationSettings(input: VoiceWorkerInput, config: VoiceWorkerConfiguration) {
    return this.runConfigure("configure_voice_generation_settings", input, config);
  }

  supportMultipleVoiceProfiles(input: VoiceWorkerInput, config: VoiceWorkerConfiguration) {
    return this.runConfigure("support_multiple_voice_profiles", input, config);
  }

  supportMultipleLanguages(input: VoiceWorkerInput, config: VoiceWorkerConfiguration) {
    return this.runConfigure("support_multiple_languages", input, config);
  }

  controlPacingAndPronunciation(input: VoiceWorkerInput, config: VoiceWorkerConfiguration) {
    return this.runConfigure("control_pacing_and_pronunciation", input, config);
  }

  generateVoiceoverAssets(input: VoiceWorkerInput, config: VoiceWorkerConfiguration) {
    return this.runGenerateAssets("generate_voiceover_assets", input, config);
  }

  validateVoiceQuality(input: VoiceWorkerInput, config: VoiceWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) {
      return this.boundaryFail("validate_voice_quality", input, config, started);
    }
    const enriched = this.integrations.enrichInput(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    const latest = this.store.list().at(-1);
    if (latest) {
      const { qualityStatus, qualityNotes, confidenceScore } = this.builder.validateVoiceQuality(
        latest.voiceAssetReferences,
        latest.narrationSegments,
        latest.voiceGenerationSettings,
      );
      this.store.save(
        { ...latest, qualityStatus, qualityNotes, confidenceScore },
        "validate_voice_quality",
      );
    }
    const validation = this.validator.validateVoiceReports(
      latest ? [this.store.list().at(-1)!] : null,
      enriched,
      started,
    );
    return this.report(
      "validate_voice_quality",
      this.getCatalog(),
      this.store.list(),
      this.store.list().at(-1) ?? null,
      validation,
      started,
    );
  }

  generateAlternateVoiceVersions(input: VoiceWorkerInput, config: VoiceWorkerConfiguration) {
    return this.runFullGeneration("generate_alternate_voice_versions", input, config);
  }

  produceVoiceReport(input: VoiceWorkerInput, config: VoiceWorkerConfiguration) {
    return this.runFullGeneration("produce_voice_report", input, config);
  }

  submitReport(input: VoiceWorkerInput, config: VoiceWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("submit_report", input, config, started);
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let reports = this.store.list();
    if (input.voiceReportId) {
      const one = this.store.get(input.voiceReportId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runFullGeneration("produce_voice_report", input, config);
      reports = generated.voiceReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) => this.store.markSubmitted(r.voiceReportId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateVoiceReports(
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
    appendVowLog({
      event: "submit_report",
      details: `voiceReports=${reports.length} submitted=${submission.submitted}`,
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

  list(config: VoiceWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateVoiceReports(
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

  validate(input: VoiceWorkerInput, config: VoiceWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateVoiceReports(
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

  diagnostics(config: VoiceWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Voice Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendVowLog({ event: "diagnostics", details: `voiceReports=${this.store.count()}` });
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
    action: VoiceWorkerRunReport["action"],
    input: VoiceWorkerInput,
    config: VoiceWorkerConfiguration,
    flags: { receivedApprovedScript?: boolean },
  ): VoiceWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.voiceRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Voice Worker is disabled" : "Voice rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    if (flags.receivedApprovedScript) {
      this.context = { ...this.context, receivedApprovedScript: true };
    }
    const validation = this.validator.validateVoiceReports(
      null,
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendVowLog({
      event: action,
      details: `script=${this.context.scriptId ?? "pending"} received=${Boolean(this.context.receivedApprovedScript)}`,
    });
    return this.report(action, this.getCatalog(), this.store.list(), null, validation, started);
  }

  private runPrepare(
    action: VoiceWorkerRunReport["action"],
    input: VoiceWorkerInput,
    config: VoiceWorkerConfiguration,
  ): VoiceWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.voiceRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Voice Worker is disabled" : "Voice rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput({ ...input, validated: input.validated ?? true });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readiness = this.builder.canGenerateVoice(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize("fail", [readiness.reason ?? "Not ready"], [], started);
      this.recovery.recordFailure();
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const seq = Date.now();
    const segments = this.builder.prepareNarrationSegments(this.context, seq);
    this.context = { ...this.context, narrationSegments: segments };
    const report = this.builder.buildVoiceReport(enriched, config, this.context, {
      narrationSegments: segments,
      includeVariants: false,
    });
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateVoiceReports([report], enriched, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", report);
    appendVowLog({
      event: action,
      details: `voiceReport=${report.voiceReportId} segments=${segments.length}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private runConfigure(
    action: VoiceWorkerRunReport["action"],
    input: VoiceWorkerInput,
    config: VoiceWorkerConfiguration,
  ): VoiceWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.voiceRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Voice Worker is disabled" : "Voice rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput({ ...input, validated: input.validated ?? true });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readiness = this.builder.canGenerateVoice(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize("fail", [readiness.reason ?? "Not ready"], [], started);
      this.recovery.recordFailure();
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const seq = Date.now();
    const segments =
      this.context.narrationSegments?.length
        ? this.context.narrationSegments
        : this.builder.prepareNarrationSegments(this.context, seq);
    const settings = this.builder.configureVoiceGenerationSettings(this.context, config, seq);
    const history = this.builder.recordConfigurationHistory(
      settings,
      this.context.configurationHistory,
    );
    this.context = {
      ...this.context,
      narrationSegments: segments,
      voiceGenerationSettings: settings,
      configurationHistory: history,
      voiceProfile: settings.voiceProfile,
      language: settings.language,
      speakingSpeed: settings.speakingSpeed,
      tone: settings.tone,
      emotionalStyle: settings.emotionalStyle,
      pauseControlMs: settings.pauseControlMs,
      pronunciationControls: settings.pronunciationControls,
    };
    const report = this.builder.buildVoiceReport(enriched, config, this.context, {
      narrationSegments: segments,
      voiceGenerationSettings: settings,
      includeVariants: false,
    });
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateVoiceReports([report], enriched, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", report);
    appendVowLog({
      event: action,
      details: `settings=${settings.settingsId} profile=${settings.voiceProfile} lang=${settings.language}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private runGenerateAssets(
    action: VoiceWorkerRunReport["action"],
    input: VoiceWorkerInput,
    config: VoiceWorkerConfiguration,
  ): VoiceWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.voiceRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Voice Worker is disabled" : "Voice rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput({ ...input, validated: input.validated ?? true });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readiness = this.builder.canGenerateVoice(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize("fail", [readiness.reason ?? "Not ready"], [], started);
      this.recovery.recordFailure();
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const seq = Date.now();
    const segments =
      this.context.narrationSegments?.length
        ? this.context.narrationSegments
        : this.builder.prepareNarrationSegments(this.context, seq);
    const settings =
      this.context.voiceGenerationSettings ??
      this.builder.configureVoiceGenerationSettings(this.context, config, seq);
    const assets = this.builder.generateVoiceoverAssets(segments, settings, seq);
    this.context = {
      ...this.context,
      narrationSegments: segments,
      voiceGenerationSettings: settings,
      voiceAssetReferences: assets,
    };
    const report = this.builder.buildVoiceReport(enriched, config, this.context, {
      narrationSegments: segments,
      voiceGenerationSettings: settings,
      voiceAssetReferences: assets,
    });
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateVoiceReports([report], enriched, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", report);
    appendVowLog({
      event: action,
      details: `voiceReport=${report.voiceReportId} assets=${assets.length}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private runFullGeneration(
    action: VoiceWorkerRunReport["action"],
    input: VoiceWorkerInput,
    config: VoiceWorkerConfiguration,
  ): VoiceWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.voiceRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Voice Worker is disabled" : "Voice rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput({ ...input, validated: input.validated ?? true });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readiness = this.builder.canGenerateVoice(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize("fail", [readiness.reason ?? "Not ready"], [], started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const report = this.builder.buildVoiceReport(enriched, config, this.context);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateVoiceReports(
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
    appendVowLog({
      event: action,
      details: `voiceReport=${report.voiceReportId} script=${report.scriptId} variants=${report.variantCount}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: VoiceWorkerRunReport["action"],
    input: VoiceWorkerInput,
    config: VoiceWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateVoiceReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: VoiceWorkerRunReport["action"],
    config: VoiceWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: VoiceWorkerInput) {
    return (
      input.rewriteScripts === true ||
      input.assembleVideos === true ||
      input.publishMedia === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ411OrLater === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: VoiceWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: VoiceReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `vow-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: VOICE_WORKER_ID,
      engineVersion: "PILLOW-VOW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...VOW_CAPABILITIES],
      totalVoiceReports: this.store.count(),
      lastVoiceReportId: report?.voiceReportId ?? this.store.getLatestVoiceReportId(),
      lastScriptId: report?.scriptId ?? null,
      lastVoiceProfile: report?.voiceProfile ?? null,
      lastLanguage: report?.language ?? null,
      lastVariantCount: report?.variantCount ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: VOW_METADATA_VERSION,
    };
  }

  private report(
    action: VoiceWorkerRunReport["action"],
    catalog: VoiceWorkerCatalog | null,
    voiceReports: VoiceReport[],
    latestVoiceReport: VoiceReport | null,
    validation: VoiceWorkerRunReport["validation"],
    started: number,
  ): VoiceWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      voiceRunReportId: `vow-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      voiceReports,
      latestVoiceReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: VOW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: VoiceWorkerCatalog): VoiceWorkerCatalog {
  return {
    ...catalog,
    voiceReports: catalog.voiceReports.map((r) => ({
      ...r,
      narrationSegments: r.narrationSegments.map((s) => ({
        ...s,
        pronunciationHints: [...s.pronunciationHints],
      })),
      voiceGenerationSettings: {
        ...r.voiceGenerationSettings,
        pronunciationControls: [...r.voiceGenerationSettings.pronunciationControls],
      },
      voiceAssetReferences: r.voiceAssetReferences.map((a) => ({ ...a })),
      variants: r.variants.map((v) => ({ ...v })),
      configurationHistory: r.configurationHistory.map((c) => ({ ...c })),
      traceabilityRefs: [...r.traceabilityRefs],
      preservedDecisions: r.preservedDecisions.map((d) => ({ ...d })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
    supportedVoiceProfiles: [...catalog.supportedVoiceProfiles],
    supportedLanguages: [...catalog.supportedLanguages],
    voiceCapabilities: [...catalog.voiceCapabilities],
  };
}
