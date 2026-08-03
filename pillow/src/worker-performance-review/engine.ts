import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildWorkerPerformanceReviewConfiguration,
  type WorkerPerformanceReviewConfiguration,
} from "./configuration.js";
import { resetPerformanceSequenceForTesting } from "./performance-builder.js";
import { WORKER_PERFORMANCE_REVIEW_SYSTEM_PATH } from "./paths.js";
import { WorkerPerformanceReviewController } from "./worker-performance-review-controller.js";
import { WorkerPerformanceReviewCore } from "./worker-performance-review-core.js";
import { resetWprLogsForTesting } from "./wpr-logging.js";
import type {
  WorkerPerformanceCockpitSnapshot,
  WorkerPerformanceInput,
  WorkerPerformanceReviewState,
} from "./types.js";

export interface WorkerPerformanceReviewOptions {
  configuration?: Partial<WorkerPerformanceReviewConfiguration>;
}

/** Authoritative Q1-11 Worker Performance Review — evaluate only. */
export class WorkerPerformanceReview {
  private initializedAt: string | null = null;
  private readonly controller: WorkerPerformanceReviewController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: WorkerPerformanceReviewOptions = {},
  ) {
    this.controller = new WorkerPerformanceReviewController(
      new WorkerPerformanceReviewCore(),
      buildWorkerPerformanceReviewConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      WORKER_PERFORMANCE_REVIEW_SYSTEM_PATH,
    );
    if (!doc?.includes("Worker Performance Review")) {
      throw new Error(
        `${WORKER_PERFORMANCE_REVIEW_SYSTEM_PATH} missing — Q1-11 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): WorkerPerformanceReviewState {
    if (!this.initializedAt) {
      throw new Error("Worker Performance Review not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-WPR-001",
      missionId: "Q1-11",
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
        lastPerformanceDecision: engineRecord?.lastPerformanceDecision ?? null,
        notes: [
          "Evaluate only: does not execute worker tasks, replace Worker Monitoring, replace Workforce Certification Monitor, override Pillow, or override Grand King.",
        ],
      },
    };
  }

  connectWorkerPerformanceReview(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  registerPerformanceWorker(input: WorkerPerformanceInput = {}) {
    return this.controller.registerWorker(input);
  }

  reviewWorker(input: WorkerPerformanceInput = {}) {
    return this.controller.reviewWorker(input);
  }

  reviewActiveWorkers(input: WorkerPerformanceInput = {}) {
    return this.controller.reviewActive(input);
  }

  analyzeTrends(input: WorkerPerformanceInput = {}) {
    return this.controller.analyzeTrends(input);
  }

  scoreWorker(input: WorkerPerformanceInput = {}) {
    return this.controller.scoreWorker(input);
  }

  recommendImprovements(input: WorkerPerformanceInput = {}) {
    return this.controller.recommendImprovements(input);
  }

  produceExecutiveReport(input: WorkerPerformanceInput = {}) {
    return this.controller.produceExecutiveReport(input);
  }

  producePerformance(input: WorkerPerformanceInput = {}) {
    return this.controller.produce(input);
  }

  listPerformanceRecords() {
    return this.controller.list();
  }

  validateWorkerPerformanceReview(input: WorkerPerformanceInput = {}) {
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

  getCatalog() {
    return this.controller.getManager().getCatalog();
  }

  getEngineRecord() {
    return this.controller.getManager().getEngineRecord();
  }

  getLatestReviewId() {
    return this.controller.getManager().getLatestReviewId();
  }

  getLatestExecutiveReport() {
    return this.controller.getManager().getLatestExecutiveReport();
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

  getCockpitSnapshot(): WorkerPerformanceCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q1-11",
      status: state.status,
      healthStatus: state.health.status,
      totalWorkers: state.health.totalWorkers,
      totalRecords: state.health.totalRecords,
      latestPerformanceReviewId: this.getLatestReviewId(),
      neverExecuteWorkerTasks: true,
      neverReplaceWorkerMonitoring: true,
      neverReplaceWorkforceCertificationMonitor: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }
}

export function createWorkerPerformanceReview(
  bootstrap: EmpireBootstrapContext,
  options?: WorkerPerformanceReviewOptions,
) {
  return new WorkerPerformanceReview(bootstrap, options);
}

export function resetWorkerPerformanceReviewForTesting() {
  resetWprLogsForTesting();
  resetPerformanceSequenceForTesting();
}
