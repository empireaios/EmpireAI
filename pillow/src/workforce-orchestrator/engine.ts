import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildWorkforceOrchestratorConfiguration,
  type WorkforceOrchestratorConfiguration,
} from "./configuration.js";
import { WorkforceOrchestratorController } from "./workforce-orchestrator-controller.js";
import { WorkforceOrchestratorManager } from "./workforce-orchestrator-manager.js";
import { resetPwoLogsForTesting } from "./pwo-logging.js";
import { resetOrchestrationSequenceForTesting } from "./workforce-coordinator.js";
import { WORKFORCE_ORCHESTRATOR_SYSTEM_PATH } from "./paths.js";
import type {
  WorkforceOrchestratorCockpitSnapshot,
  WorkforceOrchestratorInput,
  WorkforceOrchestratorState,
} from "./types.js";

export interface WorkforceOrchestratorOptions {
  configuration?: Partial<WorkforceOrchestratorConfiguration>;
}

/** Authoritative Q0-09 Pillow Workforce Orchestrator — coordinates workers only. */
export class WorkforceOrchestrator {
  private initializedAt: string | null = null;
  private readonly controller: WorkforceOrchestratorController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: WorkforceOrchestratorOptions = {},
  ) {
    this.controller = new WorkforceOrchestratorController(
      new WorkforceOrchestratorManager(),
      buildWorkforceOrchestratorConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      WORKFORCE_ORCHESTRATOR_SYSTEM_PATH,
    );
    if (!doc?.includes("Workforce Orchestrator")) {
      throw new Error(`${WORKFORCE_ORCHESTRATOR_SYSTEM_PATH} missing — Q0-09 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): WorkforceOrchestratorState {
    if (!this.initializedAt) {
      throw new Error("Workforce Orchestrator not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    const total = this.getRecords().length;
    return {
      engineVersion: "PILLOW-PWO-001",
      missionId: "Q0-09",
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
        totalOrchestrations: total,
        activeWorkers: engineRecord?.activeWorkers ?? 0,
        notes: [
          "Orchestration only: does not perform worker tasks, replace worker logic, override Pillow/Grand King, or perform strategic planning.",
        ],
      },
    };
  }

  connectWorkforceOrchestrator(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  receiveIntent(input: WorkforceOrchestratorInput) {
    return this.controller.receiveIntent(input);
  }

  discoverWorkers(input: WorkforceOrchestratorInput) {
    return this.controller.discoverWorkers(input);
  }

  selectWorkers(input: WorkforceOrchestratorInput) {
    return this.controller.selectWorkers(input);
  }

  buildGroups(input: WorkforceOrchestratorInput) {
    return this.controller.buildGroups(input);
  }

  coordinate(input: WorkforceOrchestratorInput) {
    return this.controller.coordinate(input);
  }

  monitor(input: WorkforceOrchestratorInput) {
    return this.controller.monitor(input);
  }

  handleFailure(input: WorkforceOrchestratorInput) {
    return this.controller.handleFailure(input);
  }

  handleTimeout(input: WorkforceOrchestratorInput) {
    return this.controller.handleTimeout(input);
  }

  handleEscalation(input: WorkforceOrchestratorInput) {
    return this.controller.handleEscalation(input);
  }

  produceRecord(input: WorkforceOrchestratorInput) {
    return this.controller.produceRecord(input);
  }

  validateOrchestrations(input: WorkforceOrchestratorInput = { executiveRequest: "" }) {
    return this.controller.validateOrchestrations(input);
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

  getDiscoveredWorkers() {
    return this.controller.getManager().getDiscoveredWorkers();
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
        `Orchestrations: ${state.health.totalOrchestrations}`,
        `Active workers: ${state.health.activeWorkers}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WorkforceOrchestratorCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-09",
      status: state.status,
      healthStatus: state.health.status,
      totalOrchestrations: state.health.totalOrchestrations,
      activeWorkers: state.health.activeWorkers,
      latestOrchestrationId: this.getLatestRecord()?.orchestrationId ?? null,
      neverPerformWorkerTasks: true,
      neverReplaceWorkerLogic: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverPerformStrategicPlanning: true,
    };
  }
}

export function createWorkforceOrchestrator(
  bootstrap: EmpireBootstrapContext,
  options?: WorkforceOrchestratorOptions,
) {
  return new WorkforceOrchestrator(bootstrap, options);
}

export function resetWorkforceOrchestratorForTesting() {
  resetPwoLogsForTesting();
  resetOrchestrationSequenceForTesting();
}
