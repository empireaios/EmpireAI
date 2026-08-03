import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildOperationalPlaybookEngineConfiguration,
  type OperationalPlaybookEngineConfiguration,
} from "./configuration.js";
import { OperationalPlaybookEngineController } from "./operational-playbook-engine-controller.js";
import { OperationalPlaybookEngineCore } from "./operational-playbook-engine-core.js";
import { resetOpbkLogsForTesting } from "./opbk-logging.js";
import { resetPlaybookSequencesForTesting } from "./playbook-interpreter.js";
import { OPERATIONAL_PLAYBOOK_ENGINE_SYSTEM_PATH } from "./paths.js";
import type {
  OperationalPlaybookEngineCockpitSnapshot,
  OperationalPlaybookEngineInput,
  OperationalPlaybookEngineState,
} from "./types.js";

export interface OperationalPlaybookEngineOptions {
  configuration?: Partial<OperationalPlaybookEngineConfiguration>;
}

/** Authoritative Q0-15 Operational Playbook Engine — playbook coordination only. */
export class OperationalPlaybookEngine {
  private initializedAt: string | null = null;
  private readonly controller: OperationalPlaybookEngineController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: OperationalPlaybookEngineOptions = {},
  ) {
    this.controller = new OperationalPlaybookEngineController(
      new OperationalPlaybookEngineCore(),
      buildOperationalPlaybookEngineConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      OPERATIONAL_PLAYBOOK_ENGINE_SYSTEM_PATH,
    );
    if (!doc?.includes("Operational Playbook Engine")) {
      throw new Error(`${OPERATIONAL_PLAYBOOK_ENGINE_SYSTEM_PATH} missing — Q0-15 system doc required.`);
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): OperationalPlaybookEngineState {
    if (!this.initializedAt) {
      throw new Error("Operational Playbook Engine not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-OPBK-001",
      missionId: "Q0-15",
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
        totalPlaybooks: this.getPlaybooks().length,
        totalExecutionRecords: this.getExecutions().length,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Playbook coordination only: does not execute worker tasks, replace workers, replace Workforce Orchestrator, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectOperationalPlaybookEngine(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  registerPlaybook(input: OperationalPlaybookEngineInput = {}) {
    return this.controller.register(input);
  }

  retrievePlaybook(input: OperationalPlaybookEngineInput = {}) {
    return this.controller.retrieve(input);
  }

  validatePlaybook(input: OperationalPlaybookEngineInput = {}) {
    return this.controller.validatePlaybook(input);
  }

  selectPlaybook(input: OperationalPlaybookEngineInput = {}) {
    return this.controller.select(input);
  }

  interpretPlaybook(input: OperationalPlaybookEngineInput = {}) {
    return this.controller.interpret(input);
  }

  prepareWorkflow(input: OperationalPlaybookEngineInput = {}) {
    return this.controller.prepareWorkflow(input);
  }

  trackProgress(input: OperationalPlaybookEngineInput = {}) {
    return this.controller.trackProgress(input);
  }

  listPlaybooks() {
    return this.controller.listPlaybooks();
  }

  listExecutions() {
    return this.controller.listExecutions();
  }

  validateEngine(input: OperationalPlaybookEngineInput = {}) {
    return this.controller.validateEngine(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getPlaybooks() {
    return this.controller.getManager().getPlaybooks();
  }

  getExecutions() {
    return this.controller.getManager().getExecutions();
  }

  getLatestExecution() {
    return this.controller.getManager().getLatestExecution();
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
        `Playbooks: ${state.health.totalPlaybooks}`,
        `Executions: ${state.health.totalExecutionRecords}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): OperationalPlaybookEngineCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-15",
      status: state.status,
      healthStatus: state.health.status,
      totalPlaybooks: state.health.totalPlaybooks,
      totalExecutionRecords: state.health.totalExecutionRecords,
      latestExecutionId: this.getLatestExecution()?.executionId ?? null,
      lastConfidenceScore: state.health.lastConfidenceScore,
      neverExecuteWorkerTasks: true,
      neverReplaceWorkers: true,
      neverReplaceWorkforceOrchestrator: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createOperationalPlaybookEngine(
  bootstrap: EmpireBootstrapContext,
  options?: OperationalPlaybookEngineOptions,
) {
  return new OperationalPlaybookEngine(bootstrap, options);
}

export function resetOperationalPlaybookEngineForTesting() {
  resetOpbkLogsForTesting();
  resetPlaybookSequencesForTesting();
}
