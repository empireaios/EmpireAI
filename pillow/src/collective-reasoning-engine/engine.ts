import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildCollectiveReasoningEngineConfiguration,
  type CollectiveReasoningEngineConfiguration,
} from "./configuration.js";
import { CollectiveReasoningEngineController } from "./collective-reasoning-engine-controller.js";
import { CollectiveReasoningEngineCore } from "./collective-reasoning-engine-core.js";
import { resetCoreLogsForTesting } from "./core-logging.js";
import { resetReasoningSequenceForTesting } from "./debate-coordinator.js";
import { COLLECTIVE_REASONING_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  CollectiveReasoningEngineCockpitSnapshot,
  CollectiveReasoningEngineInput,
  CollectiveReasoningEngineState,
} from "./types.js";

export interface CollectiveReasoningEngineOptions {
  configuration?: Partial<CollectiveReasoningEngineConfiguration>;
}

/** Authoritative Q0-13 Collective Reasoning Engine — multi-worker reasoning only. */
export class CollectiveReasoningEngine {
  private initializedAt: string | null = null;
  private readonly controller: CollectiveReasoningEngineController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: CollectiveReasoningEngineOptions = {},
  ) {
    this.controller = new CollectiveReasoningEngineController(
      new CollectiveReasoningEngineCore(),
      buildCollectiveReasoningEngineConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      COLLECTIVE_REASONING_ENGINE_SYSTEM_PATH,
    );
    if (!doc?.includes("Collective Reasoning Engine")) {
      throw new Error(`${COLLECTIVE_REASONING_ENGINE_SYSTEM_PATH} missing — Q0-13 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): CollectiveReasoningEngineState {
    if (!this.initializedAt) {
      throw new Error("Collective Reasoning Engine not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-CORE-001",
      missionId: "Q0-13",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: engineRecord?.healthStatus === "healthy" ? 100 : engineRecord ? 70 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalReasoningRecords: this.getRecords().length,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Reasoning only: does not execute work, assign workers permanently, replace Pillow, override Grand King, or approve actions.",
        ],
      },
    };
  }

  connectCollectiveReasoningEngine(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  reason(input: CollectiveReasoningEngineInput) {
    return this.controller.reason(input);
  }

  identifyExpertise(input: CollectiveReasoningEngineInput) {
    return this.controller.identifyExpertise(input);
  }

  assemblePanel(input: CollectiveReasoningEngineInput) {
    return this.controller.assemblePanel(input);
  }

  collectOpinions(input: CollectiveReasoningEngineInput) {
    return this.controller.collectOpinions(input);
  }

  detectConflicts(input: CollectiveReasoningEngineInput) {
    return this.controller.detectConflicts(input);
  }

  debate(input: CollectiveReasoningEngineInput) {
    return this.controller.debate(input);
  }

  buildConsensus(input: CollectiveReasoningEngineInput) {
    return this.controller.buildConsensus(input);
  }

  recommend(input: CollectiveReasoningEngineInput) {
    return this.controller.recommend(input);
  }

  listRecords() {
    return this.controller.listRecords();
  }

  validateReasoning(input: CollectiveReasoningEngineInput = { executiveQuestion: "" }) {
    return this.controller.validateReasoning(input);
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

  getParticipants() {
    return this.controller.getManager().getParticipants();
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
      health: score >= 75 ? ("healthy" as const) : score >= 50 ? ("degraded" as const) : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Reasoning records: ${state.health.totalReasoningRecords}`,
        `Last confidence: ${state.health.lastConfidenceScore ?? "n/a"}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): CollectiveReasoningEngineCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-13",
      status: state.status,
      healthStatus: state.health.status,
      totalReasoningRecords: state.health.totalReasoningRecords,
      latestReasoningId: this.getLatestRecord()?.reasoningId ?? null,
      lastConfidenceScore: state.health.lastConfidenceScore,
      neverExecuteWork: true,
      neverAssignWorkersPermanently: true,
      neverReplacePillow: true,
      neverOverrideGrandKing: true,
      neverApproveActions: true,
    };
  }
}

export function createCollectiveReasoningEngine(
  bootstrap: EmpireBootstrapContext,
  options?: CollectiveReasoningEngineOptions,
) {
  return new CollectiveReasoningEngine(bootstrap, options);
}

export function resetCollectiveReasoningEngineForTesting() {
  resetCoreLogsForTesting();
  resetReasoningSequenceForTesting();
}
