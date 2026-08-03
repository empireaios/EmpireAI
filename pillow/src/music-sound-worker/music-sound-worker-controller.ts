import type { MusicSoundWorkerConfiguration } from "./configuration.js";
import type { MusicSoundWorkerDependencies } from "./integrations.js";
import { AudioManager } from "./audio-manager.js";
import type {
  EngineStatus,
  MusicSoundWorkerInput,
  MusicSoundWorkerRunReport,
} from "./types.js";

export class MusicSoundWorkerController {
  private status: EngineStatus = "idle";
  private latestReport: MusicSoundWorkerRunReport | null = null;

  constructor(
    private readonly manager: AudioManager,
    private readonly config: MusicSoundWorkerConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  bindIntegrations(deps: MusicSoundWorkerDependencies = {}) {
    this.manager.bindIntegrations(deps);
  }

  getStatus() {
    return this.status;
  }

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return {
      ...this.config,
      integrationTargets: [...this.config.integrationTargets],
      supportedAudioTypes: [...this.config.supportedAudioTypes],
      supportedMoods: [...this.config.supportedMoods],
      reportingLine: [...this.config.reportingLine],
      seedAudioReports: this.config.seedAudioReports.map((report) => ({
        ...report,
        backgroundMusicAssets: report.backgroundMusicAssets.map((a) => ({ ...a })),
        soundEffectAssets: report.soundEffectAssets.map((a) => ({ ...a })),
        sceneTimeline: report.sceneTimeline.map((s) => ({
          ...s,
          soundEffectAssetIds: [...s.soundEffectAssetIds],
        })),
        audioPlacement: report.audioPlacement.map((p) => ({ ...p })),
        qualityValidation: { ...report.qualityValidation },
        requiredSoundEffects: [...report.requiredSoundEffects],
        traceabilityRefs: [...report.traceabilityRefs],
        preservedDecisions: report.preservedDecisions.map((d) => ({ ...d })),
      })),
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  receiveApprovedScripts(input: MusicSoundWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveApprovedScripts(input, this.config));
  }

  receiveApprovedVideoTimeline(input: MusicSoundWorkerInput = {}) {
    this.status = "receiving";
    return this.finish(this.manager.receiveApprovedVideoTimeline(input, this.config));
  }

  determineRequiredMusicMood(input: MusicSoundWorkerInput = {}) {
    this.status = "analyzing";
    return this.finish(this.manager.determineRequiredMusicMood(input, this.config));
  }

  determineRequiredSoundEffects(input: MusicSoundWorkerInput = {}) {
    this.status = "analyzing";
    return this.finish(this.manager.determineRequiredSoundEffects(input, this.config));
  }

  selectLicensedMusic(input: MusicSoundWorkerInput = {}) {
    this.status = "selecting";
    return this.finish(this.manager.selectLicensedMusic(input, this.config));
  }

  selectGeneratedMusicWhereApproved(input: MusicSoundWorkerInput = {}) {
    this.status = "selecting";
    return this.finish(this.manager.selectGeneratedMusicWhereApproved(input, this.config));
  }

  matchMusicToScenes(input: MusicSoundWorkerInput = {}) {
    this.status = "matching";
    return this.finish(this.manager.matchMusicToScenes(input, this.config));
  }

  matchSoundEffectsToEvents(input: MusicSoundWorkerInput = {}) {
    this.status = "matching";
    return this.finish(this.manager.matchSoundEffectsToEvents(input, this.config));
  }

  validateLicensingCompliance(input: MusicSoundWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validateLicensingCompliance(input, this.config));
  }

  produceMusicSoundReport(input: MusicSoundWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.produceMusicSoundReport(input, this.config));
  }

  submitReport(input: MusicSoundWorkerInput = {}) {
    this.status = "reporting";
    return this.finish(this.manager.submitReport(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: MusicSoundWorkerInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: MusicSoundWorkerRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
