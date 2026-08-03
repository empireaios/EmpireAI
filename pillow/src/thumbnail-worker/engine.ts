import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildThumbnailWorkerConfiguration,
  type ThumbnailWorkerConfiguration,
} from "./configuration.js";
import type { ThumbnailWorkerDependencies } from "./integrations.js";
import { ThumbnailWorkerController } from "./thumbnail-worker-controller.js";
import { resetThwLogsForTesting } from "./thw-logging.js";
import { THUMBNAIL_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetThumbnailSequenceForTesting } from "./thumbnail-builder.js";
import { ThumbnailManager } from "./thumbnail-manager.js";
import type {
  ThumbnailWorkerCockpitSnapshot,
  ThumbnailWorkerInput,
  ThumbnailWorkerState,
} from "./types.js";

export interface ThumbnailWorkerOptions {
  configuration?: Partial<ThumbnailWorkerConfiguration>;
  dependencies?: ThumbnailWorkerDependencies;
}

/** Authoritative Q4-07 Thumbnail Worker — concept specifications only. */
export class ThumbnailWorker {
  private initializedAt: string | null = null;
  private readonly controller: ThumbnailWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ThumbnailWorkerOptions = {},
  ) {
    const manager = new ThumbnailManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new ThumbnailWorkerController(
      manager,
      buildThumbnailWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      THUMBNAIL_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Thumbnail Worker")) {
      throw new Error(
        `${THUMBNAIL_WORKER_SYSTEM_PATH} missing — Q4-07 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: ThumbnailWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): ThumbnailWorkerState {
    if (!this.initializedAt) {
      throw new Error("Thumbnail Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-THW-001",
      missionId: "Q4-07",
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
        totalThumbnailReports: engineRecord?.totalThumbnailReports ?? 0,
        lastThumbnailReportId: engineRecord?.lastThumbnailReportId ?? null,
        lastScriptId: engineRecord?.lastScriptId ?? null,
        lastContentFormat: engineRecord?.lastContentFormat ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Thumbnail-only: does not generate final artwork, edit images directly, publish thumbnails, override Pillow or Grand King, or implement Q4-08 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveApprovedScript(input: ThumbnailWorkerInput = {}) {
    return this.controller.receiveApprovedScript(input);
  }

  receiveApprovedHooks(input: ThumbnailWorkerInput = {}) {
    return this.controller.receiveApprovedHooks(input);
  }

  generateThumbnailConcepts(input: ThumbnailWorkerInput = {}) {
    return this.controller.generateThumbnailConcepts(input);
  }

  generateEmotionalTriggers(input: ThumbnailWorkerInput = {}) {
    return this.controller.generateEmotionalTriggers(input);
  }

  generateTextOverlaySuggestions(input: ThumbnailWorkerInput = {}) {
    return this.controller.generateTextOverlaySuggestions(input);
  }

  recommendCompositionAndFraming(input: ThumbnailWorkerInput = {}) {
    return this.controller.recommendCompositionAndFraming(input);
  }

  generateAbVariants(input: ThumbnailWorkerInput = {}) {
    return this.controller.generateAbVariants(input);
  }

  validateScriptConsistency(input: ThumbnailWorkerInput = {}) {
    return this.controller.validateScriptConsistency(input);
  }

  selfReviewThumbnailQuality(input: ThumbnailWorkerInput = {}) {
    return this.controller.selfReviewThumbnailQuality(input);
  }

  produceThumbnailReport(input: ThumbnailWorkerInput = {}) {
    return this.controller.produceThumbnailReport(input);
  }

  submitReport(input: ThumbnailWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: ThumbnailWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getThumbnailReports() {
    return this.controller.getManager().getThumbnailReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestThumbnailReportId() {
    return this.controller.getManager().getLatestThumbnailReportId();
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
        `Thumbnail reports: ${state.health.totalThumbnailReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ThumbnailWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q4-07",
      status: state.status,
      healthStatus: state.health.status,
      totalThumbnailReports: state.health.totalThumbnailReports,
      latestThumbnailReportId: this.getLatestThumbnailReportId(),
      lastScriptId: state.health.lastScriptId,
      lastContentFormat: state.health.lastContentFormat,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverGenerateFinalArtwork: true,
      neverEditImagesDirectly: true,
      neverPublishThumbnails: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createThumbnailWorker(
  bootstrap: EmpireBootstrapContext,
  options?: ThumbnailWorkerOptions,
) {
  return new ThumbnailWorker(bootstrap, options);
}

export function resetThumbnailWorkerForTesting() {
  resetThwLogsForTesting();
  resetThumbnailSequenceForTesting();
}
