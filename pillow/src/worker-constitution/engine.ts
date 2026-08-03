import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildWorkerConstitutionConfiguration,
  type WorkerConstitutionConfiguration,
} from "./configuration.js";
import { resetInheritanceSequenceForTesting } from "./constitution-store.js";
import { WORKER_CONSTITUTION_SYSTEM_PATH } from "./paths.js";
import { WorkerConstitutionController } from "./worker-constitution-controller.js";
import { WorkerConstitutionCore } from "./worker-constitution-core.js";
import { resetWctLogsForTesting } from "./wct-logging.js";
import type {
  WorkerConstitutionCockpitSnapshot,
  WorkerConstitutionInput,
  WorkerConstitutionState,
} from "./types.js";

export interface WorkerConstitutionOptions {
  configuration?: Partial<WorkerConstitutionConfiguration>;
}

/** Authoritative Q1-01 Worker Constitution — define and govern only. */
export class WorkerConstitution {
  private initializedAt: string | null = null;
  private readonly controller: WorkerConstitutionController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: WorkerConstitutionOptions = {},
  ) {
    this.controller = new WorkerConstitutionController(
      new WorkerConstitutionCore(),
      buildWorkerConstitutionConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      WORKER_CONSTITUTION_SYSTEM_PATH,
    );
    if (!doc?.includes("Worker Constitution")) {
      throw new Error(
        `${WORKER_CONSTITUTION_SYSTEM_PATH} missing — Q1-01 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): WorkerConstitutionState {
    if (!this.initializedAt) {
      throw new Error("Worker Constitution not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-WCT-001",
      missionId: "Q1-01",
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
        constitutionVersion: configuration.constitutionVersion,
        totalInheritanceRecords: this.getRecords().length,
        compliantCount: engineRecord?.compliantCount ?? 0,
        nonCompliantCount: engineRecord?.nonCompliantCount ?? 0,
        lastComplianceDecision: engineRecord?.lastComplianceDecision ?? null,
        notes: [
          "Define only: does not execute worker tasks, replace Worker Quality Standard, replace Governance, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectWorkerConstitution(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  defineConstitution(input: WorkerConstitutionInput = {}) {
    return this.controller.defineConstitution(input);
  }

  inheritWorker(input: WorkerConstitutionInput = {}) {
    return this.controller.inheritWorker(input);
  }

  validateCompliance(input: WorkerConstitutionInput = {}) {
    return this.controller.validateCompliance(input);
  }

  produceConstitution(input: WorkerConstitutionInput = {}) {
    return this.controller.produceConstitution(input);
  }

  listInheritanceRecords() {
    return this.controller.list();
  }

  validateWorkerConstitution(input: WorkerConstitutionInput = {}) {
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

  getConstitution() {
    return this.controller.getManager().getConstitution();
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
        `Constitution: ${state.health.constitutionVersion}`,
        `Inheritance records: ${state.health.totalInheritanceRecords}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WorkerConstitutionCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q1-01",
      status: state.status,
      healthStatus: state.health.status,
      constitutionVersion: state.health.constitutionVersion,
      totalInheritanceRecords: state.health.totalInheritanceRecords,
      latestInheritanceId: this.getLatestRecord()?.inheritanceId ?? null,
      neverExecuteWorkerTasks: true,
      neverReplaceWorkerQualityStandard: true,
      neverReplaceGovernance: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createWorkerConstitution(
  bootstrap: EmpireBootstrapContext,
  options?: WorkerConstitutionOptions,
) {
  return new WorkerConstitution(bootstrap, options);
}

export function resetWorkerConstitutionForTesting() {
  resetWctLogsForTesting();
  resetInheritanceSequenceForTesting();
}
