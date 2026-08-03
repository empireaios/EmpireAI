import type { MusicSoundWorkerConfiguration } from "./configuration.js";
import { AudioBuilder } from "./audio-builder.js";
import { AudioStore } from "./audio-store.js";
import { AudioValidator, HealthMonitor, RecoveryManager } from "./audio-validator.js";
import {
  IntegrationCoordinator,
  type MusicSoundWorkerDependencies,
} from "./integrations.js";
import {
  INTEGRATION_TARGETS,
  MSW_CAPABILITIES,
  MSW_METADATA_VERSION,
  MUSIC_SOUND_WORKER_ID,
} from "./paths.js";
import { appendMswLog } from "./msw-logging.js";
import type {
  AudioContext,
  IntegrationHandshake,
  MusicSoundReport,
  MusicSoundWorkerCatalog,
  MusicSoundWorkerEngineRecord,
  MusicSoundWorkerInput,
  MusicSoundWorkerRunReport,
  OperationalState,
} from "./types.js";

export class AudioManager {
  private engineRecord: MusicSoundWorkerEngineRecord | null = null;
  private seeded = false;
  private catalog: MusicSoundWorkerCatalog | null = null;
  private readonly store = new AudioStore();
  private readonly builder = new AudioBuilder();
  private readonly validator = new AudioValidator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recovery = new RecoveryManager();
  private readonly integrations = new IntegrationCoordinator();
  private handshakes: IntegrationHandshake[] = [];
  private context: AudioContext = {};

  bindIntegrations(deps: MusicSoundWorkerDependencies = {}) {
    this.integrations.bind(deps);
  }

  ensureSeeded(config: MusicSoundWorkerConfiguration) {
    if (this.seeded) return;
    this.store.seed(config.seedAudioReports);
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

  getAudioReports() {
    return this.store.list();
  }

  getLatestAudioReportId() {
    return this.store.getLatestAudioReportId();
  }

  getAuditTrail() {
    return this.store.getAuditTrail();
  }

  getIntegrations() {
    return this.handshakes.map((h) => ({ ...h }));
  }

  connect(
    _input: Record<string, unknown>,
    config: MusicSoundWorkerConfiguration,
  ): MusicSoundWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    this.handshakes = this.integrations.connect(
      config.workerId,
      config.integrationTargets.length ? config.integrationTargets : [...INTEGRATION_TARGETS],
    );
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    this.ensureRecord("connected", config);
    appendMswLog({
      event: "connect",
      details: `Music & Sound Worker connected; integrations=${this.handshakes.length}`,
    });
    return this.report(
      "connect",
      this.getCatalog(),
      [],
      null,
      {
        validationReportId: `msw-val-${Date.now()}`,
        validationTimestamp: new Date().toISOString(),
        decision: config.enabled ? "pass" : "fail",
        errors: config.enabled ? [] : ["Music & Sound Worker is disabled"],
        warnings: [],
        durationMs: Date.now() - started,
        metadataVersion: MSW_METADATA_VERSION,
      },
      started,
    );
  }

  receiveApprovedScripts(input: MusicSoundWorkerInput, config: MusicSoundWorkerConfiguration) {
    return this.runReceive("receive_approved_scripts", input, config, { receivedScript: true });
  }

  receiveApprovedVideoTimeline(
    input: MusicSoundWorkerInput,
    config: MusicSoundWorkerConfiguration,
  ) {
    return this.runReceive("receive_approved_video_timeline", input, config, {
      receivedTimeline: true,
    });
  }

  determineRequiredMusicMood(input: MusicSoundWorkerInput, config: MusicSoundWorkerConfiguration) {
    return this.runPrepare("determine_required_music_mood", input, config, "mood");
  }

  determineRequiredSoundEffects(
    input: MusicSoundWorkerInput,
    config: MusicSoundWorkerConfiguration,
  ) {
    return this.runPrepare("determine_required_sound_effects", input, config, "sfx_needs");
  }

  selectLicensedMusic(input: MusicSoundWorkerInput, config: MusicSoundWorkerConfiguration) {
    return this.runPrepare("select_licensed_music", input, config, "licensed");
  }

  selectGeneratedMusicWhereApproved(
    input: MusicSoundWorkerInput,
    config: MusicSoundWorkerConfiguration,
  ) {
    return this.runPrepare("select_generated_music_where_approved", input, config, "generated");
  }

  matchMusicToScenes(input: MusicSoundWorkerInput, config: MusicSoundWorkerConfiguration) {
    return this.runPrepare("match_music_to_scenes", input, config, "match_music");
  }

  matchSoundEffectsToEvents(input: MusicSoundWorkerInput, config: MusicSoundWorkerConfiguration) {
    return this.runPrepare("match_sound_effects_to_events", input, config, "match_sfx");
  }

  validateLicensingCompliance(
    input: MusicSoundWorkerInput,
    config: MusicSoundWorkerConfiguration,
  ) {
    return this.runPrepare("validate_licensing_compliance", input, config, "licensing");
  }

  produceMusicSoundReport(input: MusicSoundWorkerInput, config: MusicSoundWorkerConfiguration) {
    return this.runFull("produce_music_sound_report", input, config);
  }

  submitReport(input: MusicSoundWorkerInput, config: MusicSoundWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    if (this.hasBoundary(input)) return this.boundaryFail("submit_report", input, config, started);
    if (!config.executiveReportingEnabled) {
      return this.disabled("submit_report", config, "Executive reporting submission is disabled");
    }
    let reports = this.store.list();
    if (input.audioReportId) {
      const one = this.store.get(input.audioReportId);
      reports = one ? [one] : [];
    }
    if (!reports.length) {
      const generated = this.runFull("produce_music_sound_report", input, config);
      reports = generated.audioReports;
      if (!reports.length || generated.validation.decision === "fail") return generated;
    }
    const submission = this.integrations.submitReport(reports);
    if (submission.submitted && submission.executiveReportId) {
      reports = reports.map(
        (r) => this.store.markSubmitted(r.audioReportId, submission.executiveReportId!) ?? r,
      );
    }
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateAudioReports(
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
    appendMswLog({
      event: "submit_report",
      details: `audioReports=${reports.length} submitted=${submission.submitted}`,
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

  list(config: MusicSoundWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateAudioReports(
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

  validate(input: MusicSoundWorkerInput, config: MusicSoundWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const reports = this.store.list();
    const latest = reports[reports.length - 1] ?? null;
    const validation = this.validator.validateAudioReports(
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

  diagnostics(config: MusicSoundWorkerConfiguration) {
    const started = Date.now();
    this.ensureSeeded(config);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.finalize(
      config.enabled ? "pass" : "fail",
      config.enabled ? [] : ["Music & Sound Worker is disabled"],
      [],
      started,
    );
    this.ensureRecord("active", config);
    appendMswLog({ event: "diagnostics", details: `audioReports=${this.store.count()}` });
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
    action: MusicSoundWorkerRunReport["action"],
    input: MusicSoundWorkerInput,
    config: MusicSoundWorkerConfiguration,
    flags: Partial<Pick<AudioContext, "receivedScript" | "receivedTimeline">>,
  ): MusicSoundWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.audioRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Music & Sound Worker is disabled" : "Audio rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput(input);
    this.context = this.builder.mergeContext(enriched, this.context);
    this.context = { ...this.context, ...flags };
    const validation = this.validator.validateAudioReports(
      null,
      { ...enriched, validated: enriched.validated ?? true },
      started,
    );
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed");
    appendMswLog({
      event: action,
      details: `script=${this.context.scriptId ?? "pending"} flags=${JSON.stringify(flags)}`,
    });
    return this.report(action, this.getCatalog(), this.store.list(), null, validation, started);
  }

  private runPrepare(
    action: MusicSoundWorkerRunReport["action"],
    input: MusicSoundWorkerInput,
    config: MusicSoundWorkerConfiguration,
    mode:
      | "mood"
      | "sfx_needs"
      | "licensed"
      | "generated"
      | "match_music"
      | "match_sfx"
      | "licensing",
  ): MusicSoundWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.audioRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Music & Sound Worker is disabled" : "Audio rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput({ ...input, validated: input.validated ?? true });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readiness = this.builder.canPrepareAudio(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize("fail", [readiness.reason ?? "Not ready"], [], started);
      this.recovery.recordFailure();
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const seq = Date.now();
    const mood = this.builder.determineRequiredMusicMood(this.context, config);
    const requiredSfx = this.builder.determineRequiredSoundEffects(this.context);
    const allowGenerated =
      this.context.allowGeneratedMusic ?? config.allowGeneratedMusicByDefault;
    let music =
      this.context.backgroundMusicAssets?.length
        ? this.context.backgroundMusicAssets
        : this.builder.selectLicensedMusic(mood, seq);
    if (mode === "licensed") {
      music = this.builder.selectLicensedMusic(mood, seq);
    }
    if (mode === "generated" || (mode !== "licensed" && allowGenerated && !this.context.backgroundMusicAssets?.length)) {
      const generated = this.builder.selectGeneratedMusicWhereApproved(mood, allowGenerated, seq);
      music = mode === "generated" ? [...music.filter((m) => m.source !== "generated"), ...generated] : [...music, ...generated];
    }
    if (mode === "generated") {
      music = [
        ...this.builder.selectLicensedMusic(mood, seq),
        ...this.builder.selectGeneratedMusicWhereApproved(mood, true, seq),
      ];
    }
    const sfx =
      mode === "sfx_needs" || !this.context.soundEffectAssets?.length
        ? this.builder.selectSoundEffects(requiredSfx, seq)
        : this.context.soundEffectAssets;
    let timeline =
      this.context.sceneTimeline?.length
        ? this.context.sceneTimeline
        : this.builder.buildSceneTimeline(this.context, mood, music, sfx, seq);
    if (mode === "match_music" || mode === "match_sfx" || !this.context.sceneTimeline?.length) {
      timeline = this.builder.matchMusicToScenes(timeline, music);
      timeline = this.builder.matchSoundEffectsToEvents(timeline, sfx);
    }
    const placement = this.builder.buildAudioPlacement(timeline);
    const licensing = this.builder.validateLicensingCompliance(music, sfx);
    this.context = {
      ...this.context,
      requiredMood: mood,
      requiredSoundEffects: requiredSfx,
      backgroundMusicAssets: music,
      soundEffectAssets: sfx,
      sceneTimeline: timeline,
      audioPlacement: placement,
      licensingStatus: licensing.licensingStatus,
    };
    const report = this.builder.buildMusicSoundReport(enriched, config, this.context, {
      backgroundMusicAssets: music,
      soundEffectAssets: sfx,
      sceneTimeline: timeline,
      audioPlacement: placement,
      licensingStatus: licensing.licensingStatus,
      qualityValidation: licensing.quality,
      requiredMood: mood,
      requiredSoundEffects: requiredSfx,
    });
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateAudioReports([report], enriched, started);
    if (validation.decision === "fail") this.recovery.recordFailure();
    else this.recovery.reset();
    this.ensureRecord("active", config, validation.decision === "fail" ? "failed" : "passed", report);
    appendMswLog({
      event: action,
      details: `audioReport=${report.audioReportId} music=${music.length} sfx=${sfx.length}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private runFull(
    action: MusicSoundWorkerRunReport["action"],
    input: MusicSoundWorkerInput,
    config: MusicSoundWorkerConfiguration,
  ): MusicSoundWorkerRunReport {
    const started = Date.now();
    this.ensureSeeded(config);
    if (!config.enabled || !config.audioRulesEnabled) {
      return this.disabled(
        action,
        config,
        !config.enabled ? "Music & Sound Worker is disabled" : "Audio rules are disabled",
      );
    }
    if (this.hasBoundary(input)) return this.boundaryFail(action, input, config, started);
    const enriched = this.integrations.enrichInput({ ...input, validated: input.validated ?? true });
    this.context = this.builder.mergeContext(enriched, this.context);
    const readiness = this.builder.canPrepareAudio(this.context);
    if (!readiness.ready) {
      const validation = this.validator.finalize("fail", [readiness.reason ?? "Not ready"], [], started);
      this.recovery.recordFailure();
      this.ensureRecord("failed", config, "failed");
      return this.report(action, this.getCatalog(), [], null, validation, started);
    }
    const report = this.builder.buildMusicSoundReport(enriched, config, this.context);
    this.store.save(report, action);
    this.catalog = this.builder.buildCatalog(config, this.store.list(), this.handshakes);
    const validation = this.validator.validateAudioReports(
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
    appendMswLog({
      event: action,
      details: `audioReport=${report.audioReportId} script=${report.scriptId} licensing=${report.licensingStatus}`,
    });
    return this.report(action, this.getCatalog(), [report], report, validation, started);
  }

  private boundaryFail(
    action: MusicSoundWorkerRunReport["action"],
    input: MusicSoundWorkerInput,
    config: MusicSoundWorkerConfiguration,
    started: number,
  ) {
    const validation = this.validator.validateAudioReports(null, input, started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private disabled(
    action: MusicSoundWorkerRunReport["action"],
    config: MusicSoundWorkerConfiguration,
    message: string,
  ) {
    const started = Date.now();
    const validation = this.validator.finalize("fail", [message], [], started);
    this.recovery.recordFailure();
    this.ensureRecord("failed", config, "failed");
    return this.report(action, this.getCatalog(), [], null, validation, started);
  }

  private hasBoundary(input: MusicSoundWorkerInput) {
    return (
      input.assembleVideos === true ||
      input.publishMedia === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.implementQ414OrLater === true ||
      input.useUnapprovedCopyrightedAssets === true
    );
  }

  private ensureRecord(
    state: OperationalState,
    config: MusicSoundWorkerConfiguration,
    validationStatus: "pending" | "passed" | "partial" | "failed" = "passed",
    latest: MusicSoundReport | null = null,
  ) {
    const report = latest ?? this.store.list().at(-1) ?? null;
    this.engineRecord = {
      engineRecordId: this.engineRecord?.engineRecordId ?? `msw-eng-${Date.now()}`,
      timestamp: new Date().toISOString(),
      engineId: MUSIC_SOUND_WORKER_ID,
      engineVersion: "PILLOW-MSW-001",
      currentOperationalState: state,
      healthStatus: this.healthMonitor.status(
        validationStatus === "failed" ? "fail" : "pass",
        config.enabled,
      ),
      validationStatus,
      supportedCapabilities: [...MSW_CAPABILITIES],
      totalAudioReports: this.store.count(),
      lastAudioReportId: report?.audioReportId ?? this.store.getLatestAudioReportId(),
      lastScriptId: report?.scriptId ?? null,
      lastVideoId: report?.videoId ?? null,
      lastLicensingStatus: report?.licensingStatus ?? null,
      lastMusicAssetCount: report?.backgroundMusicAssets.length ?? null,
      workerId: config.workerId,
      integrationTargets: [...INTEGRATION_TARGETS],
      metadataVersion: MSW_METADATA_VERSION,
    };
  }

  private report(
    action: MusicSoundWorkerRunReport["action"],
    catalog: MusicSoundWorkerCatalog | null,
    audioReports: MusicSoundReport[],
    latestAudioReport: MusicSoundReport | null,
    validation: MusicSoundWorkerRunReport["validation"],
    started: number,
  ): MusicSoundWorkerRunReport {
    const engineRecord = this.getEngineRecord()!;
    return {
      audioRunReportId: `msw-run-${Date.now()}`,
      runTimestamp: new Date().toISOString(),
      action,
      engineRecord,
      catalog,
      audioReports,
      latestAudioReport,
      integrations: this.getIntegrations(),
      validation,
      durationMs: Date.now() - started,
      metadataVersion: MSW_METADATA_VERSION,
    };
  }
}

function cloneCatalog(catalog: MusicSoundWorkerCatalog): MusicSoundWorkerCatalog {
  return {
    ...catalog,
    audioReports: catalog.audioReports.map((r) => ({
      ...r,
      backgroundMusicAssets: r.backgroundMusicAssets.map((a) => ({ ...a })),
      soundEffectAssets: r.soundEffectAssets.map((a) => ({ ...a })),
      sceneTimeline: r.sceneTimeline.map((s) => ({
        ...s,
        soundEffectAssetIds: [...s.soundEffectAssetIds],
      })),
      audioPlacement: r.audioPlacement.map((p) => ({ ...p })),
      qualityValidation: { ...r.qualityValidation },
      requiredSoundEffects: [...r.requiredSoundEffects],
      traceabilityRefs: [...r.traceabilityRefs],
      preservedDecisions: r.preservedDecisions.map((d) => ({ ...d })),
    })),
    integrations: catalog.integrations.map((i) => ({ ...i })),
    supportedAudioTypes: [...catalog.supportedAudioTypes],
    supportedMoods: [...catalog.supportedMoods],
  };
}
