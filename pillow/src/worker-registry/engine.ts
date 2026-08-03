import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildWorkerRegistryConfiguration,
  type WorkerRegistryConfiguration,
} from "./configuration.js";
import { resetWorkerSequenceForTesting } from "./registry-builder.js";
import { WORKER_REGISTRY_SYSTEM_PATH } from "./paths.js";
import { WorkerRegistryController } from "./worker-registry-controller.js";
import { WorkerRegistryCore } from "./worker-registry-core.js";
import { resetWrgLogsForTesting } from "./wrg-logging.js";
import type {
  WorkerRegistryCockpitSnapshot,
  WorkerRegistryInput,
  WorkerRegistryState,
} from "./types.js";

export interface WorkerRegistryOptions {
  configuration?: Partial<WorkerRegistryConfiguration>;
}

/** Authoritative Q1-07 Worker Registry — register and discover only. */
export class WorkerRegistry {
  private initializedAt: string | null = null;
  private readonly controller: WorkerRegistryController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: WorkerRegistryOptions = {},
  ) {
    this.controller = new WorkerRegistryController(
      new WorkerRegistryCore(),
      buildWorkerRegistryConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      WORKER_REGISTRY_SYSTEM_PATH,
    );
    if (!doc?.includes("Worker Registry")) {
      throw new Error(`${WORKER_REGISTRY_SYSTEM_PATH} missing — Q1-07 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): WorkerRegistryState {
    if (!this.initializedAt) {
      throw new Error("Worker Registry not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-WRG-001",
      missionId: "Q1-07",
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
        registryVersion: configuration.registryVersion,
        totalWorkers: engineRecord?.totalWorkers ?? 0,
        departmentCount: engineRecord?.departmentCount ?? 0,
        factoryCount: engineRecord?.factoryCount ?? 0,
        lastRegistryDecision: engineRecord?.lastRegistryDecision ?? null,
        notes: [
          "Register only: does not execute worker tasks, replace Workforce Capability Registry, replace Organization Charter, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectWorkerRegistry(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  registerWorker(input: WorkerRegistryInput = {}) {
    return this.controller.registerWorker(input);
  }

  getWorker(input: WorkerRegistryInput = {}) {
    return this.controller.getWorker(input);
  }

  queryByDepartment(input: WorkerRegistryInput = {}) {
    return this.controller.queryByDepartment(input);
  }

  queryByRole(input: WorkerRegistryInput = {}) {
    return this.controller.queryByRole(input);
  }

  queryByFactory(input: WorkerRegistryInput = {}) {
    return this.controller.queryByFactory(input);
  }

  validateReportingLine(input: WorkerRegistryInput = {}) {
    return this.controller.validateReportingLine(input);
  }

  updateStatus(input: WorkerRegistryInput = {}) {
    return this.controller.updateStatus(input);
  }

  produceRegistry(input: WorkerRegistryInput = {}) {
    return this.controller.produceRegistry(input);
  }

  listWorkers() {
    return this.controller.list();
  }

  validateWorkerRegistry(input: WorkerRegistryInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getWorkers() {
    return this.controller.getManager().getWorkers();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestWorkerId() {
    return this.controller.getManager().getLatestWorkerId();
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
        `Registry: ${state.health.registryVersion}`,
        `Workers: ${state.health.totalWorkers}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WorkerRegistryCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q1-07",
      status: state.status,
      healthStatus: state.health.status,
      registryVersion: state.health.registryVersion,
      totalWorkers: state.health.totalWorkers,
      departmentCount: state.health.departmentCount,
      factoryCount: state.health.factoryCount,
      latestWorkerId: this.getLatestWorkerId(),
      neverExecuteWorkerTasks: true,
      neverReplaceWorkforceCapabilityRegistry: true,
      neverReplaceOrganizationCharter: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createWorkerRegistry(
  bootstrap: EmpireBootstrapContext,
  options?: WorkerRegistryOptions,
) {
  return new WorkerRegistry(bootstrap, options);
}

export function resetWorkerRegistryForTesting() {
  resetWrgLogsForTesting();
  resetWorkerSequenceForTesting();
}
