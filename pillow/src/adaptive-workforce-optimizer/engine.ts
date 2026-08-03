import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildAdaptiveWorkforceOptimizerConfiguration,
  type AdaptiveWorkforceOptimizerConfiguration,
} from "./configuration.js";
import { AdaptiveWorkforceOptimizerController } from "./adaptive-workforce-optimizer-controller.js";
import { AdaptiveWorkforceOptimizerCore } from "./adaptive-workforce-optimizer-core.js";
import { resetAwoLogsForTesting } from "./awo-logging.js";
import { resetOptimizationSequenceForTesting } from "./workforce-optimizer-store.js";
import { ADAPTIVE_WORKFORCE_OPTIMIZER_SYSTEM_PATH } from "./paths.js";
import type {
  AdaptiveWorkforceOptimizerCockpitSnapshot,
  AdaptiveWorkforceOptimizerInput,
  AdaptiveWorkforceOptimizerState,
} from "./types.js";

export interface AdaptiveWorkforceOptimizerOptions {
  configuration?: Partial<AdaptiveWorkforceOptimizerConfiguration>;
}

/** Authoritative Q0-17 Adaptive Workforce Optimizer — analyse/recommend only. */
export class AdaptiveWorkforceOptimizer {
  private initializedAt: string | null = null;
  private readonly controller: AdaptiveWorkforceOptimizerController;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: AdaptiveWorkforceOptimizerOptions = {},
  ) {
    this.controller = new AdaptiveWorkforceOptimizerController(
      new AdaptiveWorkforceOptimizerCore(),
      buildAdaptiveWorkforceOptimizerConfiguration(
        bootstrap.repositoryRoot,
        options.configuration,
      ),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      ADAPTIVE_WORKFORCE_OPTIMIZER_SYSTEM_PATH,
    );
    if (!doc?.includes("Adaptive Workforce Optimizer")) {
      throw new Error(
        `${ADAPTIVE_WORKFORCE_OPTIMIZER_SYSTEM_PATH} missing — Q0-17 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): AdaptiveWorkforceOptimizerState {
    if (!this.initializedAt) {
      throw new Error("Adaptive Workforce Optimizer not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-AWO-001",
      missionId: "Q0-17",
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
        totalOptimizationRecords: this.getRecords().length,
        lastConfidenceScore: engineRecord?.lastConfidenceScore ?? null,
        notes: [
          "Analyse/recommend only: does not execute worker tasks, modify workers automatically, replace Pillow, override Grand King, or perform strategic planning.",
        ],
      },
    };
  }

  connectAdaptiveWorkforceOptimizer(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  analyseWorkerUtilization(input: AdaptiveWorkforceOptimizerInput = {}) {
    return this.controller.analyseUtilization(input);
  }

  analyseWorkforcePerformance(input: AdaptiveWorkforceOptimizerInput = {}) {
    return this.controller.analysePerformance(input);
  }

  analyseRoutingEfficiency(input: AdaptiveWorkforceOptimizerInput = {}) {
    return this.controller.analyseRouting(input);
  }

  analyseCollaborationEffectiveness(input: AdaptiveWorkforceOptimizerInput = {}) {
    return this.controller.analyseCollaboration(input);
  }

  detectBottlenecks(input: AdaptiveWorkforceOptimizerInput = {}) {
    return this.controller.detectBottlenecks(input);
  }

  detectOverloadedWorkers(input: AdaptiveWorkforceOptimizerInput = {}) {
    return this.controller.detectOverloaded(input);
  }

  detectUnderutilizedWorkers(input: AdaptiveWorkforceOptimizerInput = {}) {
    return this.controller.detectUnderutilized(input);
  }

  recommendImprovements(input: AdaptiveWorkforceOptimizerInput = {}) {
    return this.controller.recommend(input);
  }

  listOptimizations() {
    return this.controller.list();
  }

  validateAdaptiveWorkforceOptimizer(input: AdaptiveWorkforceOptimizerInput = {}) {
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
        `Optimization records: ${state.health.totalOptimizationRecords}`,
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): AdaptiveWorkforceOptimizerCockpitSnapshot {
    const state = this.getState();
    return {
      missionId: "Q0-17",
      status: state.status,
      healthStatus: state.health.status,
      totalOptimizationRecords: state.health.totalOptimizationRecords,
      latestOptimizationId: this.getLatestRecord()?.optimizationId ?? null,
      lastConfidenceScore: state.health.lastConfidenceScore,
      neverExecuteWorkerTasks: true,
      neverModifyWorkersAutomatically: true,
      neverReplacePillow: true,
      neverOverrideGrandKing: true,
      neverPerformStrategicPlanning: true,
    };
  }
}

export function createAdaptiveWorkforceOptimizer(
  bootstrap: EmpireBootstrapContext,
  options?: AdaptiveWorkforceOptimizerOptions,
) {
  return new AdaptiveWorkforceOptimizer(bootstrap, options);
}

export function resetAdaptiveWorkforceOptimizerForTesting() {
  resetAwoLogsForTesting();
  resetOptimizationSequenceForTesting();
}
