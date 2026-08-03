import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildExecutiveCommandCenterConfiguration,
  type ExecutiveCommandCenterConfiguration,
} from "./configuration.js";
import { ExecutiveCommandCenterController } from "./executive-command-center-controller.js";
import { ExecutiveCommandCenterCore } from "./executive-command-center-core.js";
import { resetPeccLogsForTesting } from "./pecc-logging.js";
import { resetCommandSequenceForTesting } from "./executive-command-store.js";
import { EXECUTIVE_COMMAND_CENTER_SYSTEM_PATH } from "./paths.js";
import type {
  ExecutiveCommandCenterCockpitSnapshot,
  ExecutiveCommandCenterInput,
  ExecutiveCommandCenterState,
} from "./types.js";

export interface ExecutiveCommandCenterOptions {
  configuration?: Partial<ExecutiveCommandCenterConfiguration>;
}

/** Authoritative Q0-18 Pillow Executive Command Center — coordinate/route only. */
export class ExecutiveCommandCenter {
  private initializedAt: string | null = null;
  private readonly controller: ExecutiveCommandCenterController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ExecutiveCommandCenterOptions = {},
  ) {
    this.controller = new ExecutiveCommandCenterController(
      new ExecutiveCommandCenterCore(),
      buildExecutiveCommandCenterConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      EXECUTIVE_COMMAND_CENTER_SYSTEM_PATH,
    );
    if (!doc?.includes("Executive Command Center")) {
      throw new Error(
        `${EXECUTIVE_COMMAND_CENTER_SYSTEM_PATH} missing — Q0-18 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): ExecutiveCommandCenterState {
    if (!this.initializedAt) {
      throw new Error("Executive Command Center not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-PECC-001",
      missionId: "Q0-18",
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
        totalCommandRecords: this.getRecords().length,
        registeredWorkerCount: engineRecord?.registeredWorkerCount ?? 0,
        notes: [
          "Coordinate/route only: does not execute worker logic, replace Workforce Orchestrator, replace workers, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectExecutiveCommandCenter(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  submitExecutiveCommand(input: ExecutiveCommandCenterInput = {}) {
    return this.controller.submitCommand(input);
  }

  queryBusinessState(input: ExecutiveCommandCenterInput = {}) {
    return this.controller.queryBusinessState(input);
  }

  accessWorkers(input: ExecutiveCommandCenterInput = {}) {
    return this.controller.accessWorkers(input);
  }

  accessTools(input: ExecutiveCommandCenterInput = {}) {
    return this.controller.accessTools(input);
  }

  accessMissions(input: ExecutiveCommandCenterInput = {}) {
    return this.controller.accessMissions(input);
  }

  accessApprovals(input: ExecutiveCommandCenterInput = {}) {
    return this.controller.accessApprovals(input);
  }

  accessExecutionMemory(input: ExecutiveCommandCenterInput = {}) {
    return this.controller.accessExecutionMemory(input);
  }

  accessDecisionMemory(input: ExecutiveCommandCenterInput = {}) {
    return this.controller.accessDecisionMemory(input);
  }

  accessExecutiveReports(input: ExecutiveCommandCenterInput = {}) {
    return this.controller.accessExecutiveReports(input);
  }

  listCommands() {
    return this.controller.list();
  }

  validateExecutiveCommandCenter(input: ExecutiveCommandCenterInput = {}) {
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
        `Command records: ${state.health.totalCommandRecords}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ExecutiveCommandCenterCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-18",
      status: state.status,
      healthStatus: state.health.status,
      totalCommandRecords: state.health.totalCommandRecords,
      latestCommandId: this.getLatestRecord()?.commandId ?? null,
      registeredWorkerCount: state.health.registeredWorkerCount,
      neverExecuteWorkerLogic: true,
      neverReplaceWorkforceOrchestrator: true,
      neverReplaceWorkers: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createExecutiveCommandCenter(
  bootstrap: EmpireBootstrapContext,
  options?: ExecutiveCommandCenterOptions,
) {
  return new ExecutiveCommandCenter(bootstrap, options);
}

export function resetExecutiveCommandCenterForTesting() {
  resetPeccLogsForTesting();
  resetCommandSequenceForTesting();
}
