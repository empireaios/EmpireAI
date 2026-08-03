import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { resetAssemblySequenceForTesting } from "./assembly-builder.js";
import { AssemblyManager } from "./assembly-manager.js";
import {
  buildVideoAssemblyWorkerConfiguration,
  type VideoAssemblyWorkerConfiguration,
} from "./configuration.js";
import type { VideoAssemblyWorkerDependencies } from "./integrations.js";
import { VIDEO_ASSEMBLY_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  VideoAssemblyWorkerCockpitSnapshot,
  VideoAssemblyWorkerInput,
  VideoAssemblyWorkerState,
} from "./types.js";
import { resetVawLogsForTesting } from "./vaw-logging.js";
import { VideoAssemblyWorkerController } from "./video-assembly-worker-controller.js";

export interface VideoAssemblyWorkerOptions {
  configuration?: Partial<VideoAssemblyWorkerConfiguration>;
  dependencies?: VideoAssemblyWorkerDependencies;
}

/** Authoritative Q4-11 Video Assembly Worker — production-ready assembled videos. */
export class VideoAssemblyWorker {
  private initializedAt: string | null = null;
  private readonly controller: VideoAssemblyWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: VideoAssemblyWorkerOptions = {},
  ) {
    const manager = new AssemblyManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new VideoAssemblyWorkerController(
      manager,
      buildVideoAssemblyWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      VIDEO_ASSEMBLY_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Video Assembly Worker")) {
      throw new Error(
        `${VIDEO_ASSEMBLY_WORKER_SYSTEM_PATH} missing — Q4-11 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: VideoAssemblyWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): VideoAssemblyWorkerState {
    if (!this.initializedAt) {
      throw new Error("Video Assembly Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-VAW-001",
      missionId: "Q4-11",
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
        totalAssemblyReports: engineRecord?.totalAssemblyReports ?? 0,
        lastAssemblyId: engineRecord?.lastAssemblyId ?? null,
        lastScriptId: engineRecord?.lastScriptId ?? null,
        lastVoiceAssetId: engineRecord?.lastVoiceAssetId ?? null,
        lastOutputFormatCount: engineRecord?.lastOutputFormatCount ?? null,
        notes: [
          "Assembly-only: does not write scripts, generate voiceovers or thumbnails, publish media, override Pillow or Grand King, or implement Q4-12 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveApprovedScripts(input: VideoAssemblyWorkerInput = {}) {
    return this.controller.receiveApprovedScripts(input);
  }

  receiveApprovedVoiceAssets(input: VideoAssemblyWorkerInput = {}) {
    return this.controller.receiveApprovedVoiceAssets(input);
  }

  receiveApprovedVisualAssets(input: VideoAssemblyWorkerInput = {}) {
    return this.controller.receiveApprovedVisualAssets(input);
  }

  receiveApprovedCreativeAssets(input: VideoAssemblyWorkerInput = {}) {
    return this.controller.receiveApprovedCreativeAssets(input);
  }

  receiveApprovedMusicAssets(input: VideoAssemblyWorkerInput = {}) {
    return this.controller.receiveApprovedMusicAssets(input);
  }

  synchronizeNarrationAndVisuals(input: VideoAssemblyWorkerInput = {}) {
    return this.controller.synchronizeNarrationAndVisuals(input);
  }

  applySceneTransitions(input: VideoAssemblyWorkerInput = {}) {
    return this.controller.applySceneTransitions(input);
  }

  applyMotionEffects(input: VideoAssemblyWorkerInput = {}) {
    return this.controller.applyMotionEffects(input);
  }

  produceMultipleOutputResolutions(input: VideoAssemblyWorkerInput = {}) {
    return this.controller.produceMultipleOutputResolutions(input);
  }

  validateRenderingQuality(input: VideoAssemblyWorkerInput = {}) {
    return this.controller.validateRenderingQuality(input);
  }

  produceVideoAssemblyReport(input: VideoAssemblyWorkerInput = {}) {
    return this.controller.produceVideoAssemblyReport(input);
  }

  submitReport(input: VideoAssemblyWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: VideoAssemblyWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getAssemblyReports() {
    return this.controller.getManager().getAssemblyReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestAssemblyId() {
    return this.controller.getManager().getLatestAssemblyId();
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
        `Assembly reports: ${state.health.totalAssemblyReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): VideoAssemblyWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q4-11",
      status: state.status,
      healthStatus: state.health.status,
      totalAssemblyReports: state.health.totalAssemblyReports,
      latestAssemblyId: this.getLatestAssemblyId(),
      lastScriptId: state.health.lastScriptId,
      lastVoiceAssetId: state.health.lastVoiceAssetId,
      lastOutputFormatCount: state.health.lastOutputFormatCount,
      workerId: state.configuration.workerId,
      neverWriteScripts: true,
      neverGenerateVoiceovers: true,
      neverGenerateThumbnails: true,
      neverPublishMedia: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createVideoAssemblyWorker(
  bootstrap: EmpireBootstrapContext,
  options?: VideoAssemblyWorkerOptions,
) {
  return new VideoAssemblyWorker(bootstrap, options);
}

export function resetVideoAssemblyWorkerForTesting() {
  resetVawLogsForTesting();
  resetAssemblySequenceForTesting();
}
