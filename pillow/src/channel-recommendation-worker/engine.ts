import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { resetRecommendationSequenceForTesting } from "./recommendation-builder.js";
import { RecommendationManager } from "./recommendation-manager.js";
import {
  buildChannelRecommendationWorkerConfiguration,
  type ChannelRecommendationWorkerConfiguration,
} from "./configuration.js";
import type { ChannelRecommendationWorkerDependencies } from "./integrations.js";
import { ChannelRecommendationWorkerController } from "./channel-recommendation-worker-controller.js";
import { resetCrwLogsForTesting } from "./crw-logging.js";
import { CHANNEL_RECOMMENDATION_WORKER_SYSTEM_PATH } from "./paths.js";
import type {
  ChannelRecommendationWorkerCockpitSnapshot,
  ChannelRecommendationWorkerInput,
  ChannelRecommendationWorkerState,
} from "./types.js";

export interface ChannelRecommendationWorkerOptions {
  configuration?: Partial<ChannelRecommendationWorkerConfiguration>;
  dependencies?: ChannelRecommendationWorkerDependencies;
}

/** Authoritative Q4-17 Channel Recommendation Worker — recommendation signals only, never create channels. */
export class ChannelRecommendationWorker {
  private initializedAt: string | null = null;
  private readonly controller: ChannelRecommendationWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ChannelRecommendationWorkerOptions = {},
  ) {
    const manager = new RecommendationManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new ChannelRecommendationWorkerController(
      manager,
      buildChannelRecommendationWorkerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      CHANNEL_RECOMMENDATION_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Channel Recommendation Worker")) {
      throw new Error(
        `${CHANNEL_RECOMMENDATION_WORKER_SYSTEM_PATH} missing — Q4-17 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: ChannelRecommendationWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): ChannelRecommendationWorkerState {
    if (!this.initializedAt) {
      throw new Error(
        "Channel Recommendation Worker not initialized. Call initialize() first.",
      );
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-CRW-001",
      missionId: "Q4-17",
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
        totalRecommendationReports: engineRecord?.totalRecommendationReports ?? 0,
        lastRecommendationId: engineRecord?.lastRecommendationId ?? null,
        lastProposedChannelName: engineRecord?.lastProposedChannelName ?? null,
        lastOverallScore: engineRecord?.lastOverallScore ?? null,
        lastRecommendation: engineRecord?.lastRecommendation ?? null,
        lastNeverCreateChannelsAutomatically:
          engineRecord?.lastNeverCreateChannelsAutomatically ?? null,
        notes: [
          "Channel recommendations only: does not create channels, configure platform accounts, publish content, override Pillow or Grand King, or implement Q4-18 or later.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveTrendResearch(input: ChannelRecommendationWorkerInput = {}) {
    return this.controller.receiveTrendResearch(input);
  }

  receiveMediaAnalytics(input: ChannelRecommendationWorkerInput = {}) {
    return this.controller.receiveMediaAnalytics(input);
  }

  receiveMediaLearningOutputs(input: ChannelRecommendationWorkerInput = {}) {
    return this.controller.receiveMediaLearningOutputs(input);
  }

  analyseAudiencePotential(input: ChannelRecommendationWorkerInput = {}) {
    return this.controller.analyseAudiencePotential(input);
  }

  analyseRevenuePotential(input: ChannelRecommendationWorkerInput = {}) {
    return this.controller.analyseRevenuePotential(input);
  }

  analyseProductionFeasibility(input: ChannelRecommendationWorkerInput = {}) {
    return this.controller.analyseProductionFeasibility(input);
  }

  analyseCompetition(input: ChannelRecommendationWorkerInput = {}) {
    return this.controller.analyseCompetition(input);
  }

  analyseStrategicFit(input: ChannelRecommendationWorkerInput = {}) {
    return this.controller.analyseStrategicFit(input);
  }

  analyseExpectedContentSustainability(input: ChannelRecommendationWorkerInput = {}) {
    return this.controller.analyseExpectedContentSustainability(input);
  }

  rankChannelOpportunities(input: ChannelRecommendationWorkerInput = {}) {
    return this.controller.rankChannelOpportunities(input);
  }

  recommendProceedMonitorOrReject(input: ChannelRecommendationWorkerInput = {}) {
    return this.controller.recommendProceedMonitorOrReject(input);
  }

  produceChannelRecommendationReport(input: ChannelRecommendationWorkerInput = {}) {
    return this.controller.produceChannelRecommendationReport(input);
  }

  submitReport(input: ChannelRecommendationWorkerInput = {}) {
    return this.controller.submitReport(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: ChannelRecommendationWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getRecommendationReports() {
    return this.controller.getManager().getRecommendationReports();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestRecommendationId() {
    return this.controller.getManager().getLatestRecommendationId();
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
        `Recommendation reports: ${state.health.totalRecommendationReports}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ChannelRecommendationWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q4-17",
      status: state.status,
      healthStatus: state.health.status,
      totalRecommendationReports: state.health.totalRecommendationReports,
      latestRecommendationId: this.getLatestRecommendationId(),
      lastProposedChannelName: state.health.lastProposedChannelName,
      lastOverallScore: state.health.lastOverallScore,
      lastRecommendation: state.health.lastRecommendation,
      lastNeverCreateChannelsAutomatically:
        state.health.lastNeverCreateChannelsAutomatically,
      workerId: state.configuration.workerId,
      neverCreateChannels: true,
      neverConfigurePlatformAccounts: true,
      neverPublishContent: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ418OrLater: true,
      neverCreateChannelsAutomatically: true,
      baseRecommendationsOnEvidence: true,
    };
  }
}

export function createChannelRecommendationWorker(
  bootstrap: EmpireBootstrapContext,
  options?: ChannelRecommendationWorkerOptions,
) {
  return new ChannelRecommendationWorker(bootstrap, options);
}

export function resetChannelRecommendationWorkerForTesting() {
  resetCrwLogsForTesting();
  resetRecommendationSequenceForTesting();
}
