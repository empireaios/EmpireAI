import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildWorkforceAccessManagerConfiguration,
  type WorkforceAccessManagerConfiguration,
} from "./configuration.js";
import { WorkforceAccessManagerController } from "./workforce-access-manager-controller.js";
import { WorkforceAccessManagerCore } from "./workforce-access-manager-core.js";
import { resetWamLogsForTesting } from "./wam-logging.js";
import { resetAccessSequenceForTesting } from "./access-controller.js";
import { WORKFORCE_ACCESS_MANAGER_SYSTEM_PATH } from "./paths.js";
import type {
  WorkforceAccessManagerCockpitSnapshot,
  WorkforceAccessManagerInput,
  WorkforceAccessManagerState,
} from "./types.js";

export interface WorkforceAccessManagerOptions {
  configuration?: Partial<WorkforceAccessManagerConfiguration>;
}

/** Authoritative Q0-11 Workforce Access Manager — executive access control only. */
export class WorkforceAccessManager {
  private initializedAt: string | null = null;
  private readonly controller: WorkforceAccessManagerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: WorkforceAccessManagerOptions = {},
  ) {
    this.controller = new WorkforceAccessManagerController(
      new WorkforceAccessManagerCore(),
      buildWorkforceAccessManagerConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      WORKFORCE_ACCESS_MANAGER_SYSTEM_PATH,
    );
    if (!doc?.includes("Workforce Access Manager")) {
      throw new Error(`${WORKFORCE_ACCESS_MANAGER_SYSTEM_PATH} missing — Q0-11 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): WorkforceAccessManagerState {
    if (!this.initializedAt) {
      throw new Error("Workforce Access Manager not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-WAM-001",
      missionId: "Q0-11",
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
        totalAccessRecords: this.getRecords().length,
        connectedWorkers: engineRecord?.connectedWorkers ?? 0,
        notes: [
          "Access only: does not execute worker logic, replace implementations, perform orchestration, make strategic decisions, or override Grand King.",
        ],
      },
    };
  }

  connectWorkforceAccessManager(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  locateWorker(input: WorkforceAccessManagerInput) {
    return this.controller.locate(input);
  }

  invokeWorker(input: WorkforceAccessManagerInput) {
    return this.controller.invoke(input);
  }

  suspendWorker(input: WorkforceAccessManagerInput) {
    return this.controller.suspend(input);
  }

  resumeWorker(input: WorkforceAccessManagerInput) {
    return this.controller.resume(input);
  }

  pauseWorker(input: WorkforceAccessManagerInput) {
    return this.controller.pause(input);
  }

  continueWorker(input: WorkforceAccessManagerInput) {
    return this.controller.continueAccess(input);
  }

  reassignWorker(input: WorkforceAccessManagerInput) {
    return this.controller.reassign(input);
  }

  inspectWorker(input: WorkforceAccessManagerInput) {
    return this.controller.inspect(input);
  }

  restartWorker(input: WorkforceAccessManagerInput) {
    return this.controller.restart(input);
  }

  stopWorker(input: WorkforceAccessManagerInput) {
    return this.controller.stop(input);
  }

  listAccess() {
    return this.controller.listAccess();
  }

  validateAccess(input: WorkforceAccessManagerInput = { executiveRequest: "" }) {
    return this.controller.validateAccess(input);
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

  getWorkers() {
    return this.controller.getManager().getWorkers();
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
        `Access records: ${state.health.totalAccessRecords}`,
        `Connected workers: ${state.health.connectedWorkers}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WorkforceAccessManagerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-11",
      status: state.status,
      healthStatus: state.health.status,
      totalAccessRecords: state.health.totalAccessRecords,
      connectedWorkers: state.health.connectedWorkers,
      latestAccessId: this.getLatestRecord()?.accessId ?? null,
      neverExecuteWorkerLogic: true,
      neverReplaceWorkerImplementations: true,
      neverPerformOrchestration: true,
      neverMakeStrategicDecisions: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createWorkforceAccessManager(
  bootstrap: EmpireBootstrapContext,
  options?: WorkforceAccessManagerOptions,
) {
  return new WorkforceAccessManager(bootstrap, options);
}

export function resetWorkforceAccessManagerForTesting() {
  resetWamLogsForTesting();
  resetAccessSequenceForTesting();
}
