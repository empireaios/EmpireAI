import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { resetAnalyticsSequenceForTesting } from "./analytics-builder.js";
import { AnalyticsManager } from "./analytics-manager.js";
import {
  buildMediaAnalyticsWorkerConfiguration,
  type MediaAnalyticsWorkerConfiguration,
} from "./configuration.js";
import type { MediaAnalyticsWorkerDependencies } from "./integrations.js";
import { MediaAnalyticsWorkerController } from "./media-analytics-worker-controller.js";
import { resetMawLogsForTesting } from "./maw-logging.js";
import { MEDIA_ANALYTICS_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  MediaAnalyticsWorkerCockpitSnapshot,
  MediaAnalyticsWorkerInput,
  MediaAnalyticsWorkerState,
} from "./types.js";

export interface MediaAnalyticsWorkerOptions {
  configuration?: Partial<MediaAnalyticsWorkerConfiguration>;
  dependencies?: MediaAnalyticsWorkerDependencies;
}

/** Authoritative Q4-15 Media Analytics Worker — metric signals only, never alter source data. */
export class MediaAnalyticsWorker {
  private initializedAt: string | null = null;
  private readonly controller: MediaAnalyticsWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: MediaAnalyticsWorkerOptions = {},
  ) {
    const manager = new AnalyticsManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new MediaAnalyticsWorkerController(
      manager,
      buildMediaAnalyticsWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      MEDIA_ANALYTICS_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Media Analytics Worker")) {
      throw new Error(
        `${MEDIA_ANALYTICS_WORKER_SYSTEM_PATH} missing — Q4-15 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: MediaAnalyticsWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): MediaAnalyticsWorkerState {
    if (!this.initializedAt) {
      throw new Error("Media Analytics Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-MAW-001",
      missionId: "Q4-15",
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
        totalAnalyticsReports: engineRecord?.totalAnalyticsReports ?? 0,
        lastAnalyticsReportId: engineRecord?.lastAnalyticsReportId ?? null,
        lastMediaId: engineRecord?.lastMediaId ?? null,
        lastPlatform: engineRecord?.lastPlatform ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        lastMeaningfulChangeDetected: engineRecord?.lastMeaningfulChangeDetected ?? null,
        notes: [
          "Media analytics only: does not rewrite content, change publishing schedules, modify channel strategy, execute optimizations, alter source analytics data, override Pillow or Grand King, or implement Q4-16 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receivePlatformMetrics(input: MediaAnalyticsWorkerInput = {}) {
    return this.controller.receivePlatformMetrics(input);
  }

  trackViews(input: MediaAnalyticsWorkerInput = {}) {
    return this.controller.trackViews(input);
  }

  trackImpressions(input: MediaAnalyticsWorkerInput = {}) {
    return this.controller.trackImpressions(input);
  }

  trackClickThroughRate(input: MediaAnalyticsWorkerInput = {}) {
    return this.controller.trackClickThroughRate(input);
  }

  trackWatchTime(input: MediaAnalyticsWorkerInput = {}) {
    return this.controller.trackWatchTime(input);
  }

  trackAudienceRetention(input: MediaAnalyticsWorkerInput = {}) {
    return this.controller.trackAudienceRetention(input);
  }

  trackSubscriberGrowth(input: MediaAnalyticsWorkerInput = {}) {
    return this.controller.trackSubscriberGrowth(input);
  }

  trackEngagementMetrics(input: MediaAnalyticsWorkerInput = {}) {
    return this.controller.trackEngagementMetrics(input);
  }

  trackRevenueWhereAvailable(input: MediaAnalyticsWorkerInput = {}) {
    return this.controller.trackRevenueWhereAvailable(input);
  }

  detectPerformancePatterns(input: MediaAnalyticsWorkerInput = {}) {
    return this.controller.detectPerformancePatterns(input);
  }

  compareVideosFormatsTopicsHooksChannels(input: MediaAnalyticsWorkerInput = {}) {
    return this.controller.compareVideosFormatsTopicsHooksChannels(input);
  }

  produceMediaAnalyticsReport(input: MediaAnalyticsWorkerInput = {}) {
    return this.controller.produceMediaAnalyticsReport(input);
  }

  submitReport(input: MediaAnalyticsWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: MediaAnalyticsWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getAnalyticsReports() {
    return this.controller.getManager().getAnalyticsReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestAnalyticsReportId() {
    return this.controller.getManager().getLatestAnalyticsReportId();
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
        `Analytics reports: ${state.health.totalAnalyticsReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): MediaAnalyticsWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q4-15",
      status: state.status,
      healthStatus: state.health.status,
      totalAnalyticsReports: state.health.totalAnalyticsReports,
      latestAnalyticsReportId: this.getLatestAnalyticsReportId(),
      lastMediaId: state.health.lastMediaId,
      lastPlatform: state.health.lastPlatform,
      lastConfidenceScore: state.health.lastConfidenceScore,
      lastMeaningfulChangeDetected: state.health.lastMeaningfulChangeDetected,
      workerId: state.configuration.workerId,
      neverRewriteContent: true,
      neverChangePublishingSchedules: true,
      neverModifyChannelStrategy: true,
      neverExecuteOptimizations: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ416OrLater: true,
      neverAlterSourceAnalyticsData: true,
    };
  }
}

export function createMediaAnalyticsWorker(
  bootstrap: EmpireBootstrapContext,
  options?: MediaAnalyticsWorkerOptions,
) {
  return new MediaAnalyticsWorker(bootstrap, options);
}

export function resetMediaAnalyticsWorkerForTesting() {
  resetMawLogsForTesting();
  resetAnalyticsSequenceForTesting();
}
