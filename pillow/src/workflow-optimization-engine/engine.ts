import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { ContextAwarenessEngine } from "../context-awareness-engine/engine.js";
import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import type { LayoutEvaluationEngine } from "../layout-evaluation-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import {
  appendWorkflowOptimizationLog,
  getWorkflowOptimizationLogs,
  resetWorkflowOptimizationLogsForTesting,
} from "./workflow-optimization-logging.js";
import { OptimizationController } from "./optimization-controller.js";
import {
  buildWorkflowOptimizationConfiguration,
  type WorkflowOptimizationConfiguration,
} from "./configuration.js";
import { WORKFLOW_OPTIMIZATION_SYSTEM_PATH } from "./paths.js";
import type {
  WorkflowOptimizationCockpitSnapshot,
  WorkflowOptimizationRecord,
  WorkflowOptimizationReport,
  WorkflowOptimizationState,
} from "./types.js";

export interface WorkflowOptimizationEngineOptions {
  configuration?: Partial<WorkflowOptimizationConfiguration>;
}

/**
 * Workflow Optimization Engine (PILLOW-WFO-001 / T2-05).
 * Analyzes EmpireAI workflows and identifies usability improvements.
 */
export class WorkflowOptimizationEngine {
  private initializedAt: string | null = null;
  private readonly controller: OptimizationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    contextAwareness: ContextAwarenessEngine,
    interactionTracking: InteractionTrackingEngine,
    navigationMapping: NavigationMappingEngine,
    layoutEvaluation: LayoutEvaluationEngine,
    options: WorkflowOptimizationEngineOptions = {},
  ) {
    const config = buildWorkflowOptimizationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new OptimizationController(
      { contextAwareness, interactionTracking, navigationMapping, layoutEvaluation },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<WorkflowOptimizationState> {
    const doc = await this.reader.readText(WORKFLOW_OPTIMIZATION_SYSTEM_PATH);
    if (!doc?.includes("Workflow Optimization")) {
      throw new Error(
        `${WORKFLOW_OPTIMIZATION_SYSTEM_PATH} missing — Workflow Optimization requires T2-05 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendWorkflowOptimizationLog({
      event: "workflow_optimization_initialized",
      level: "info",
      details: "Workflow Optimization Engine initialized",
    });
    return this.getState();
  }

  getState(): WorkflowOptimizationState {
    if (!this.initializedAt) {
      throw new Error(
        "Workflow Optimization Engine not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      analysesCompleted: performance.totalAnalyses,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-WFO-001",
      missionId: "T2-05",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestRecord: this.controller.getLatestRecord(),
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  runAnalysis(): WorkflowOptimizationReport {
    return this.controller.runAnalysis();
  }

  getLatestReport(): WorkflowOptimizationReport | null {
    return this.controller.getLatestReport();
  }

  getLatestRecord(): WorkflowOptimizationRecord | null {
    return this.controller.getLatestRecord();
  }

  stopWorkflowOptimization(): WorkflowOptimizationState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<WorkflowOptimizationConfiguration>,
  ): WorkflowOptimizationState {
    const next = buildWorkflowOptimizationConfiguration(this.bootstrap.repositoryRoot, {
      ...this.controller.getConfiguration(),
      ...overrides,
    });
    this.controller.updateConfiguration(next);
    return this.getState();
  }

  validateForSupervisorSync(): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
  } {
    const state = this.getState();
    const report = state.latestReport;
    const score = report
      ? report.validation.decision === "pass"
        ? 100
        : report.validation.decision === "partial"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Optimization status: ${state.status}`,
        `Analyses completed: ${state.performance.totalAnalyses}`,
        report
          ? `Last analysis: ${report.validation.decision} · ${report.record.detectedFrictionPoints.length} friction points`
          : "No analysis run yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): WorkflowOptimizationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const record = state.latestRecord;

    return {
      optimizationStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      frictionPointsCount: record?.detectedFrictionPoints.length ?? 0,
      strengthsCount: record?.detectedWorkflowStrengths.length ?? 0,
      workflowName: record?.currentWorkflowName ?? null,
      confidenceScore: record?.confidenceScore ?? 0,
      totalAnalyses: state.performance.totalAnalyses,
      recentLogs: getWorkflowOptimizationLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createWorkflowOptimizationEngine(
  bootstrap: EmpireBootstrapContext,
  contextAwareness: ContextAwarenessEngine,
  interactionTracking: InteractionTrackingEngine,
  navigationMapping: NavigationMappingEngine,
  layoutEvaluation: LayoutEvaluationEngine,
  options?: WorkflowOptimizationEngineOptions,
): WorkflowOptimizationEngine {
  return new WorkflowOptimizationEngine(
    bootstrap,
    contextAwareness,
    interactionTracking,
    navigationMapping,
    layoutEvaluation,
    options,
  );
}

export function resetWorkflowOptimizationForTesting(): void {
  resetWorkflowOptimizationLogsForTesting();
}
