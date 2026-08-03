import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildImageCreativeWorkerConfiguration,
  type ImageCreativeWorkerConfiguration,
} from "./configuration.js";
import type { ImageCreativeWorkerDependencies } from "./integrations.js";
import { ImageCreativeWorkerController } from "./image-creative-worker-controller.js";
import { resetIcwLogsForTesting } from "./icw-logging.js";
import { IMAGE_CREATIVE_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetCreativeSequenceForTesting } from "./creative-builder.js";
import { CreativeManager } from "./creative-manager.js";
import type {
  ImageCreativeWorkerCockpitSnapshot,
  ImageCreativeWorkerInput,
  ImageCreativeWorkerState,
} from "./types.js";

export interface ImageCreativeWorkerOptions {
  configuration?: Partial<ImageCreativeWorkerConfiguration>;
  dependencies?: ImageCreativeWorkerDependencies;
}

/** Authoritative Q4-09 Image & Creative Worker — production-ready creative assets. */
export class ImageCreativeWorker {
  private initializedAt: string | null = null;
  private readonly controller: ImageCreativeWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ImageCreativeWorkerOptions = {},
  ) {
    const manager = new CreativeManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new ImageCreativeWorkerController(
      manager,
      buildImageCreativeWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      IMAGE_CREATIVE_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Image & Creative Worker") && !doc?.includes("Image and Creative Worker")) {
      throw new Error(
        `${IMAGE_CREATIVE_WORKER_SYSTEM_PATH} missing — Q4-09 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: ImageCreativeWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): ImageCreativeWorkerState {
    if (!this.initializedAt) {
      throw new Error("Image & Creative Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-ICW-001",
      missionId: "Q4-09",
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
        totalCreativeAssetReports: engineRecord?.totalCreativeAssetReports ?? 0,
        lastCreativeAssetId: engineRecord?.lastCreativeAssetId ?? null,
        lastScriptId: engineRecord?.lastScriptId ?? null,
        lastAssetType: engineRecord?.lastAssetType ?? null,
        lastVariantCount: engineRecord?.lastVariantCount ?? null,
        notes: [
          "Creative-only: does not assemble videos, generate voiceovers, publish media, override Pillow or Grand King, or implement Q4-10 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveVisualResearchReport(input: ImageCreativeWorkerInput = {}) {
    return this.controller.receiveVisualResearchReport(input);
  }

  receiveThumbnailSpecifications(input: ImageCreativeWorkerInput = {}) {
    return this.controller.receiveThumbnailSpecifications(input);
  }

  generateOriginalGraphics(input: ImageCreativeWorkerInput = {}) {
    return this.controller.generateOriginalGraphics(input);
  }

  editExistingImages(input: ImageCreativeWorkerInput = {}) {
    return this.controller.editExistingImages(input);
  }

  createDiagramsAndInfographics(input: ImageCreativeWorkerInput = {}) {
    return this.controller.createDiagramsAndInfographics(input);
  }

  createCoversAndBanners(input: ImageCreativeWorkerInput = {}) {
    return this.controller.createCoversAndBanners(input);
  }

  createSocialMediaAssets(input: ImageCreativeWorkerInput = {}) {
    return this.controller.createSocialMediaAssets(input);
  }

  generateMultipleCreativeVariants(input: ImageCreativeWorkerInput = {}) {
    return this.controller.generateMultipleCreativeVariants(input);
  }

  validateAssetQualityAndCompliance(input: ImageCreativeWorkerInput = {}) {
    return this.controller.validateAssetQualityAndCompliance(input);
  }

  produceCreativeAssetReport(input: ImageCreativeWorkerInput = {}) {
    return this.controller.produceCreativeAssetReport(input);
  }

  submitReport(input: ImageCreativeWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: ImageCreativeWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getCreativeAssetReports() {
    return this.controller.getManager().getCreativeAssetReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestCreativeAssetId() {
    return this.controller.getManager().getLatestCreativeAssetId();
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
        `Creative asset reports: ${state.health.totalCreativeAssetReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ImageCreativeWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q4-09",
      status: state.status,
      healthStatus: state.health.status,
      totalCreativeAssetReports: state.health.totalCreativeAssetReports,
      latestCreativeAssetId: this.getLatestCreativeAssetId(),
      lastScriptId: state.health.lastScriptId,
      lastAssetType: state.health.lastAssetType,
      lastVariantCount: state.health.lastVariantCount,
      workerId: state.configuration.workerId,
      neverAssembleVideos: true,
      neverGenerateVoiceovers: true,
      neverPublishMedia: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createImageCreativeWorker(
  bootstrap: EmpireBootstrapContext,
  options?: ImageCreativeWorkerOptions,
) {
  return new ImageCreativeWorker(bootstrap, options);
}

export function resetImageCreativeWorkerForTesting() {
  resetIcwLogsForTesting();
  resetCreativeSequenceForTesting();
}
