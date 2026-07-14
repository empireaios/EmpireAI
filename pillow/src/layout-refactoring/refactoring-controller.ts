/** T3-03 — Layout Refactoring orchestration controller. */

import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import type { ExecutiveStyleLearningEngine } from "../executive-style-learning-engine/engine.js";
import type { RecommendationEngine } from "../recommendation-engine/engine.js";
import type { FrontendBuilder } from "../frontend-builder/engine.js";
import type { ComponentGenerator } from "../component-generator/engine.js";
import type { UxScoringEngine } from "../ux-scoring-engine/engine.js";
import type { LayoutEvaluationEngine } from "../layout-evaluation-engine/engine.js";
import type { WorkflowOptimizationEngine } from "../workflow-optimization-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import { appendRefactoringLog } from "./refactoring-logging.js";
import { LayoutRefactoringManager } from "./layout-refactoring-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { LayoutRefactoringConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  LayoutRefactoringPerformanceStats,
  LayoutRefactoringReport,
} from "./types.js";

export type LayoutRefactoringEngineBundle = {
  recommendationEngine: RecommendationEngine;
  uxScoring: UxScoringEngine;
  layoutEvaluation: LayoutEvaluationEngine;
  workflowOptimization: WorkflowOptimizationEngine;
  designSystemIntelligence: DesignSystemIntelligenceEngine;
  executiveStyleLearning: ExecutiveStyleLearningEngine;
  frontendBuilder: FrontendBuilder;
  componentGenerator: ComponentGenerator;
  layoutUnderstanding: LayoutUnderstandingEngine;
};

export class RefactoringController {
  private config: LayoutRefactoringConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: LayoutRefactoringReport | null = null;
  private readonly manager = new LayoutRefactoringManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: LayoutRefactoringPerformanceStats = {
    totalRefactorings: 0,
    successfulRefactorings: 0,
    failedRefactorings: 0,
    totalLayoutsRefactored: 0,
    averageLayoutsPerRefactoring: 0,
    averageRefactoringDurationMs: 0,
    peakRefactoringDurationMs: 0,
  };

  constructor(
    private readonly engines: LayoutRefactoringEngineBundle,
    config: LayoutRefactoringConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendRefactoringLog({
      event: "layout_refactoring_initialized",
      level: "info",
      details: "Layout Refactoring started",
    });
  }

  stop(): void {
    this.status = "stopped";
    appendRefactoringLog({
      event: "layout_refactoring_stop",
      level: "info",
      details: "Layout Refactoring stopped",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): LayoutRefactoringConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: LayoutRefactoringConfiguration): void {
    this.config = config;
  }

  getLatestReport(): LayoutRefactoringReport | null {
    return this.latestReport;
  }

  getPerformance(): LayoutRefactoringPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  refactorLayouts(): LayoutRefactoringReport {
    const started = Date.now();
    this.status = "refactoring";

    try {
      let recommendations = this.engines.recommendationEngine.getLatestRecord();
      let uxScore = this.engines.uxScoring.getLatestRecord();
      let layoutEvaluation = this.engines.layoutEvaluation.getLatestModel();
      let workflowOptimization = this.engines.workflowOptimization.getLatestRecord();
      let frontendBuild = this.engines.frontendBuilder.getLatestReport();
      let componentGeneration = this.engines.componentGenerator.getLatestReport();

      if (!recommendations) {
        appendRefactoringLog({
          event: "partial_refactoring_input",
          level: "warn",
          details: "No recommendations — attempting generation",
        });
        this.engines.recommendationEngine.generateRecommendations();
        recommendations = this.engines.recommendationEngine.getLatestRecord();
      }

      if (!uxScore) {
        appendRefactoringLog({
          event: "partial_refactoring_input",
          level: "warn",
          details: "No UX score — attempting scoring",
        });
        this.engines.uxScoring.runScoring();
        uxScore = this.engines.uxScoring.getLatestRecord();
      }

      if (!layoutEvaluation) {
        appendRefactoringLog({
          event: "partial_refactoring_input",
          level: "warn",
          details: "No layout evaluation — attempting evaluation",
        });
        this.engines.layoutEvaluation.runEvaluation();
        layoutEvaluation = this.engines.layoutEvaluation.getLatestModel();
      }

      if (!workflowOptimization) {
        appendRefactoringLog({
          event: "partial_refactoring_input",
          level: "warn",
          details: "No workflow optimization — attempting analysis",
        });
        this.engines.workflowOptimization.runAnalysis();
        workflowOptimization = this.engines.workflowOptimization.getLatestRecord();
      }

      if (!frontendBuild) {
        appendRefactoringLog({
          event: "partial_refactoring_input",
          level: "warn",
          details: "No frontend build — attempting build",
        });
        frontendBuild = this.engines.frontendBuilder.generateFrontendCode();
      }

      if (!componentGeneration) {
        appendRefactoringLog({
          event: "partial_refactoring_input",
          level: "warn",
          details: "No component generation — attempting generation",
        });
        componentGeneration = this.engines.componentGenerator.generateComponents();
      }

      const designSystem = this.engines.designSystemIntelligence.getLatestModel();
      const executiveStyle = this.engines.executiveStyleLearning.getLatestModel();
      const layoutModel = this.engines.layoutUnderstanding.getLatestLayout();

      const report = this.manager.generateReport({
        config: this.config,
        recommendations,
        uxScore,
        layoutEvaluation,
        workflowOptimization,
        designSystem,
        executiveStyle,
        frontendBuild,
        componentGeneration,
        layoutModel,
      });

      this.latestReport = report;
      this.status = "idle";
      this.performance.totalRefactorings += 1;
      this.performance.totalLayoutsRefactored += report.records.length;
      this.performance.averageLayoutsPerRefactoring = Math.round(
        this.performance.totalLayoutsRefactored / this.performance.totalRefactorings,
      );
      this.performance.peakRefactoringDurationMs = Math.max(
        this.performance.peakRefactoringDurationMs,
        report.durationMs,
      );
      this.performance.averageRefactoringDurationMs = Math.round(
        (this.performance.averageRefactoringDurationMs *
          (this.performance.totalRefactorings - 1) +
          report.durationMs) /
          this.performance.totalRefactorings,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulRefactorings += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedRefactorings += 1;
        const shouldRecover = this.recoveryManager.recordFailure(
          `Validation decision: ${report.validation.decision}`,
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "idle";
        }
      }

      this.healthMonitor.recordRefactoring(success, report.validation.decision);
      void started;

      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Layout refactoring failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.totalRefactorings += 1;
      this.performance.failedRefactorings += 1;
      appendRefactoringLog({
        event: "refactoring_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }
}
