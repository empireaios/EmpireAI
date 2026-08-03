import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildWorkforceOperatingSystemConfiguration,
  type WorkforceOperatingSystemConfiguration,
} from "./configuration.js";
import { WorkforceOperatingSystemController } from "./workforce-operating-system-controller.js";
import {
  resetWorkforceOsCoreSequencesForTesting,
  WorkforceOperatingSystemCore,
} from "./workforce-operating-system-core.js";
import { resetWfosLogsForTesting } from "./wfos-logging.js";
import { resetRuntimeSequenceForTesting } from "./workforce-os-store.js";
import { WORKFORCE_OPERATING_SYSTEM_SYSTEM_PATH } from "./paths.js";
import type {
  WorkforceOperatingSystemCockpitSnapshot,
  WorkforceOperatingSystemInput,
  WorkforceOperatingSystemState,
} from "./types.js";

export interface WorkforceOperatingSystemOptions {
  configuration?: Partial<WorkforceOperatingSystemConfiguration>;
}

/** Authoritative Q0-19 Workforce Operating System — organization runtime only. */
export class WorkforceOperatingSystem {
  private initializedAt: string | null = null;
  private readonly controller: WorkforceOperatingSystemController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: WorkforceOperatingSystemOptions = {},
  ) {
    this.controller = new WorkforceOperatingSystemController(
      new WorkforceOperatingSystemCore(),
      buildWorkforceOperatingSystemConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      WORKFORCE_OPERATING_SYSTEM_SYSTEM_PATH,
    );
    if (!doc?.includes("Workforce Operating System")) {
      throw new Error(
        `${WORKFORCE_OPERATING_SYSTEM_SYSTEM_PATH} missing — Q0-19 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): WorkforceOperatingSystemState {
    if (!this.initializedAt) {
      throw new Error("Workforce Operating System not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-WFOS-001",
      missionId: "Q0-19",
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
        totalRuntimeRecords: this.getRecords().length,
        organizationState: engineRecord?.organizationState ?? "forming",
        activeWorkerCount: engineRecord?.activeWorkerCount ?? 0,
        notes: [
          "Runtime only: does not replace Pillow, replace Workforce Orchestrator, execute worker tasks, make strategic decisions, or override Grand King.",
        ],
      },
    };
  }

  connectWorkforceOperatingSystem(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  startRuntime(input: WorkforceOperatingSystemInput = {}) {
    return this.controller.startRuntime(input);
  }

  registerDepartment(input: WorkforceOperatingSystemInput = {}) {
    return this.controller.registerDepartment(input);
  }

  registerFactory(input: WorkforceOperatingSystemInput = {}) {
    return this.controller.registerFactory(input);
  }

  registerWorker(input: WorkforceOperatingSystemInput = {}) {
    return this.controller.registerWorker(input);
  }

  manageSession(input: WorkforceOperatingSystemInput = {}) {
    return this.controller.manageSession(input);
  }

  coordinateCommunication(input: WorkforceOperatingSystemInput = {}) {
    return this.controller.coordinateCommunication(input);
  }

  discoverWorkers(input: WorkforceOperatingSystemInput = {}) {
    return this.controller.discoverWorkers(input);
  }

  synchronizeState(input: WorkforceOperatingSystemInput = {}) {
    return this.controller.synchronizeState(input);
  }

  monitorHealth(input: WorkforceOperatingSystemInput = {}) {
    return this.controller.monitorHealth(input);
  }

  recoverRuntime(input: WorkforceOperatingSystemInput = {}) {
    return this.controller.recoverRuntime(input);
  }

  listRuntimeRecords() {
    return this.controller.list();
  }

  validateWorkforceOperatingSystem(input: WorkforceOperatingSystemInput = {}) {
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
        `Runtime records: ${state.health.totalRuntimeRecords}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WorkforceOperatingSystemCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-19",
      status: state.status,
      healthStatus: state.health.status,
      totalRuntimeRecords: state.health.totalRuntimeRecords,
      latestRuntimeId: this.getLatestRecord()?.runtimeId ?? null,
      organizationState: state.health.organizationState,
      activeWorkerCount: state.health.activeWorkerCount,
      neverReplacePillow: true,
      neverReplaceWorkforceOrchestrator: true,
      neverExecuteWorkerTasks: true,
      neverMakeStrategicDecisions: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createWorkforceOperatingSystem(
  bootstrap: EmpireBootstrapContext,
  options?: WorkforceOperatingSystemOptions,
) {
  return new WorkforceOperatingSystem(bootstrap, options);
}

export function resetWorkforceOperatingSystemForTesting() {
  resetWfosLogsForTesting();
  resetRuntimeSequenceForTesting();
  resetWorkforceOsCoreSequencesForTesting();
}
