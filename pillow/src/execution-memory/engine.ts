import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildExecutionMemoryConfiguration,
  type ExecutionMemoryConfiguration,
} from "./configuration.js";
import { ExecutionMemoryController } from "./execution-memory-controller.js";
import { ExecutionMemoryCore } from "./execution-memory-core.js";
import { resetExmLogsForTesting } from "./exm-logging.js";
import { EXECUTION_MEMORY_SYSTEM_PATH } from "./paths.js";
import type {
  ExecutionMemoryCockpitSnapshot,
  ExecutionMemoryState,
  RetrieveMemoryInput,
  SearchMemoryInput,
  StoreMemoryInput,
  UpdateMemoryInput,
} from "./types.js";

export interface ExecutionMemoryOptions {
  configuration?: Partial<ExecutionMemoryConfiguration>;
}

/** Authoritative Q0-04 Execution Memory — single source of executive execution history. */
export class ExecutionMemory {
  private initializedAt: string | null = null;
  private readonly controller: ExecutionMemoryController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ExecutionMemoryOptions = {},
  ) {
    this.controller = new ExecutionMemoryController(
      new ExecutionMemoryCore(),
      buildExecutionMemoryConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(EXECUTION_MEMORY_SYSTEM_PATH);
    if (!doc?.includes("Execution Memory")) {
      throw new Error(`${EXECUTION_MEMORY_SYSTEM_PATH} missing — Q0-04 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): ExecutionMemoryState {
    if (!this.initializedAt) throw new Error("Execution Memory not initialized. Call initialize() first.");
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const total = this.getRecords().length;
    return {
      engineVersion: "PILLOW-EXM-001",
      missionId: "Q0-04",
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
        totalRecords: total,
        notes: [
          "Memory only: does not make decisions, plan missions, assign workers, execute work, or replace knowledge systems.",
        ],
      },
    };
  }

  connectExecutionMemory(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  storeRecord(input: StoreMemoryInput) {
    return this.controller.storeRecord(input);
  }

  retrieveRecord(input: RetrieveMemoryInput) {
    return this.controller.retrieveRecord(input);
  }

  searchRecords(input: SearchMemoryInput = {}) {
    return this.controller.searchRecords(input);
  }

  updateRecord(input: UpdateMemoryInput) {
    return this.controller.updateRecord(input);
  }

  listRecords() {
    return this.controller.listRecords();
  }

  validateRecords() {
    return this.controller.validateRecords();
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  getRecord(memoryId: string) {
    return this.controller.getManager().getRecord(memoryId);
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
        `Records: ${state.health.totalRecords}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ExecutionMemoryCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-04",
      status: state.status,
      healthStatus: state.health.status,
      totalRecords: state.health.totalRecords,
      neverMakeDecisions: true,
      neverPlanMissions: true,
      neverAssignWorkers: true,
      neverExecuteWork: true,
      neverReplaceKnowledgeSystems: true,
    };
  }
}

export function createExecutionMemory(
  bootstrap: EmpireBootstrapContext,
  options?: ExecutionMemoryOptions,
) {
  return new ExecutionMemory(bootstrap, options);
}

export function resetExecutionMemoryForTesting() {
  resetExmLogsForTesting();
}
