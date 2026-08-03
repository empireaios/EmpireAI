import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { resetAudioSequenceForTesting } from "./audio-builder.js";
import { AudioManager } from "./audio-manager.js";
import {
  buildMusicSoundWorkerConfiguration,
  type MusicSoundWorkerConfiguration,
} from "./configuration.js";
import type { MusicSoundWorkerDependencies } from "./integrations.js";
import { MusicSoundWorkerController } from "./music-sound-worker-controller.js";
import { resetMswLogsForTesting } from "./msw-logging.js";
import { MUSIC_SOUND_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  MusicSoundWorkerCockpitSnapshot,
  MusicSoundWorkerInput,
  MusicSoundWorkerState,
} from "./types.js";

export interface MusicSoundWorkerOptions {
  configuration?: Partial<MusicSoundWorkerConfiguration>;
  dependencies?: MusicSoundWorkerDependencies;
}

/** Authoritative Q4-13 Music & Sound Worker — licensed/generated audio for productions. */
export class MusicSoundWorker {
  private initializedAt: string | null = null;
  private readonly controller: MusicSoundWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: MusicSoundWorkerOptions = {},
  ) {
    const manager = new AudioManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new MusicSoundWorkerController(
      manager,
      buildMusicSoundWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      MUSIC_SOUND_WORKER_SYSTEM_PATH,
    );
    if (
      !doc?.includes("Music & Sound Worker") &&
      !doc?.includes("Music and Sound Worker")
    ) {
      throw new Error(
        `${MUSIC_SOUND_WORKER_SYSTEM_PATH} missing — Q4-13 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: MusicSoundWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): MusicSoundWorkerState {
    if (!this.initializedAt) {
      throw new Error("Music & Sound Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-MSW-001",
      missionId: "Q4-13",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore:
          engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalAudioReports: engineRecord?.totalAudioReports ?? 0,
        lastAudioReportId: engineRecord?.lastAudioReportId ?? null,
        lastScriptId: engineRecord?.lastScriptId ?? null,
        lastVideoId: engineRecord?.lastVideoId ?? null,
        lastLicensingStatus: engineRecord?.lastLicensingStatus ?? null,
        lastMusicAssetCount: engineRecord?.lastMusicAssetCount ?? null,
        notes: [
          "Audio-only: does not assemble videos, publish media, override Pillow or Grand King, use unapproved copyrighted assets, or implement Q4-14 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveApprovedScripts(input: MusicSoundWorkerInput = {}) {
    return this.controller.receiveApprovedScripts(input);
  }

  receiveApprovedVideoTimeline(input: MusicSoundWorkerInput = {}) {
    return this.controller.receiveApprovedVideoTimeline(input);
  }

  determineRequiredMusicMood(input: MusicSoundWorkerInput = {}) {
    return this.controller.determineRequiredMusicMood(input);
  }

  determineRequiredSoundEffects(input: MusicSoundWorkerInput = {}) {
    return this.controller.determineRequiredSoundEffects(input);
  }

  selectLicensedMusic(input: MusicSoundWorkerInput = {}) {
    return this.controller.selectLicensedMusic(input);
  }

  selectGeneratedMusicWhereApproved(input: MusicSoundWorkerInput = {}) {
    return this.controller.selectGeneratedMusicWhereApproved(input);
  }

  matchMusicToScenes(input: MusicSoundWorkerInput = {}) {
    return this.controller.matchMusicToScenes(input);
  }

  matchSoundEffectsToEvents(input: MusicSoundWorkerInput = {}) {
    return this.controller.matchSoundEffectsToEvents(input);
  }

  validateLicensingCompliance(input: MusicSoundWorkerInput = {}) {
    return this.controller.validateLicensingCompliance(input);
  }

  produceMusicSoundReport(input: MusicSoundWorkerInput = {}) {
    return this.controller.produceMusicSoundReport(input);
  }

  submitReport(input: MusicSoundWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: MusicSoundWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getAudioReports() {
    return this.controller.getManager().getAudioReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestAudioReportId() {
    return this.controller.getManager().getLatestAudioReportId();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
  }

  validateForSupervisorSync() {
    const state = this.getState();
    const score =
      state.latestReport?.validation.decision === "fail"
        ? 40
        : state.latestReport?.validation.decision === "partial"
          ? 70
          : 100;
    return {
      valid: state.health.status !== "failed",
      health:
        score >= 75
          ? ("healthy" as const)
          : score >= 50
            ? ("degraded" as const)
            : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Audio reports: ${state.health.totalAudioReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): MusicSoundWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q4-13",
      status: state.status,
      healthStatus: state.health.status,
      totalAudioReports: state.health.totalAudioReports,
      latestAudioReportId: this.getLatestAudioReportId(),
      lastScriptId: state.health.lastScriptId,
      lastVideoId: state.health.lastVideoId,
      lastLicensingStatus: state.health.lastLicensingStatus,
      lastMusicAssetCount: state.health.lastMusicAssetCount,
      workerId: state.configuration.workerId,
      neverAssembleVideos: true,
      neverPublishMedia: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverUseUnapprovedCopyrightedAssets: true,
    };
  }
}

export function createMusicSoundWorker(
  bootstrap: EmpireBootstrapContext,
  options?: MusicSoundWorkerOptions,
) {
  return new MusicSoundWorker(bootstrap, options);
}

export function resetMusicSoundWorkerForTesting() {
  resetMswLogsForTesting();
  resetAudioSequenceForTesting();
}
