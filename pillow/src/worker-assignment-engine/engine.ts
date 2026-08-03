import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildWorkerAssignmentEngineConfiguration,
  type WorkerAssignmentEngineConfiguration,
} from "./configuration.js";
import { resetAssignmentSequenceForTesting } from "./assignment-builder.js";
import { WORKER_ASSIGNMENT_ENGINE_SYSTEM_PATH } from "./paths.js";
import { WorkerAssignmentEngineController } from "./worker-assignment-engine-controller.js";
import { WorkerAssignmentEngineCore } from "./worker-assignment-engine-core.js";
import { resetWaeLogsForTesting } from "./wae-logging.js";
import type {
  WorkerAssignmentCockpitSnapshot,
  WorkerAssignmentEngineState,
  WorkerAssignmentInput,
} from "./types.js";

export interface WorkerAssignmentEngineOptions {
  configuration?: Partial<WorkerAssignmentEngineConfiguration>;
}

/** Authoritative Q1-09 Worker Assignment Engine — recommend assignments only. */
export class WorkerAssignmentEngine {
  private initializedAt: string | null = null;
  private readonly controller: WorkerAssignmentEngineController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: WorkerAssignmentEngineOptions = {},
  ) {
    this.controller = new WorkerAssignmentEngineController(
      new WorkerAssignmentEngineCore(),
      buildWorkerAssignmentEngineConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      WORKER_ASSIGNMENT_ENGINE_SYSTEM_PATH,
    );
    if (!doc?.includes("Worker Assignment Engine")) {
      throw new Error(
        `${WORKER_ASSIGNMENT_ENGINE_SYSTEM_PATH} missing — Q1-09 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): WorkerAssignmentEngineState {
    if (!this.initializedAt) {
      throw new Error("Worker Assignment Engine not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-WAE-001",
      missionId: "Q1-09",
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
        totalWorkers: engineRecord?.totalWorkers ?? 0,
        totalRecords: engineRecord?.totalRecords ?? 0,
        lastAssignmentDecision: engineRecord?.lastAssignmentDecision ?? null,
        notes: [
          "Recommend only: does not execute worker tasks, replace Workforce Orchestrator, replace Task Negotiation Protocol, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectWorkerAssignmentEngine(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  submitMission(input: WorkerAssignmentInput = {}) {
    return this.controller.submitMission(input);
  }

  discoverEligibleWorkers(input: WorkerAssignmentInput = {}) {
    return this.controller.discoverEligible(input);
  }

  evaluateCandidates(input: WorkerAssignmentInput = {}) {
    return this.controller.evaluateCandidates(input);
  }

  recommendPrimaryWorker(input: WorkerAssignmentInput = {}) {
    return this.controller.recommendPrimary(input);
  }

  recommendSupportingWorkers(input: WorkerAssignmentInput = {}) {
    return this.controller.recommendSupporting(input);
  }

  recommendAssignment(input: WorkerAssignmentInput = {}) {
    return this.controller.recommendAssignment(input);
  }

  produceAssignments(input: WorkerAssignmentInput = {}) {
    return this.controller.produce(input);
  }

  listAssignments() {
    return this.controller.list();
  }

  validateWorkerAssignmentEngine(input: WorkerAssignmentInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getWorkers() {
    return this.controller.getManager().getWorkers();
  }

  getRecords() {
    return this.controller.getManager().getRecords();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestAssignmentId() {
    return this.controller.getManager().getLatestAssignmentId();
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
        `Workers: ${state.health.totalWorkers}`,
        `Records: ${state.health.totalRecords}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WorkerAssignmentCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q1-09",
      status: state.status,
      healthStatus: state.health.status,
      totalWorkers: state.health.totalWorkers,
      totalRecords: state.health.totalRecords,
      latestAssignmentId: this.getLatestAssignmentId(),
      neverExecuteWorkerTasks: true,
      neverReplaceWorkforceOrchestrator: true,
      neverReplaceTaskNegotiationProtocol: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createWorkerAssignmentEngine(
  bootstrap: EmpireBootstrapContext,
  options?: WorkerAssignmentEngineOptions,
) {
  return new WorkerAssignmentEngine(bootstrap, options);
}

export function resetWorkerAssignmentEngineForTesting() {
  resetWaeLogsForTesting();
  resetAssignmentSequenceForTesting();
}
