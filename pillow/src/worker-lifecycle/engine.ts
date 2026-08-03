import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildWorkerLifecycleConfiguration,
  type WorkerLifecycleConfiguration,
} from "./configuration.js";
import { resetLifecycleSequenceForTesting } from "./lifecycle-builder.js";
import { WORKER_LIFECYCLE_SYSTEM_PATH } from "./paths.js";
import { WorkerLifecycleController } from "./worker-lifecycle-controller.js";
import { WorkerLifecycleCore } from "./worker-lifecycle-core.js";
import { resetWlcLogsForTesting } from "./wlc-logging.js";
import type {
  WorkerLifecycleCockpitSnapshot,
  WorkerLifecycleInput,
  WorkerLifecycleState,
} from "./types.js";

export interface WorkerLifecycleOptions {
  configuration?: Partial<WorkerLifecycleConfiguration>;
}

/** Authoritative Q1-08 Worker Lifecycle — govern transitions only. */
export class WorkerLifecycle {
  private initializedAt: string | null = null;
  private readonly controller: WorkerLifecycleController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: WorkerLifecycleOptions = {},
  ) {
    this.controller = new WorkerLifecycleController(
      new WorkerLifecycleCore(),
      buildWorkerLifecycleConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      WORKER_LIFECYCLE_SYSTEM_PATH,
    );
    if (!doc?.includes("Worker Lifecycle")) {
      throw new Error(`${WORKER_LIFECYCLE_SYSTEM_PATH} missing — Q1-08 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): WorkerLifecycleState {
    if (!this.initializedAt) {
      throw new Error("Worker Lifecycle not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-WLC-001",
      missionId: "Q1-08",
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
        lastLifecycleDecision: engineRecord?.lastLifecycleDecision ?? null,
        notes: [
          "Govern only: does not execute worker tasks, replace Worker Registry, replace Workforce Certification Monitor, override Pillow, or override Grand King. Workers are never permanently deleted.",
        ],
      },
    };
  }

  connectWorkerLifecycle(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  createWorker(input: WorkerLifecycleInput = {}) {
    return this.controller.create(input);
  }

  onboardWorker(input: WorkerLifecycleInput = {}) {
    return this.controller.onboard(input);
  }

  configureWorker(input: WorkerLifecycleInput = {}) {
    return this.controller.configure(input);
  }

  activateWorker(input: WorkerLifecycleInput = {}) {
    return this.controller.activate(input);
  }

  suspendWorker(input: WorkerLifecycleInput = {}) {
    return this.controller.suspend(input);
  }

  resumeWorker(input: WorkerLifecycleInput = {}) {
    return this.controller.resume(input);
  }

  replaceWorker(input: WorkerLifecycleInput = {}) {
    return this.controller.replace(input);
  }

  retireWorker(input: WorkerLifecycleInput = {}) {
    return this.controller.retire(input);
  }

  archiveWorker(input: WorkerLifecycleInput = {}) {
    return this.controller.archive(input);
  }

  auditWorker(input: WorkerLifecycleInput = {}) {
    return this.controller.audit(input);
  }

  restoreWorker(input: WorkerLifecycleInput = {}) {
    return this.controller.restore(input);
  }

  produceLifecycle(input: WorkerLifecycleInput = {}) {
    return this.controller.produce(input);
  }

  listLifecycleRecords() {
    return this.controller.list();
  }

  validateWorkerLifecycle(input: WorkerLifecycleInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getProfiles() {
    return this.controller.getManager().getProfiles();
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

  getLatestLifecycleId() {
    return this.controller.getManager().getLatestLifecycleId();
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

  getCockpitSnapshot(): WorkerLifecycleCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q1-08",
      status: state.status,
      healthStatus: state.health.status,
      totalWorkers: state.health.totalWorkers,
      totalRecords: state.health.totalRecords,
      latestLifecycleId: this.getLatestLifecycleId(),
      neverExecuteWorkerTasks: true,
      neverReplaceWorkerRegistry: true,
      neverReplaceWorkforceCertificationMonitor: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverPermanentlyDeleted: true,
    };
  }
}

export function createWorkerLifecycle(
  bootstrap: EmpireBootstrapContext,
  options?: WorkerLifecycleOptions,
) {
  return new WorkerLifecycle(bootstrap, options);
}

export function resetWorkerLifecycleForTesting() {
  resetWlcLogsForTesting();
  resetLifecycleSequenceForTesting();
}
