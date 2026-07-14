/** T2-04 — Layout Evaluation controller. */

import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import type { ExecutiveStyleLearningEngine } from "../executive-style-learning-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { UxRuleEngine } from "../ux-rule-engine/engine.js";
import { appendLayoutEvaluationLog } from "./layout-evaluation-logging.js";
import { LayoutEvaluationManager } from "./layout-evaluation-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { LayoutEvaluationConfiguration } from "./configuration.js";
import type {
  EvaluationPerformanceStats,
  EvaluationStatus,
  LayoutEvaluationReport,
} from "./types.js";

export type EvaluationEngineBundle = {
  layoutUnderstanding: LayoutUnderstandingEngine;
  componentRecognition: ComponentRecognitionEngine;
  navigationMapping: NavigationMappingEngine;
  designSystemIntelligence: DesignSystemIntelligenceEngine;
  executiveStyleLearning: ExecutiveStyleLearningEngine;
  uxRuleEngine: UxRuleEngine;
};

export class EvaluationController {
  private config: LayoutEvaluationConfiguration;
  private status: EvaluationStatus = "idle";
  private latestReport: LayoutEvaluationReport | null = null;
  private readonly manager = new LayoutEvaluationManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: EvaluationPerformanceStats = {
    totalEvaluations: 0,
    successfulEvaluations: 0,
    failedEvaluations: 0,
    totalStrengthsIdentified: 0,
    totalWeaknessesIdentified: 0,
    totalRuleViolations: 0,
    averageEvaluationDurationMs: 0,
    peakEvaluationDurationMs: 0,
  };

  constructor(
    private readonly engines: EvaluationEngineBundle,
    config: LayoutEvaluationConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendLayoutEvaluationLog({
      event: "layout_evaluation_start",
      level: "info",
      details: "Layout Evaluation engine started",
    });
  }

  stop(): void {
    this.status = "stopped";
    appendLayoutEvaluationLog({
      event: "layout_evaluation_stop",
      level: "info",
      details: "Layout Evaluation engine stopped",
    });
  }

  getStatus(): EvaluationStatus {
    return this.status;
  }

  getConfiguration(): LayoutEvaluationConfiguration {
    return this.config;
  }

  updateConfiguration(config: LayoutEvaluationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): LayoutEvaluationReport | null {
    return this.latestReport;
  }

  getLatestModel() {
    return this.manager.getLatestModel();
  }

  getPerformance(): EvaluationPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getManager(): LayoutEvaluationManager {
    return this.manager;
  }

  runEvaluation(): LayoutEvaluationReport {
    const started = Date.now();
    this.status = "evaluating";

    try {
      const layout = this.engines.layoutUnderstanding.getLatestLayout();
      const recognition = this.engines.componentRecognition.getLatestResult();
      const navigation = this.engines.navigationMapping.getLatestGraph();
      const designSystem = this.engines.designSystemIntelligence.getLatestModel();
      const executiveStyle = this.engines.executiveStyleLearning.getLatestModel();

      if (!layout) {
        appendLayoutEvaluationLog({
          event: "partial_evaluation",
          level: "warn",
          details: "No layout data — partial evaluation with available upstream models",
        });
      }

      const report = this.manager.runEvaluation({
        config: this.config,
        layout,
        recognition,
        navigation,
        designSystem,
        executiveStyle,
        uxRuleEngine: this.engines.uxRuleEngine,
      });

      this.latestReport = report;
      this.status = "idle";
      this.performance.totalEvaluations += 1;
      this.performance.totalStrengthsIdentified = report.model.layoutStrengths.length;
      this.performance.totalWeaknessesIdentified = report.model.layoutWeaknesses.length;
      this.performance.totalRuleViolations = report.model.ruleViolations.length;
      this.performance.peakEvaluationDurationMs = Math.max(
        this.performance.peakEvaluationDurationMs,
        report.durationMs,
      );
      this.performance.averageEvaluationDurationMs = Math.round(
        (this.performance.averageEvaluationDurationMs * (this.performance.totalEvaluations - 1) +
          report.durationMs) /
          this.performance.totalEvaluations,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulEvaluations += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedEvaluations += 1;
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

      this.healthMonitor.recordEvaluation(
        Date.now() - started,
        success,
        report.validation.decision,
      );

      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Evaluation failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.totalEvaluations += 1;
      this.performance.failedEvaluations += 1;
      appendLayoutEvaluationLog({
        event: "evaluation_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }
}
