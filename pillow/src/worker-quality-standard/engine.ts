import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildWorkerQualityStandardConfiguration,
  type WorkerQualityStandardConfiguration,
} from "./configuration.js";
import { WORKER_QUALITY_STANDARD_SYSTEM_PATH } from "./paths.js";
import { resetQualitySequenceForTesting } from "./quality-store.js";
import { WorkerQualityStandardController } from "./worker-quality-standard-controller.js";
import { WorkerQualityStandardCore } from "./worker-quality-standard-core.js";
import { resetWqsLogsForTesting } from "./wqs-logging.js";
import type {
  WorkerQualityStandardCockpitSnapshot,
  WorkerQualityStandardInput,
  WorkerQualityStandardState,
} from "./types.js";

export interface WorkerQualityStandardOptions {
  configuration?: Partial<WorkerQualityStandardConfiguration>;
}

/** Authoritative Q0-27 Worker Quality Standard — validate quality only. */
export class WorkerQualityStandard {
  private initializedAt: string | null = null;
  private readonly controller: WorkerQualityStandardController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: WorkerQualityStandardOptions = {},
  ) {
    this.controller = new WorkerQualityStandardController(
      new WorkerQualityStandardCore(),
      buildWorkerQualityStandardConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      WORKER_QUALITY_STANDARD_SYSTEM_PATH,
    );
    if (!doc?.includes("Worker Quality Standard")) {
      throw new Error(
        `${WORKER_QUALITY_STANDARD_SYSTEM_PATH} missing — Q0-27 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): WorkerQualityStandardState {
    if (!this.initializedAt) {
      throw new Error("Worker Quality Standard not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-WQS-001",
      missionId: "Q0-27",
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
        totalQualityRecords: this.getRecords().length,
        compliantCount: engineRecord?.compliantCount ?? 0,
        nonCompliantCount: engineRecord?.nonCompliantCount ?? 0,
        averageConfidence: engineRecord?.averageConfidence ?? 0,
        lastDecision: engineRecord?.lastDecision ?? null,
        notes: [
          "Validate only: does not execute worker tasks, replace worker implementations, replace Peer Review Runtime, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectWorkerQualityStandard(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  validateWorkerQuality(input: WorkerQualityStandardInput = {}) {
    return this.controller.validateWorker(input);
  }

  scoreConfidence(input: WorkerQualityStandardInput = {}) {
    return this.controller.scoreConfidence(input);
  }

  recordEvidence(input: WorkerQualityStandardInput = {}) {
    return this.controller.recordEvidence(input);
  }

  recordAssumptions(input: WorkerQualityStandardInput = {}) {
    return this.controller.recordAssumptions(input);
  }

  reportLimitations(input: WorkerQualityStandardInput = {}) {
    return this.controller.reportLimitations(input);
  }

  checkGovernance(input: WorkerQualityStandardInput = {}) {
    return this.controller.checkGovernance(input);
  }

  listQualityRecords() {
    return this.controller.list();
  }

  validateWorkerQualityStandard(input: WorkerQualityStandardInput = {}) {
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
        `Quality records: ${state.health.totalQualityRecords}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WorkerQualityStandardCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-27",
      status: state.status,
      healthStatus: state.health.status,
      totalQualityRecords: state.health.totalQualityRecords,
      latestQualityRecordId: this.getLatestRecord()?.qualityRecordId ?? null,
      compliantCount: state.health.compliantCount,
      neverExecuteWorkerTasks: true,
      neverReplaceWorkerImplementations: true,
      neverReplacePeerReviewRuntime: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createWorkerQualityStandard(
  bootstrap: EmpireBootstrapContext,
  options?: WorkerQualityStandardOptions,
) {
  return new WorkerQualityStandard(bootstrap, options);
}

export function resetWorkerQualityStandardForTesting() {
  resetWqsLogsForTesting();
  resetQualitySequenceForTesting();
}
