import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildTopicPlannerWorkerConfiguration,
  type TopicPlannerWorkerConfiguration,
} from "./configuration.js";
import type { TopicPlannerWorkerDependencies } from "./integrations.js";
import { TopicPlannerWorkerController } from "./topic-planner-worker-controller.js";
import { resetTpwLogsForTesting } from "./tpw-logging.js";
import { TOPIC_PLANNER_WORKER_SYSTEM_PATH } from "./paths.js";
import { resetPlanSequenceForTesting } from "./plan-builder.js";
import { PlanManager } from "./plan-manager.js";
import type {
  TopicPlannerWorkerCockpitSnapshot,
  TopicPlannerWorkerInput,
  TopicPlannerWorkerState,
} from "./types.js";

export interface TopicPlannerWorkerOptions {
  configuration?: Partial<TopicPlannerWorkerConfiguration>;
  dependencies?: TopicPlannerWorkerDependencies;
}

/** Authoritative Q4-04 Topic Planner Worker — planning only. */
export class TopicPlannerWorker {
  private initializedAt: string | null = null;
  private readonly controller: TopicPlannerWorkerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: TopicPlannerWorkerOptions = {},
  ) {
    const manager = new PlanManager();
    if (options.dependencies) manager.bindIntegrations(options.dependencies);
    this.controller = new TopicPlannerWorkerController(
      manager,
      buildTopicPlannerWorkerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      TOPIC_PLANNER_WORKER_SYSTEM_PATH,
    );
    if (!doc?.includes("Topic Planner Worker")) {
      throw new Error(
        `${TOPIC_PLANNER_WORKER_SYSTEM_PATH} missing — Q4-04 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: TopicPlannerWorkerDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): TopicPlannerWorkerState {
    if (!this.initializedAt) {
      throw new Error("Topic Planner Worker not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-TPW-001",
      missionId: "Q4-04",
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
        totalTopicPlans: engineRecord?.totalTopicPlans ?? 0,
        lastTopicPlanId: engineRecord?.lastTopicPlanId ?? null,
        lastTopicPriority: engineRecord?.lastTopicPriority ?? null,
        lastCadenceStatus: engineRecord?.lastCadenceStatus ?? null,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Planning-only: does not write scripts, generate visuals, produce videos, publish content, bypass Pillow governance, override Pillow or Grand King, or require Grand King daily prompts.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveEditorialStrategy(input: TopicPlannerWorkerInput = {}) {
    return this.controller.receiveEditorialStrategy(input);
  }

  receiveTrendResearchReports(input: TopicPlannerWorkerInput = {}) {
    return this.controller.receiveTrendResearchReports(input);
  }

  analyseChannelObjectives(input: TopicPlannerWorkerInput = {}) {
    return this.controller.analyseChannelObjectives(input);
  }

  prioritizeContentOpportunities(input: TopicPlannerWorkerInput = {}) {
    return this.controller.prioritizeContentOpportunities(input);
  }

  selectDailyPublishingTopics(input: TopicPlannerWorkerInput = {}) {
    return this.controller.selectDailyPublishingTopics(input);
  }

  balanceEvergreenAndTrending(input: TopicPlannerWorkerInput = {}) {
    return this.controller.balanceEvergreenAndTrending(input);
  }

  preventDuplicateTopics(input: TopicPlannerWorkerInput = {}) {
    return this.controller.preventDuplicateTopics(input);
  }

  maintainPublishingCadence(input: TopicPlannerWorkerInput = {}) {
    return this.controller.maintainPublishingCadence(input);
  }

  rankTopicsByStrategicPriority(input: TopicPlannerWorkerInput = {}) {
    return this.controller.rankTopicsByStrategicPriority(input);
  }

  produceTopicPlan(input: TopicPlannerWorkerInput = {}) {
    return this.controller.produceTopicPlan(input);
  }

  submitPlan(input: TopicPlannerWorkerInput = {}) {
    return this.controller.submitPlan(input);
  }

  list() {
    return this.controller.list();
  }

  validate(input: TopicPlannerWorkerInput = {}) {
    return this.controller.validate(input);
  }

  diagnostics() {
    return this.controller.diagnostics();
  }

  getTopicPlans() {
    return this.controller.getManager().getTopicPlans();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestTopicPlanId() {
    return this.controller.getManager().getLatestTopicPlanId();
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
        `Topic plans: ${state.health.totalTopicPlans}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): TopicPlannerWorkerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q4-04",
      status: state.status,
      healthStatus: state.health.status,
      totalTopicPlans: state.health.totalTopicPlans,
      latestTopicPlanId: this.getLatestTopicPlanId(),
      lastTopicPriority: state.health.lastTopicPriority,
      lastCadenceStatus: state.health.lastCadenceStatus,
      lastConfidenceScore: state.health.lastConfidenceScore,
      workerId: state.configuration.workerId,
      neverWriteScripts: true,
      neverGenerateVisuals: true,
      neverProduceVideos: true,
      neverPublishContent: true,
      neverBypassPillowGovernance: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createTopicPlannerWorker(
  bootstrap: EmpireBootstrapContext,
  options?: TopicPlannerWorkerOptions,
) {
  return new TopicPlannerWorker(bootstrap, options);
}

export function resetTopicPlannerWorkerForTesting() {
  resetTpwLogsForTesting();
  resetPlanSequenceForTesting();
}
