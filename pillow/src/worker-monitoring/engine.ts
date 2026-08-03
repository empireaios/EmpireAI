import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildWorkerMonitoringConfiguration,
  type WorkerMonitoringConfiguration,
} from "./configuration.js";
import { resetMonitoringSequenceForTesting } from "./monitoring-builder.js";
import { WORKER_MONITORING_SYSTEM_PATH } from "./paths.js";
import { WorkerMonitoringController } from "./worker-monitoring-controller.js";
import { WorkerMonitoringCore } from "./worker-monitoring-core.js";
import { resetWmoLogsForTesting } from "./wmo-logging.js";
import type {
  WorkerMonitoringCockpitSnapshot,
  WorkerMonitoringInput,
  WorkerMonitoringState,
} from "./types.js";

export interface WorkerMonitoringOptions {
  configuration?: Partial<WorkerMonitoringConfiguration>;
}

/** Authoritative Q1-10 Worker Monitoring — observe and report only. */
export class WorkerMonitoring {
  private initializedAt: string | null = null;
  private readonly controller: WorkerMonitoringController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: WorkerMonitoringOptions = {},
  ) {
    this.controller = new WorkerMonitoringController(
      new WorkerMonitoringCore(),
      buildWorkerMonitoringConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      WORKER_MONITORING_SYSTEM_PATH,
    );
    if (!doc?.includes("Worker Monitoring")) {
      throw new Error(`${WORKER_MONITORING_SYSTEM_PATH} missing — Q1-10 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): WorkerMonitoringState {
    if (!this.initializedAt) {
      throw new Error("Worker Monitoring not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-WMO-001",
      missionId: "Q1-10",
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
        totalAlerts: engineRecord?.totalAlerts ?? 0,
        lastMonitoringDecision: engineRecord?.lastMonitoringDecision ?? null,
        notes: [
          "Observe only: does not execute worker tasks, restart workers automatically, replace Workforce Certification Monitor, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectWorkerMonitoring(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  registerMonitoredWorker(input: WorkerMonitoringInput = {}) {
    return this.controller.registerWorker(input);
  }

  observeWorker(input: WorkerMonitoringInput = {}) {
    return this.controller.observe(input);
  }

  scanActiveWorkers(input: WorkerMonitoringInput = {}) {
    return this.controller.scanActive(input);
  }

  detectAnomalies(input: WorkerMonitoringInput = {}) {
    return this.controller.detectAnomalies(input);
  }

  generateAlerts(input: WorkerMonitoringInput = {}) {
    return this.controller.generateAlerts(input);
  }

  recordMonitoringEvent(input: WorkerMonitoringInput = {}) {
    return this.controller.recordEvent(input);
  }

  produceMonitoring(input: WorkerMonitoringInput = {}) {
    return this.controller.produce(input);
  }

  listMonitoringRecords() {
    return this.controller.list();
  }

  validateWorkerMonitoring(input: WorkerMonitoringInput = {}) {
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

  getAlerts() {
    return this.controller.getManager().getAlerts();
  }

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestMonitoringId() {
    return this.controller.getManager().getLatestMonitoringId();
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
        `Alerts: ${state.health.totalAlerts}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WorkerMonitoringCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q1-10",
      status: state.status,
      healthStatus: state.health.status,
      totalWorkers: state.health.totalWorkers,
      totalRecords: state.health.totalRecords,
      totalAlerts: state.health.totalAlerts,
      latestMonitoringId: this.getLatestMonitoringId(),
      neverExecuteWorkerTasks: true,
      neverRestartWorkersAutomatically: true,
      neverReplaceWorkforceCertificationMonitor: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createWorkerMonitoring(
  bootstrap: EmpireBootstrapContext,
  options?: WorkerMonitoringOptions,
) {
  return new WorkerMonitoring(bootstrap, options);
}

export function resetWorkerMonitoringForTesting() {
  resetWmoLogsForTesting();
  resetMonitoringSequenceForTesting();
}
