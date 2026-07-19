import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { CustomerIdentityEngine } from "../customer-identity-engine/engine.js";
import type { CustomerTimelineEngine } from "../customer-timeline-engine/engine.js";
import type { CustomerSentimentEngine } from "../customer-sentiment-engine/engine.js";
import type { AiCustomerSupport } from "../ai-customer-support/engine.js";
import {
  buildReviewManagementEngineConfiguration,
  type ReviewManagementEngineConfiguration,
} from "./configuration.js";
import { appendRmeLog, getRmeLogs, resetRmeLogsForTesting } from "./rme-logging.js";
import { REVIEW_MANAGEMENT_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  ClassifyReviewSentimentInput,
  CollectCustomerReviewInput,
  ConnectReviewManagementEngineInput,
  DetectNegativeReviewsInput,
  DetectPositiveReviewsInput,
  DetectReviewFailuresInput,
  GenerateReputationAlertsInput,
  ImportMarketplaceReviewInput,
  ReviewCockpitSnapshot,
  ReviewManagementEngineState,
  ReviewRunReport,
  TrackReviewTrendsInput,
} from "./types.js";
import { ReviewManagementController } from "./review-management-controller.js";
import { ReviewManagementManager } from "./review-management-manager.js";

export interface ReviewManagementEngineOptions {
  configuration?: Partial<ReviewManagementEngineConfiguration>;
}

/**
 * Review Management Engine (PILLOW-RME-001 / R4-11).
 * Centralized review management consuming R4-01, R4-03, R4-08 and R4-10.
 */
export class ReviewManagementEngine {
  private initializedAt: string | null = null;
  private readonly controller: ReviewManagementController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    identityEngine: CustomerIdentityEngine,
    timelineEngine: CustomerTimelineEngine,
    sentimentEngine: CustomerSentimentEngine,
    aiCustomerSupport: AiCustomerSupport,
    options: ReviewManagementEngineOptions = {},
  ) {
    const config = buildReviewManagementEngineConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    const manager = new ReviewManagementManager(
      identityEngine,
      timelineEngine,
      sentimentEngine,
      aiCustomerSupport,
    );
    this.controller = new ReviewManagementController(manager, config);
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ReviewManagementEngineState> {
    const doc = await this.reader.readText(REVIEW_MANAGEMENT_ENGINE_SYSTEM_PATH);
    if (!doc?.includes("Review Management Engine")) {
      throw new Error(
        `${REVIEW_MANAGEMENT_ENGINE_SYSTEM_PATH} missing — Review Management Engine requires R4-11 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendRmeLog({
      event: "engine_initialization",
      level: "info",
      details: "R4-11 Review Management Engine initialized",
    });
    return this.getState();
  }

  getState(): ReviewManagementEngineState {
    if (!this.initializedAt) {
      throw new Error("Review Management Engine not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const record = this.controller.getManager().getEngineRecord();
    const reviewRecords = this.controller.getManager().getReviewRecords();
    const summary = this.controller
      .getManager()
      .getReputationEngine()
      .summarize(reviewRecords, this.controller.getManager().getRegistry().listAlerts().length);

    const health = this.controller.getHealthMonitor().buildReport({
      config,
      record,
      totalReviewRecords: summary.totalReviews,
      positiveReviews: summary.positiveReviews,
      negativeReviews: summary.negativeReviews,
      neutralReviews: summary.neutralReviews,
      activeAlerts: summary.activeAlerts,
      failedRecords: summary.failedRecords,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-RME-001",
      missionId: "R4-11",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      engineRecord: record,
      health,
      performance,
    };
  }

  connectReviewManagementEngine(
    input: ConnectReviewManagementEngineInput = {},
  ): ReviewRunReport {
    return this.controller.connectReviewManagementEngine(input);
  }

  collectCustomerReview(input: CollectCustomerReviewInput): ReviewRunReport {
    return this.controller.collectCustomerReview(input);
  }

  importMarketplaceReview(input: ImportMarketplaceReviewInput): ReviewRunReport {
    return this.controller.importMarketplaceReview(input);
  }

  classifyReviewSentiment(input: ClassifyReviewSentimentInput): ReviewRunReport {
    return this.controller.classifyReviewSentiment(input);
  }

  detectNegativeReviews(input: DetectNegativeReviewsInput = {}): ReviewRunReport {
    return this.controller.detectNegativeReviews(input);
  }

  detectPositiveReviews(input: DetectPositiveReviewsInput = {}): ReviewRunReport {
    return this.controller.detectPositiveReviews(input);
  }

  trackReviewTrends(input: TrackReviewTrendsInput = {}): ReviewRunReport {
    return this.controller.trackReviewTrends(input);
  }

  generateReputationAlerts(input: GenerateReputationAlertsInput = {}): ReviewRunReport {
    return this.controller.generateReputationAlerts(input);
  }

  detectReviewFailures(input: DetectReviewFailuresInput = {}): ReviewRunReport {
    return this.controller.detectReviewFailures(input);
  }

  reportReviewStatus(): ReviewRunReport {
    return this.controller.reportReviewStatus();
  }

  reportReviewHealth(): ReviewRunReport {
    return this.controller.reportReviewHealth();
  }

  getLatestReport(): ReviewRunReport | null {
    return this.controller.getLatestReport();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getReviewRecords() {
    return this.controller.getManager().getReviewRecords();
  }

  getAlerts() {
    return this.controller.getManager().getRegistry().listAlerts();
  }

  getTrends() {
    return this.controller.getManager().getRegistry().listTrends();
  }

  getMachineReadableRecord(reviewRecordId: string): Record<string, unknown> | null {
    const record = this.controller.getManager().getRegistry().getRecord(reviewRecordId);
    if (!record) return null;
    return this.controller.getManager().getReputationEngine().toMachineReadable(record);
  }

  updateConfiguration(
    overrides: Partial<ReviewManagementEngineConfiguration>,
  ): ReviewManagementEngineState {
    const next = buildReviewManagementEngineConfiguration(this.bootstrap.repositoryRoot, {
      ...this.controller.getConfiguration(),
      ...overrides,
    });
    this.controller.updateConfiguration(next);
    return this.getState();
  }

  validateForSupervisorSync(): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
  } {
    const state = this.getState();
    const report = state.latestReport;
    const score = report
      ? report.validation.decision === "pass"
        ? 100
        : report.validation.decision === "partial"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Review engine status: ${state.status}`,
        `Records: ${state.health.totalReviewRecords} total · ${state.health.positiveReviews} positive`,
        report
          ? `Last operation: ${report.action} · ${report.validation.decision}`
          : "No review operations yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ReviewCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.engineRecord;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      operationalState: record?.currentOperationalState ?? null,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      totalReviewRecords: state.health.totalReviewRecords,
      positiveReviews: state.health.positiveReviews,
      negativeReviews: state.health.negativeReviews,
      activeAlerts: state.health.activeAlerts,
      identityEngineConnected: record?.identityEngineConnected ?? false,
      timelineEngineConnected: record?.timelineEngineConnected ?? false,
      sentimentEngineConnected: record?.sentimentEngineConnected ?? false,
      aiCustomerSupportConnected: record?.aiCustomerSupportConnected ?? false,
      recentLogs: getRmeLogs(8, state.configuration).map((l) => `${l.event}: ${l.details}`),
    };
  }
}

export function createReviewManagementEngine(
  bootstrap: EmpireBootstrapContext,
  identityEngine: CustomerIdentityEngine,
  timelineEngine: CustomerTimelineEngine,
  sentimentEngine: CustomerSentimentEngine,
  aiCustomerSupport: AiCustomerSupport,
  options?: ReviewManagementEngineOptions,
): ReviewManagementEngine {
  return new ReviewManagementEngine(
    bootstrap,
    identityEngine,
    timelineEngine,
    sentimentEngine,
    aiCustomerSupport,
    options,
  );
}

export function resetReviewManagementEngineForTesting(): void {
  resetRmeLogsForTesting();
  new ReviewManagementManager(null, null, null, null).resetForTesting();
}
