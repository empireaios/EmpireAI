import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildTrendResearchWorkerConfiguration,
  type TrendResearchWorkerConfiguration,
} from "./configuration.js";
import type { TrendResearchWorkerDependencies } from "./integrations.js";
import { TrendResearchWorkerController } from "./trend-research-worker-controller.js";
import { resetTrwLogsForTesting } from "./trw-logging.js";
import { TREND_RESEARCH_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetTrendSequenceForTesting } from "./trend-builder.js";
import { TrendManager } from "./trend-manager.js";
import type {
  TrendResearchWorkerCockpitSnapshot,
  TrendResearchWorkerInput,
  TrendResearchWorkerState,
} from "./types.js";

export interface TrendResearchWorkerOptions {
  configuration?: Partial<TrendResearchWorkerConfiguration>;
  dependencies?: TrendResearchWorkerDependencies;
}

/** Authoritative Q4-03 Trend Research Worker — research/analysis only. */
export class TrendResearchWorker {
  private initializedAt: string | null = null;
  private readonly controller: TrendResearchWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: TrendResearchWorkerOptions = {},
  ) {
    const manager = new TrendManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new TrendResearchWorkerController(
      manager,
      buildTrendResearchWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      TREND_RESEARCH_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Trend Research Worker")) {
      throw new Error(
        `${TREND_RESEARCH_WORKER_SYSTEM_PATH} missing — Q4-03 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: TrendResearchWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): TrendResearchWorkerState {
    if (!this.initializedAt) {
      throw new Error("Trend Research Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-TRW-001",
      missionId: "Q4-03",
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
        totalTrendReports: engineRecord?.totalTrendReports ?? 0,
        lastTrendReportId: engineRecord?.lastTrendReportId ?? null,
        lastTrendDirection: engineRecord?.lastTrendDirection ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        lastRecommendedPriority: engineRecord?.lastRecommendedPriority ?? null,
        notes: [
          "Research-only: does not select publishing topics, write scripts, generate thumbnails, publish content, generate content directly, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  monitorSearchTrends(input: TrendResearchWorkerInput = {}) {
    return this.controller.monitorSearchTrends(input);
  }

  monitorCompetitorChannels(input: TrendResearchWorkerInput = {}) {
    return this.controller.monitorCompetitorChannels(input);
  }

  monitorSocialPlatformTrends(input: TrendResearchWorkerInput = {}) {
    return this.controller.monitorSocialPlatformTrends(input);
  }

  monitorAudienceBehaviourSignals(input: TrendResearchWorkerInput = {}) {
    return this.controller.monitorAudienceBehaviourSignals(input);
  }

  monitorCurrentEvents(input: TrendResearchWorkerInput = {}) {
    return this.controller.monitorCurrentEvents(input);
  }

  identifyEmergingTrends(input: TrendResearchWorkerInput = {}) {
    return this.controller.identifyEmergingTrends(input);
  }

  identifyDecliningTrends(input: TrendResearchWorkerInput = {}) {
    return this.controller.identifyDecliningTrends(input);
  }

  categorizeOpportunities(input: TrendResearchWorkerInput = {}) {
    return this.controller.categorizeOpportunities(input);
  }

  scoreTrendConfidence(input: TrendResearchWorkerInput = {}) {
    return this.controller.scoreTrendConfidence(input);
  }

  produceTrendResearchReport(input: TrendResearchWorkerInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: TrendResearchWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: TrendResearchWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getTrendReports() {
    return this.controller.getManager().getTrendReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestTrendReportId() {
    return this.controller.getManager().getLatestTrendReportId();
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
        `Trend reports: ${state.health.totalTrendReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): TrendResearchWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q4-03",
      status: state.status,
      healthStatus: state.health.status,
      totalTrendReports: state.health.totalTrendReports,
      latestTrendReportId: this.getLatestTrendReportId(),
      lastTrendDirection: state.health.lastTrendDirection,
      lastConfidenceScore: state.health.lastConfidenceScore,
      lastRecommendedPriority: state.health.lastRecommendedPriority,
      workerId: state.configuration.workerId,
      neverSelectPublishingTopics: true,
      neverWriteScripts: true,
      neverGenerateThumbnails: true,
      neverPublishContent: true,
      neverGenerateContentDirectly: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createTrendResearchWorker(
  bootstrap: EmpireBootstrapContext,
  options?: TrendResearchWorkerOptions,
) {
  return new TrendResearchWorker(bootstrap, options);
}

export function resetTrendResearchWorkerForTesting() {
  resetTrwLogsForTesting();
  resetTrendSequenceForTesting();
}
