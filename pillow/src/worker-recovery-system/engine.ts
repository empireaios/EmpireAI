import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildWorkerRecoverySystemConfiguration,
  type WorkerRecoverySystemConfiguration,
} from "./configuration.js";
import { resetRecoverySequenceForTesting } from "./recovery-builder.js";
import { WORKER_RECOVERY_SYSTEM_PATH } from "./paths.js";
import { WorkerRecoverySystemController } from "./worker-recovery-system-controller.js";
import { WorkerRecoverySystemCore } from "./worker-recovery-system-core.js";
import { resetWrsLogsForTesting } from "./wrs-logging.js";
import type {
  WorkerRecoveryCockpitSnapshot,
  WorkerRecoveryInput,
  WorkerRecoverySystemState,
} from "./types.js";

export interface WorkerRecoverySystemOptions {
  configuration?: Partial<WorkerRecoverySystemConfiguration>;
}

/** Authoritative Q1-12 Worker Recovery System — continuity recovery only. */
export class WorkerRecoverySystem {
  private initializedAt: string | null = null;
  private readonly controller: WorkerRecoverySystemController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: WorkerRecoverySystemOptions = {},
  ) {
    this.controller = new WorkerRecoverySystemController(
      new WorkerRecoverySystemCore(),
      buildWorkerRecoverySystemConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      WORKER_RECOVERY_SYSTEM_PATH,
    );
    if (!doc?.includes("Worker Recovery System")) {
      throw new Error(
        `${WORKER_RECOVERY_SYSTEM_PATH} missing — Q1-12 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): WorkerRecoverySystemState {
    if (!this.initializedAt) {
      throw new Error("Worker Recovery System not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-WRS-001",
      missionId: "Q1-12",
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
        totalEscalations: engineRecord?.totalEscalations ?? 0,
        lastRecoveryDecision: engineRecord?.lastRecoveryDecision ?? null,
        notes: [
          "Recover continuity only: does not execute worker business logic, replace Worker Monitoring, replace Workforce Orchestrator, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectWorkerRecoverySystem(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  registerRecoverableWorker(input: WorkerRecoveryInput = {}) {
    return this.controller.registerWorker(input);
  }

  detectFailure(input: WorkerRecoveryInput = {}) {
    return this.controller.detectFailure(input);
  }

  detectStalledWorker(input: WorkerRecoveryInput = {}) {
    return this.controller.detectStalled(input);
  }

  detectHungWorker(input: WorkerRecoveryInput = {}) {
    return this.controller.detectHung(input);
  }

  analyseRecoveryOptions(input: WorkerRecoveryInput = {}) {
    return this.controller.analyseOptions(input);
  }

  recoverWorker(input: WorkerRecoveryInput = {}) {
    return this.controller.recover(input);
  }

  restartWorker(input: WorkerRecoveryInput = {}) {
    return this.controller.restart(input);
  }

  resumeWorker(input: WorkerRecoveryInput = {}) {
    return this.controller.resume(input);
  }

  reassignWork(input: WorkerRecoveryInput = {}) {
    return this.controller.reassign(input);
  }

  rollbackWork(input: WorkerRecoveryInput = {}) {
    return this.controller.rollback(input);
  }

  preserveExecutionState(input: WorkerRecoveryInput = {}) {
    return this.controller.preserveState(input);
  }

  escalateToPillow(input: WorkerRecoveryInput = {}) {
    return this.controller.escalate(input);
  }

  produceRecovery(input: WorkerRecoveryInput = {}) {
    return this.controller.produce(input);
  }

  listRecoveryRecords() {
    return this.controller.list();
  }

  validateWorkerRecoverySystem(input: WorkerRecoveryInput = {}) {
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

  getLatestRecoveryId() {
    return this.controller.getManager().getLatestRecoveryId();
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
        `Escalations: ${state.health.totalEscalations}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WorkerRecoveryCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q1-12",
      status: state.status,
      healthStatus: state.health.status,
      totalWorkers: state.health.totalWorkers,
      totalRecords: state.health.totalRecords,
      totalEscalations: state.health.totalEscalations,
      latestRecoveryId: this.getLatestRecoveryId(),
      neverExecuteWorkerBusinessLogic: true,
      neverReplaceWorkerMonitoring: true,
      neverReplaceWorkforceOrchestrator: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createWorkerRecoverySystem(
  bootstrap: EmpireBootstrapContext,
  options?: WorkerRecoverySystemOptions,
) {
  return new WorkerRecoverySystem(bootstrap, options);
}

export function resetWorkerRecoverySystemForTesting() {
  resetWrsLogsForTesting();
  resetRecoverySequenceForTesting();
}
