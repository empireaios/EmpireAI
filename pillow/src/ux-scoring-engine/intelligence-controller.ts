/** T2-08 — UX Scoring controller. */

import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { UxRuleEngine } from "../ux-rule-engine/engine.js";
import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import type { ExecutiveStyleLearningEngine } from "../executive-style-learning-engine/engine.js";
import type { LayoutEvaluationEngine } from "../layout-evaluation-engine/engine.js";
import type { WorkflowOptimizationEngine } from "../workflow-optimization-engine/engine.js";
import type { AccessibilityIntelligenceEngine } from "../accessibility-intelligence-engine/engine.js";
import type { VisualConsistencyEngine } from "../visual-consistency-engine/engine.js";
import { appendScoringLog } from "./ux-scoring-logging.js";
import { UxScoringManager } from "./ux-scoring-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { UxScoringConfiguration } from "./configuration.js";
import type { UxScoringPerformanceStats, UxScoringReport, ScoringStatus } from "./types.js";

export type UxScoringEngineBundle = {
  uiStateMapper: UiStateMapperEngine;
  navigationMapping: NavigationMappingEngine;
  uxRuleEngine: UxRuleEngine;
  designSystemIntelligence: DesignSystemIntelligenceEngine;
  executiveStyleLearning: ExecutiveStyleLearningEngine;
  layoutEvaluation: LayoutEvaluationEngine;
  workflowOptimization: WorkflowOptimizationEngine;
  accessibilityIntelligence: AccessibilityIntelligenceEngine;
  visualConsistency: VisualConsistencyEngine;
};

export class IntelligenceController {
  private config: UxScoringConfiguration;
  private status: ScoringStatus = "idle";
  private latestReport: UxScoringReport | null = null;
  private readonly manager = new UxScoringManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: UxScoringPerformanceStats = {
    totalScorings: 0,
    successfulScorings: 0,
    failedScorings: 0,
    averageOverallScore: 0,
    averageScoringDurationMs: 0,
    peakScoringDurationMs: 0,
  };

  constructor(
    private readonly engines: UxScoringEngineBundle,
    config: UxScoringConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendScoringLog({
      event: "ux_scoring_engine_start",
      level: "info",
      details: "UX Scoring engine started",
    });
  }

  stop(): void {
    this.status = "stopped";
    appendScoringLog({
      event: "ux_scoring_engine_stop",
      level: "info",
      details: "UX Scoring engine stopped",
    });
  }

  getStatus(): ScoringStatus {
    return this.status;
  }

  getConfiguration(): UxScoringConfiguration {
    return this.config;
  }

  updateConfiguration(config: UxScoringConfiguration): void {
    this.config = config;
  }

  getLatestReport(): UxScoringReport | null {
    return this.latestReport;
  }

  getLatestRecord() {
    return this.manager.getLatestRecord();
  }

  getPerformance(): UxScoringPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  runScoring(): UxScoringReport {
    const started = Date.now();
    this.status = "scoring";

    try {
      const uiState = this.engines.uiStateMapper.getLatestState();
      const navigation = this.engines.navigationMapping.getLatestGraph();
      const uxRules = this.engines.uxRuleEngine.getLatestReport();
      const designSystem = this.engines.designSystemIntelligence.getLatestModel();
      const executiveStyle = this.engines.executiveStyleLearning.getLatestModel();
      const layoutEvaluation = this.engines.layoutEvaluation.getLatestModel();
      const workflowOptimization = this.engines.workflowOptimization.getLatestRecord();
      const accessibility = this.engines.accessibilityIntelligence.getLatestRecord();
      const consistency = this.engines.visualConsistency.getLatestRecord();

      if (!uxRules && !layoutEvaluation && !accessibility && !consistency) {
        appendScoringLog({
          event: "partial_scoring",
          level: "warn",
          details: "Limited upstream UX intelligence — partial scoring",
        });
      }

      const report = this.manager.runScoring({
        config: this.config,
        uiState,
        navigation,
        uxRules,
        designSystem,
        executiveStyle,
        layoutEvaluation,
        workflowOptimization,
        accessibility,
        consistency,
      });

      this.latestReport = report;
      this.status = "idle";
      this.performance.totalScorings += 1;
      this.performance.averageOverallScore = Math.round(
        (this.performance.averageOverallScore * (this.performance.totalScorings - 1) +
          report.record.overallUxScore) /
          this.performance.totalScorings,
      );
      this.performance.peakScoringDurationMs = Math.max(
        this.performance.peakScoringDurationMs,
        report.durationMs,
      );
      this.performance.averageScoringDurationMs = Math.round(
        (this.performance.averageScoringDurationMs * (this.performance.totalScorings - 1) +
          report.durationMs) /
          this.performance.totalScorings,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulScorings += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedScorings += 1;
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

      this.healthMonitor.recordScoring(
        Date.now() - started,
        success,
        report.validation.decision,
      );

      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Scoring failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.totalScorings += 1;
      this.performance.failedScorings += 1;
      appendScoringLog({
        event: "ux_scoring_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }
}
