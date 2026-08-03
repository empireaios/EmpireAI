import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildDecisionMemoryConfiguration,
  type DecisionMemoryConfiguration,
} from "./configuration.js";
import { DecisionMemoryController } from "./decision-memory-controller.js";
import { DecisionMemoryCore } from "./decision-memory-core.js";
import { resetDmemLogsForTesting } from "./dmem-logging.js";
import { resetDecisionSequenceForTesting } from "./decision-memory-store.js";
import { DECISION_MEMORY_SYSTEM_PATH } from "./paths.js";
import type {
  DecisionMemoryCockpitSnapshot,
  DecisionMemoryInput,
  DecisionMemoryState,
} from "./types.js";

export interface DecisionMemoryOptions {
  configuration?: Partial<DecisionMemoryConfiguration>;
}

/** Authoritative Q0-16 Decision Memory — executive decision history store only. */
export class DecisionMemory {
  private initializedAt: string | null = null;
  private readonly controller: DecisionMemoryController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: DecisionMemoryOptions = {},
  ) {
    this.controller = new DecisionMemoryController(
      new DecisionMemoryCore(),
      buildDecisionMemoryConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      DECISION_MEMORY_SYSTEM_PATH,
    );
    if (!doc?.includes("Decision Memory")) {
      throw new Error(`${DECISION_MEMORY_SYSTEM_PATH} missing — Q0-16 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): DecisionMemoryState {
    if (!this.initializedAt) {
      throw new Error("Decision Memory not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-DMEM-001",
      missionId: "Q0-16",
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
        totalDecisionRecords: this.getRecords().length,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Store only: does not make decisions, execute work, replace Execution Memory, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectDecisionMemory(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  recordDecision(input: DecisionMemoryInput = {}) {
    return this.controller.record(input);
  }

  retrieveDecision(input: DecisionMemoryInput = {}) {
    return this.controller.retrieve(input);
  }

  searchDecisions(input: DecisionMemoryInput = {}) {
    return this.controller.search(input);
  }

  compareDecisions(input: DecisionMemoryInput = {}) {
    return this.controller.compare(input);
  }

  updateDecisionOutcome(input: DecisionMemoryInput = {}) {
    return this.controller.updateOutcome(input);
  }

  listDecisions() {
    return this.controller.list();
  }

  validateDecisionMemory(input: DecisionMemoryInput = {}) {
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
        `Decision records: ${state.health.totalDecisionRecords}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): DecisionMemoryCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-16",
      status: state.status,
      healthStatus: state.health.status,
      totalDecisionRecords: state.health.totalDecisionRecords,
      latestDecisionId: this.getLatestRecord()?.decisionId ?? null,
      lastConfidenceScore: state.health.lastConfidenceScore,
      neverMakeDecisions: true,
      neverExecuteWork: true,
      neverReplaceExecutionMemory: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createDecisionMemory(
  bootstrap: EmpireBootstrapContext,
  options?: DecisionMemoryOptions,
) {
  return new DecisionMemory(bootstrap, options);
}

export function resetDecisionMemoryForTesting() {
  resetDmemLogsForTesting();
  resetDecisionSequenceForTesting();
}
