import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { resetLearningSequenceForTesting } from "./learning-builder.js";
import { LearningManager } from "./learning-manager.js";
import {
  buildMediaLearningWorkerConfiguration,
  type MediaLearningWorkerConfiguration,
} from "./configuration.js";
import type { MediaLearningWorkerDependencies } from "./integrations.js";
import { MediaLearningWorkerController } from "./media-learning-worker-controller.js";
import { resetMlwLogsForTesting } from "./mlw-logging.js";
import { MEDIA_LEARNING_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  MediaLearningWorkerCockpitSnapshot,
  MediaLearningWorkerInput,
  MediaLearningWorkerState,
} from "./types.js";

export interface MediaLearningWorkerOptions {
  configuration?: Partial<MediaLearningWorkerConfiguration>;
  dependencies?: MediaLearningWorkerDependencies;
}

/** Authoritative Q4-16 Media Learning Worker — learning signals only, never mutate published content. */
export class MediaLearningWorker {
  private initializedAt: string | null = null;
  private readonly controller: MediaLearningWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: MediaLearningWorkerOptions = {},
  ) {
    const manager = new LearningManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new MediaLearningWorkerController(
      manager,
      buildMediaLearningWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      MEDIA_LEARNING_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Media Learning Worker")) {
      throw new Error(
        `${MEDIA_LEARNING_WORKER_SYSTEM_PATH} missing — Q4-16 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: MediaLearningWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): MediaLearningWorkerState {
    if (!this.initializedAt) {
      throw new Error("Media Learning Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-MLW-001",
      missionId: "Q4-16",
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
        totalLearningReports: engineRecord?.totalLearningReports ?? 0,
        lastLearningReportId: engineRecord?.lastLearningReportId ?? null,
        lastChannelId: engineRecord?.lastChannelId ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        lastVerifiedAnalyticsOnly: engineRecord?.lastVerifiedAnalyticsOnly ?? null,
        notes: [
          "Media learning only: does not rewrite existing content, modify published videos, change editorial policy directly, overwrite historical learning, override Pillow or Grand King, or implement Q4-17 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveMediaAnalyticsReports(input: MediaLearningWorkerInput = {}) {
    return this.controller.receiveMediaAnalyticsReports(input);
  }

  identifySuccessfulContentPatterns(input: MediaLearningWorkerInput = {}) {
    return this.controller.identifySuccessfulContentPatterns(input);
  }

  identifyUnsuccessfulContentPatterns(input: MediaLearningWorkerInput = {}) {
    return this.controller.identifyUnsuccessfulContentPatterns(input);
  }

  analyseTopicPerformance(input: MediaLearningWorkerInput = {}) {
    return this.controller.analyseTopicPerformance(input);
  }

  analyseHookPerformance(input: MediaLearningWorkerInput = {}) {
    return this.controller.analyseHookPerformance(input);
  }

  analyseThumbnailPerformance(input: MediaLearningWorkerInput = {}) {
    return this.controller.analyseThumbnailPerformance(input);
  }

  analysePacingAndRetention(input: MediaLearningWorkerInput = {}) {
    return this.controller.analysePacingAndRetention(input);
  }

  analysePublishingTiming(input: MediaLearningWorkerInput = {}) {
    return this.controller.analysePublishingTiming(input);
  }

  generateReusableLearningInsights(input: MediaLearningWorkerInput = {}) {
    return this.controller.generateReusableLearningInsights(input);
  }

  updateMediaPlaybookRecommendations(input: MediaLearningWorkerInput = {}) {
    return this.controller.updateMediaPlaybookRecommendations(input);
  }

  produceMediaLearningReport(input: MediaLearningWorkerInput = {}) {
    return this.controller.produceMediaLearningReport(input);
  }

  submitReport(input: MediaLearningWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: MediaLearningWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getLearningReports() {
    return this.controller.getManager().getLearningReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestLearningReportId() {
    return this.controller.getManager().getLatestLearningReportId();
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
        `Learning reports: ${state.health.totalLearningReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): MediaLearningWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q4-16",
      status: state.status,
      healthStatus: state.health.status,
      totalLearningReports: state.health.totalLearningReports,
      latestLearningReportId: this.getLatestLearningReportId(),
      lastChannelId: state.health.lastChannelId,
      lastConfidenceScore: state.health.lastConfidenceScore,
      lastVerifiedAnalyticsOnly: state.health.lastVerifiedAnalyticsOnly,
      workerId: state.configuration.workerId,
      neverRewriteExistingContent: true,
      neverModifyPublishedVideos: true,
      neverChangeEditorialPolicyDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ417OrLater: true,
      neverOverwriteHistoricalLearning: true,
      learnOnlyFromVerifiedAnalytics: true,
    };
  }
}

export function createMediaLearningWorker(
  bootstrap: EmpireBootstrapContext,
  options?: MediaLearningWorkerOptions,
) {
  return new MediaLearningWorker(bootstrap, options);
}

export function resetMediaLearningWorkerForTesting() {
  resetMlwLogsForTesting();
  resetLearningSequenceForTesting();
}
