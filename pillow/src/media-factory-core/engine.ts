import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildMediaFactoryCoreConfiguration,
  type MediaFactoryCoreConfiguration,
} from "./configuration.js";
import type { MediaFactoryCoreDependencies } from "./integrations.js";
import { MediaFactoryCoreController } from "./media-factory-core-controller.js";
import { resetMfcLogsForTesting } from "./mfc-logging.js";
import { MEDIA_FACTORY_CORE_SYSTEM_PATH } from "./paths.js";
import { resetMissionSequenceForTesting } from "./mission-builder.js";
import { MediaFactoryManager } from "./factory-manager.js";
import type {
  MediaFactoryCoreCockpitSnapshot,
  MediaFactoryCoreInput,
  MediaFactoryCoreState,
} from "./types.js";

export interface MediaFactoryCoreOptions {
  configuration?: Partial<MediaFactoryCoreConfiguration>;
  dependencies?: MediaFactoryCoreDependencies;
}

/** Authoritative Q4-01 Media Factory Core — executive orchestration only. */
export class MediaFactoryCore {
  private initializedAt: string | null = null;
  private readonly controller: MediaFactoryCoreController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: MediaFactoryCoreOptions = {},
  ) {
    const manager = new MediaFactoryManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new MediaFactoryCoreController(
      manager,
      buildMediaFactoryCoreConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      MEDIA_FACTORY_CORE_SYSTEM_PATH,
    );
    if (!doc?.includes("Media Factory Core")) {
      throw new Error(
        `${MEDIA_FACTORY_CORE_SYSTEM_PATH} missing — Q4-01 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: MediaFactoryCoreDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): MediaFactoryCoreState {
    if (!this.initializedAt) {
      throw new Error("Media Factory Core not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-MFC-001",
      missionId: "Q4-01",
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
        totalMissions: engineRecord?.totalMissions ?? 0,
        lastMissionId: engineRecord?.lastMissionId ?? null,
        notes: [
          "Orchestration-only: does not write scripts, generate images/videos, publish directly, bypass approval, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  createMediaBusinessMission(input: MediaFactoryCoreInput = {}) {
    return this.controller.createMediaBusinessMission(input);
  }

  registerChannel(input: MediaFactoryCoreInput = {}) {
    return this.controller.registerChannel(input);
  }

  registerPipeline(input: MediaFactoryCoreInput = {}) {
    return this.controller.registerPipeline(input);
  }

  manageLifecycle(input: MediaFactoryCoreInput = {}) {
    return this.controller.manageLifecycle(input);
  }

  coordinateWorkers(input: MediaFactoryCoreInput = {}) {
    return this.controller.coordinateWorkers(input);
  }

  coordinateApproval(input: MediaFactoryCoreInput = {}) {
    return this.controller.coordinateApproval(input);
  }

  coordinatePublishing(input: MediaFactoryCoreInput = {}) {
    return this.controller.coordinatePublishing(input);
  }

  coordinateAnalytics(input: MediaFactoryCoreInput = {}) {
    return this.controller.coordinateAnalytics(input);
  }

  coordinateLearning(input: MediaFactoryCoreInput = {}) {
    return this.controller.coordinateLearning(input);
  }

  trackProduction(input: MediaFactoryCoreInput = {}) {
    return this.controller.trackProduction(input);
  }

  trackPublishing(input: MediaFactoryCoreInput = {}) {
    return this.controller.trackPublishing(input);
  }

  produceReport(input: MediaFactoryCoreInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: MediaFactoryCoreInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: MediaFactoryCoreInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getMissions() {
    return this.controller.getManager().getMissions();
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestMissionId() {
    return this.controller.getManager().getLatestMissionId();
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
        `Media missions: ${state.health.totalMissions}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): MediaFactoryCoreCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q4-01",
      status: state.status,
      healthStatus: state.health.status,
      totalMissions: state.health.totalMissions,
      latestMissionId: this.getLatestMissionId(),
      workerId: state.configuration.workerId,
      neverWriteScripts: true,
      neverGenerateImages: true,
      neverGenerateVideos: true,
      neverPublishDirectly: true,
      neverBypassApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createMediaFactoryCore(
  bootstrap: EmpireBootstrapContext,
  options?: MediaFactoryCoreOptions,
) {
  return new MediaFactoryCore(bootstrap, options);
}

export function resetMediaFactoryCoreForTesting() {
  resetMfcLogsForTesting();
  resetMissionSequenceForTesting();
}
