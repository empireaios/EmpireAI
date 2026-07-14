/** T2-05 — Workflow Optimization controller. */

import type { ContextAwarenessEngine } from "../context-awareness-engine/engine.js";
import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import type { LayoutEvaluationEngine } from "../layout-evaluation-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import { appendWorkflowOptimizationLog } from "./workflow-optimization-logging.js";
import { WorkflowOptimizationManager } from "./workflow-optimization-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { WorkflowOptimizationConfiguration } from "./configuration.js";
import type {
  OptimizationPerformanceStats,
  OptimizationStatus,
  WorkflowOptimizationReport,
} from "./types.js";

export type OptimizationEngineBundle = {
  contextAwareness: ContextAwarenessEngine;
  interactionTracking: InteractionTrackingEngine;
  navigationMapping: NavigationMappingEngine;
  layoutEvaluation: LayoutEvaluationEngine;
};

export class OptimizationController {
  private config: WorkflowOptimizationConfiguration;
  private status: OptimizationStatus = "idle";
  private latestReport: WorkflowOptimizationReport | null = null;
  private readonly manager = new WorkflowOptimizationManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: OptimizationPerformanceStats = {
    totalAnalyses: 0,
    successfulAnalyses: 0,
    failedAnalyses: 0,
    totalFrictionPoints: 0,
    totalStrengthsIdentified: 0,
    averageAnalysisDurationMs: 0,
    peakAnalysisDurationMs: 0,
  };

  constructor(
    private readonly engines: OptimizationEngineBundle,
    config: WorkflowOptimizationConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendWorkflowOptimizationLog({
      event: "workflow_optimization_engine_start",
      level: "info",
      details: "Workflow Optimization engine started",
    });
  }

  stop(): void {
    this.status = "stopped";
    appendWorkflowOptimizationLog({
      event: "workflow_optimization_engine_stop",
      level: "info",
      details: "Workflow Optimization engine stopped",
    });
  }

  getStatus(): OptimizationStatus {
    return this.status;
  }

  getConfiguration(): WorkflowOptimizationConfiguration {
    return this.config;
  }

  updateConfiguration(config: WorkflowOptimizationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): WorkflowOptimizationReport | null {
    return this.latestReport;
  }

  getLatestRecord() {
    return this.manager.getLatestRecord();
  }

  getPerformance(): OptimizationPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  runAnalysis(): WorkflowOptimizationReport {
    const started = Date.now();
    this.status = "analyzing";

    try {
      const context = this.engines.contextAwareness.getLatestContext();
      const events = this.engines.interactionTracking.getRecentEvents(50);
      const navigation = this.engines.navigationMapping.getLatestGraph();
      const layoutEvaluation = this.engines.layoutEvaluation.getLatestModel();

      if (!context) {
        appendWorkflowOptimizationLog({
          event: "partial_analysis",
          level: "warn",
          details: "No workflow context — partial optimization analysis",
        });
      }

      const report = this.manager.runAnalysis({
        config: this.config,
        context,
        events,
        navigation,
        layoutEvaluation,
      });

      this.latestReport = report;
      this.status = "idle";
      this.performance.totalAnalyses += 1;
      this.performance.totalFrictionPoints = report.record.detectedFrictionPoints.length;
      this.performance.totalStrengthsIdentified = report.record.detectedWorkflowStrengths.length;
      this.performance.peakAnalysisDurationMs = Math.max(
        this.performance.peakAnalysisDurationMs,
        report.durationMs,
      );
      this.performance.averageAnalysisDurationMs = Math.round(
        (this.performance.averageAnalysisDurationMs * (this.performance.totalAnalyses - 1) +
          report.durationMs) /
          this.performance.totalAnalyses,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulAnalyses += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedAnalyses += 1;
        const shouldRecover = this.recoveryManager.recordFailure(
          `Validation decision: ${report.validation.decision}`,
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.manager.reset();
          this.status = "idle";
        }
      }

      this.healthMonitor.recordAnalysis(
        Date.now() - started,
        success,
        report.validation.decision,
      );

      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.totalAnalyses += 1;
      this.performance.failedAnalyses += 1;
      appendWorkflowOptimizationLog({
        event: "optimization_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }
}
