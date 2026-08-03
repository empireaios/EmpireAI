import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { resetReviewSequenceForTesting } from "./review-builder.js";
import { ReviewManager } from "./review-manager.js";
import {
  buildMediaExecutiveReviewWorkerConfiguration,
  type MediaExecutiveReviewWorkerConfiguration,
} from "./configuration.js";
import type { MediaExecutiveReviewWorkerDependencies } from "./integrations.js";
import { MediaExecutiveReviewWorkerController } from "./media-executive-review-worker-controller.js";
import { resetMerLogsForTesting } from "./mer-logging.js";
import { MEDIA_EXECUTIVE_REVIEW_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  MediaExecutiveReviewWorkerCockpitSnapshot,
  MediaExecutiveReviewWorkerInput,
  MediaExecutiveReviewWorkerState,
} from "./types.js";

export interface MediaExecutiveReviewWorkerOptions {
  configuration?: Partial<MediaExecutiveReviewWorkerConfiguration>;
  dependencies?: MediaExecutiveReviewWorkerDependencies;
}

/** Authoritative Q4-18 Media Executive Review Worker — review signals only, never publish media. */
export class MediaExecutiveReviewWorker {
  private initializedAt: string | null = null;
  private readonly controller: MediaExecutiveReviewWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: MediaExecutiveReviewWorkerOptions = {},
  ) {
    const manager = new ReviewManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new MediaExecutiveReviewWorkerController(
      manager,
      buildMediaExecutiveReviewWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      MEDIA_EXECUTIVE_REVIEW_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Media Executive Review Worker")) {
      throw new Error(
        `${MEDIA_EXECUTIVE_REVIEW_WORKER_SYSTEM_PATH} missing — Q4-18 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: MediaExecutiveReviewWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): MediaExecutiveReviewWorkerState {
    if (!this.initializedAt) {
      throw new Error(
        "Media Executive Review Worker not initialized. Call initialize() first.",
      );
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-MER-001",
      missionId: "Q4-18",
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
        totalReviewReports: engineRecord?.totalReviewReports ?? 0,
        lastReviewId: engineRecord?.lastReviewId ?? null,
        lastMediaId: engineRecord?.lastMediaId ?? null,
        lastChannelId: engineRecord?.lastChannelId ?? null,
        lastExecutiveRecommendation: engineRecord?.lastExecutiveRecommendation ?? null,
        lastNeverPublishMedia: engineRecord?.lastNeverPublishMedia ?? null,
        notes: [
          "Media executive review only: does not publish media, rewrite scripts, edit media assets, modify approved assets, override Pillow or Grand King, bypass Pillow governance, or implement Q4-19 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveAllCompletedMediaFactoryOutputs(input: MediaExecutiveReviewWorkerInput = {}) {
    return this.controller.receiveAllCompletedMediaFactoryOutputs(input);
  }

  verifyEditorialCompliance(input: MediaExecutiveReviewWorkerInput = {}) {
    return this.controller.verifyEditorialCompliance(input);
  }

  verifyScriptQuality(input: MediaExecutiveReviewWorkerInput = {}) {
    return this.controller.verifyScriptQuality(input);
  }

  verifyThumbnailQuality(input: MediaExecutiveReviewWorkerInput = {}) {
    return this.controller.verifyThumbnailQuality(input);
  }

  verifyVisualAssetReadiness(input: MediaExecutiveReviewWorkerInput = {}) {
    return this.controller.verifyVisualAssetReadiness(input);
  }

  verifyVoiceAndSubtitleReadiness(input: MediaExecutiveReviewWorkerInput = {}) {
    return this.controller.verifyVoiceAndSubtitleReadiness(input);
  }

  verifyPublishingPackageCompleteness(input: MediaExecutiveReviewWorkerInput = {}) {
    return this.controller.verifyPublishingPackageCompleteness(input);
  }

  verifyAnalyticsAndLearningTraceability(input: MediaExecutiveReviewWorkerInput = {}) {
    return this.controller.verifyAnalyticsAndLearningTraceability(input);
  }

  identifyOutstandingIssues(input: MediaExecutiveReviewWorkerInput = {}) {
    return this.controller.identifyOutstandingIssues(input);
  }

  recommendApproveReviseOrReject(input: MediaExecutiveReviewWorkerInput = {}) {
    return this.controller.recommendApproveReviseOrReject(input);
  }

  produceMediaExecutiveReviewReport(input: MediaExecutiveReviewWorkerInput = {}) {
    return this.controller.produceMediaExecutiveReviewReport(input);
  }

  submitReport(input: MediaExecutiveReviewWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: MediaExecutiveReviewWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getReviewReports() {
    return this.controller.getManager().getReviewReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestReviewId() {
    return this.controller.getManager().getLatestReviewId();
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
        `Review reports: ${state.health.totalReviewReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): MediaExecutiveReviewWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q4-18",
      status: state.status,
      healthStatus: state.health.status,
      totalReviewReports: state.health.totalReviewReports,
      latestReviewId: this.getLatestReviewId(),
      lastMediaId: state.health.lastMediaId,
      lastChannelId: state.health.lastChannelId,
      lastExecutiveRecommendation: state.health.lastExecutiveRecommendation,
      lastNeverPublishMedia: state.health.lastNeverPublishMedia,
      workerId: state.configuration.workerId,
      neverPublishMedia: true,
      neverRewriteScripts: true,
      neverEditMediaAssets: true,
      neverModifyApprovedAssets: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ419OrLater: true,
      neverBypassPillowGovernance: true,
      verifyAllPrerequisiteWorkersCompletedSuccessfully: true,
      preserveCompleteTraceability: true,
      distinguishVerifiedFindingsFromRecommendations: true,
    };
  }
}

export function createMediaExecutiveReviewWorker(
  bootstrap: EmpireBootstrapContext,
  options?: MediaExecutiveReviewWorkerOptions,
) {
  return new MediaExecutiveReviewWorker(bootstrap, options);
}

export function resetMediaExecutiveReviewWorkerForTesting() {
  resetMerLogsForTesting();
  resetReviewSequenceForTesting();
}
