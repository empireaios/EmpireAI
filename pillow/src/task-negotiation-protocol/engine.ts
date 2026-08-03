import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildTaskNegotiationProtocolConfiguration,
  type TaskNegotiationProtocolConfiguration,
} from "./configuration.js";
import { TaskNegotiationProtocolController } from "./task-negotiation-protocol-controller.js";
import { TaskNegotiationProtocolCore } from "./task-negotiation-protocol-core.js";
import { resetTnpLogsForTesting } from "./tnp-logging.js";
import { resetNegotiationSequenceForTesting } from "./negotiation-store.js";
import { TASK_NEGOTIATION_PROTOCOL_SYSTEM_PATH } from "./paths.js";
import type {
  TaskNegotiationProtocolCockpitSnapshot,
  TaskNegotiationProtocolInput,
  TaskNegotiationProtocolState,
} from "./types.js";

export interface TaskNegotiationProtocolOptions {
  configuration?: Partial<TaskNegotiationProtocolConfiguration>;
}

/** Authoritative Q0-20 Task Negotiation Protocol — negotiate/coordinate only. */
export class TaskNegotiationProtocol {
  private initializedAt: string | null = null;
  private readonly controller: TaskNegotiationProtocolController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: TaskNegotiationProtocolOptions = {},
  ) {
    this.controller = new TaskNegotiationProtocolController(
      new TaskNegotiationProtocolCore(),
      buildTaskNegotiationProtocolConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      TASK_NEGOTIATION_PROTOCOL_SYSTEM_PATH,
    );
    if (!doc?.includes("Task Negotiation Protocol")) {
      throw new Error(
        `${TASK_NEGOTIATION_PROTOCOL_SYSTEM_PATH} missing — Q0-20 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): TaskNegotiationProtocolState {
    if (!this.initializedAt) {
      throw new Error("Task Negotiation Protocol not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-TNP-001",
      missionId: "Q0-20",
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
        totalNegotiationRecords: this.getRecords().length,
        lastOutcome: engineRecord?.lastOutcome ?? null,
        notes: [
          "Negotiate only: does not execute worker tasks, replace Workforce Orchestrator, replace Pillow, override Grand King, or perform strategic planning.",
        ],
      },
    };
  }

  connectTaskNegotiationProtocol(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveTask(input: TaskNegotiationProtocolInput = {}) {
    return this.controller.receiveTask(input);
  }

  identifyCandidates(input: TaskNegotiationProtocolInput = {}) {
    return this.controller.identifyCandidates(input);
  }

  declareCapability(input: TaskNegotiationProtocolInput = {}) {
    return this.controller.declareCapability(input);
  }

  declineWork(input: TaskNegotiationProtocolInput = {}) {
    return this.controller.declineWork(input);
  }

  resolveOwnership(input: TaskNegotiationProtocolInput = {}) {
    return this.controller.resolveOwnership(input);
  }

  negotiate(input: TaskNegotiationProtocolInput = {}) {
    return this.controller.negotiate(input);
  }

  detectConflicts(input: TaskNegotiationProtocolInput = {}) {
    return this.controller.detectConflicts(input);
  }

  escalateToPillow(input: TaskNegotiationProtocolInput = {}) {
    return this.controller.escalate(input);
  }

  listNegotiations() {
    return this.controller.list();
  }

  validateTaskNegotiationProtocol(input: TaskNegotiationProtocolInput = {}) {
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
      health:
        score >= 75
          ? ("healthy" as const)
          : score >= 50
            ? ("degraded" as const)
            : ("blocked" as const),
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Negotiation records: ${state.health.totalNegotiationRecords}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): TaskNegotiationProtocolCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-20",
      status: state.status,
      healthStatus: state.health.status,
      totalNegotiationRecords: state.health.totalNegotiationRecords,
      latestNegotiationId: this.getLatestRecord()?.negotiationId ?? null,
      lastOutcome: state.health.lastOutcome,
      neverExecuteWorkerTasks: true,
      neverReplaceWorkforceOrchestrator: true,
      neverReplacePillow: true,
      neverOverrideGrandKing: true,
      neverPerformStrategicPlanning: true,
    };
  }
}

export function createTaskNegotiationProtocol(
  bootstrap: EmpireBootstrapContext,
  options?: TaskNegotiationProtocolOptions,
) {
  return new TaskNegotiationProtocol(bootstrap, options);
}

export function resetTaskNegotiationProtocolForTesting() {
  resetTnpLogsForTesting();
  resetNegotiationSequenceForTesting();
}
