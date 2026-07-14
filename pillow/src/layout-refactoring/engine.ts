import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import type { ExecutiveStyleLearningEngine } from "../executive-style-learning-engine/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { FrontendBuilder } from "../frontend-builder/engine.js";
import type { ComponentGenerator } from "../component-generator/engine.js";
import type { UxScoringEngine } from "../ux-scoring-engine/engine.js";
import type { LayoutEvaluationEngine } from "../layout-evaluation-engine/engine.js";
import type { WorkflowOptimizationEngine } from "../workflow-optimization-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import {
  appendRefactoringLog,
  getRefactoringLogs,
  resetRefactoringLogsForTesting,
} from "./refactoring-logging.js";
import { RefactoringController } from "./refactoring-controller.js";
import {
  buildLayoutRefactoringConfiguration,
  type LayoutRefactoringConfiguration,
} from "./configuration.js";
import { LAYOUT_REFACTORING_SYSTEM_PATH } from "./paths.js";
import type {
  LayoutRefactoringCockpitSnapshot,
  LayoutRefactoringState,
  LayoutRefactoringReport,
} from "./types.js";

export interface LayoutRefactoringOptions {
  configuration?: Partial<LayoutRefactoringConfiguration>;
}

/**
 * Layout Refactoring Engine (PILLOW-LR-001 / T3-03).
 * Rebuilds EmpireAI layouts from approved UX intelligence and generated components.
 */
export class LayoutRefactoringEngine {
  private initializedAt: string | null = null;
  private readonly controller: RefactoringController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    recommendationEngine: RecommendationEngine,
    uxScoring: UxScoringEngine,
    layoutEvaluation: LayoutEvaluationEngine,
    workflowOptimization: WorkflowOptimizationEngine,
    designSystemIntelligence: DesignSystemIntelligenceEngine,
    executiveStyleLearning: ExecutiveStyleLearningEngine,
    frontendBuilder: FrontendBuilder,
    componentGenerator: ComponentGenerator,
    layoutUnderstanding: LayoutUnderstandingEngine,
    options: LayoutRefactoringOptions = {},
  ) {
    const config = buildLayoutRefactoringConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new RefactoringController(
      {
        recommendationEngine,
        uxScoring,
        layoutEvaluation,
        workflowOptimization,
        designSystemIntelligence,
        executiveStyleLearning,
        frontendBuilder,
        componentGenerator,
        layoutUnderstanding,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<LayoutRefactoringState> {
    const doc = await this.reader.readText(LAYOUT_REFACTORING_SYSTEM_PATH);
    if (!doc?.includes("Layout Refactoring")) {
      throw new Error(
        `${LAYOUT_REFACTORING_SYSTEM_PATH} missing — Layout Refactoring requires T3-03 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendRefactoringLog({
      event: "layout_refactoring_ready",
      level: "info",
      details: "Layout Refactoring initialized",
    });
    return this.getState();
  }

  getState(): LayoutRefactoringState {
    if (!this.initializedAt) {
      throw new Error("Layout Refactoring not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      refactoringsCompleted: performance.totalRefactorings,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-LR-001",
      missionId: "T3-03",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  refactorLayouts(): LayoutRefactoringReport {
    return this.controller.refactorLayouts();
  }

  getLatestReport(): LayoutRefactoringReport | null {
    return this.controller.getLatestReport();
  }

  stopLayoutRefactoring(): LayoutRefactoringState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<LayoutRefactoringConfiguration>,
  ): LayoutRefactoringState {
    const next = buildLayoutRefactoringConfiguration(this.bootstrap.repositoryRoot, {
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
        `Engine status: ${state.status}`,
        `Refactorings completed: ${state.performance.totalRefactorings}`,
        report
          ? `Last refactoring: ${report.validation.decision} · ${report.records.length} layouts`
          : "No layouts refactored yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): LayoutRefactoringCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      layoutsCount: report?.records.length ?? 0,
      validatedCount:
        report?.records.filter((r) => r.refactoringStatus === "validated").length ?? 0,
      blockedCount: report?.records.filter((r) => r.refactoringStatus === "blocked").length ?? 0,
      confidenceScore:
        report && report.records.length > 0
          ? Math.round(
              report.records.reduce((s, r) => s + r.confidenceScore, 0) / report.records.length,
            )
          : 0,
      totalRefactorings: state.performance.totalRefactorings,
      recentLogs: getRefactoringLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createLayoutRefactoringEngine(
  bootstrap: EmpireBootstrapContext,
  recommendationEngine: RecommendationEngine,
  uxScoring: UxScoringEngine,
  layoutEvaluation: LayoutEvaluationEngine,
  workflowOptimization: WorkflowOptimizationEngine,
  designSystemIntelligence: DesignSystemIntelligenceEngine,
  executiveStyleLearning: ExecutiveStyleLearningEngine,
  frontendBuilder: FrontendBuilder,
  componentGenerator: ComponentGenerator,
  layoutUnderstanding: LayoutUnderstandingEngine,
  options?: LayoutRefactoringOptions,
): LayoutRefactoringEngine {
  return new LayoutRefactoringEngine(
    bootstrap,
    recommendationEngine,
    uxScoring,
    layoutEvaluation,
    workflowOptimization,
    designSystemIntelligence,
    executiveStyleLearning,
    frontendBuilder,
    componentGenerator,
    layoutUnderstanding,
    options,
  );
}

export function resetLayoutRefactoringForTesting(): void {
  resetRefactoringLogsForTesting();
}
