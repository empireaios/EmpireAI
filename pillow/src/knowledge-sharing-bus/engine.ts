import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildKnowledgeSharingBusConfiguration,
  type KnowledgeSharingBusConfiguration,
} from "./configuration.js";
import { KnowledgeSharingBusController } from "./knowledge-sharing-bus-controller.js";
import { KnowledgeSharingBusCore } from "./knowledge-sharing-bus-core.js";
import { resetKnowledgeSequenceForTesting } from "./knowledge-store.js";
import { resetKsbLogsForTesting } from "./ksb-logging.js";
import { KNOWLEDGE_SHARING_BUS_SYSTEM_PATH } from "./paths.js";
import type {
  KnowledgeSharingBusCockpitSnapshot,
  KnowledgeSharingBusInput,
  KnowledgeSharingBusState,
} from "./types.js";

export interface KnowledgeSharingBusOptions {
  configuration?: Partial<KnowledgeSharingBusConfiguration>;
}

/** Authoritative Q0-23 Knowledge Sharing Bus — distribute knowledge only. */
export class KnowledgeSharingBus {
  private initializedAt: string | null = null;
  private readonly controller: KnowledgeSharingBusController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: KnowledgeSharingBusOptions = {},
  ) {
    this.controller = new KnowledgeSharingBusController(
      new KnowledgeSharingBusCore(),
      buildKnowledgeSharingBusConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      KNOWLEDGE_SHARING_BUS_SYSTEM_PATH,
    );
    if (!doc?.includes("Knowledge Sharing Bus")) {
      throw new Error(`${KNOWLEDGE_SHARING_BUS_SYSTEM_PATH} missing — Q0-23 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): KnowledgeSharingBusState {
    if (!this.initializedAt) {
      throw new Error("Knowledge Sharing Bus not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-KSB-001",
      missionId: "Q0-23",
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
        totalKnowledgeRecords: this.getRecords().length,
        publishedCount: engineRecord?.publishedCount ?? 0,
        archivedCount: engineRecord?.archivedCount ?? 0,
        subscriptionCount: engineRecord?.subscriptionCount ?? 0,
        lastCategory: engineRecord?.lastCategory ?? null,
        notes: [
          "Distribute only: does not execute worker tasks, replace Execution Memory, replace Decision Memory, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectKnowledgeSharingBus(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  submitKnowledge(input: KnowledgeSharingBusInput = {}) {
    return this.controller.submit(input);
  }

  classifyKnowledge(input: KnowledgeSharingBusInput = {}) {
    return this.controller.classify(input);
  }

  categorizeKnowledge(input: KnowledgeSharingBusInput = {}) {
    return this.controller.categorize(input);
  }

  versionKnowledge(input: KnowledgeSharingBusInput = {}) {
    return this.controller.version(input);
  }

  publishKnowledge(input: KnowledgeSharingBusInput = {}) {
    return this.controller.publish(input);
  }

  subscribeKnowledge(input: KnowledgeSharingBusInput = {}) {
    return this.controller.subscribe(input);
  }

  retrieveKnowledge(input: KnowledgeSharingBusInput = {}) {
    return this.controller.retrieve(input);
  }

  trackKnowledgeUsage(input: KnowledgeSharingBusInput = {}) {
    return this.controller.trackUsage(input);
  }

  archiveKnowledge(input: KnowledgeSharingBusInput = {}) {
    return this.controller.archive(input);
  }

  listKnowledge() {
    return this.controller.list();
  }

  validateKnowledgeSharingBus(input: KnowledgeSharingBusInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  getLatestRecord() {
    return this.controller.getManager().getLatestRecord();
  }

  getSubscriptions() {
    return this.controller.getManager().getSubscriptions();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
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
        `Knowledge records: ${state.health.totalKnowledgeRecords}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): KnowledgeSharingBusCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-23",
      status: state.status,
      healthStatus: state.health.status,
      totalKnowledgeRecords: state.health.totalKnowledgeRecords,
      latestKnowledgeId: this.getLatestRecord()?.knowledgeId ?? null,
      publishedCount: state.health.publishedCount,
      neverExecuteWorkerTasks: true,
      neverReplaceExecutionMemory: true,
      neverReplaceDecisionMemory: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createKnowledgeSharingBus(
  bootstrap: EmpireBootstrapContext,
  options?: KnowledgeSharingBusOptions,
) {
  return new KnowledgeSharingBus(bootstrap, options);
}

export function resetKnowledgeSharingBusForTesting() {
  resetKsbLogsForTesting();
  resetKnowledgeSequenceForTesting();
}
