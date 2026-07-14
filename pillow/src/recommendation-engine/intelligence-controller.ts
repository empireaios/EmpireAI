/** T2-09 — Recommendation Engine controller. */

import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { UxRuleEngine } from "../ux-rule-engine/engine.js";
import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import type { ExecutiveStyleLearningEngine } from "../executive-style-learning-engine/engine.js";
import type { LayoutEvaluationEngine } from "../layout-evaluation-engine/engine.js";
import type { WorkflowOptimizationEngine } from "../workflow-optimization-engine/engine.js";
import type { AccessibilityIntelligenceEngine } from "../accessibility-intelligence-engine/engine.js";
import type { VisualConsistencyEngine } from "../visual-consistency-engine/engine.js";
import type { UxScoringEngine } from "../ux-scoring-engine/engine.js";
import { appendRecommendationLog } from "./recommendation-logging.js";
import { RecommendationEngineManager } from "./recommendation-engine-manager.js";
import { ExecutivePreferenceAlignmentGenerator } from "./executive-preference-alignment-generator.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { RecommendationEngineConfiguration } from "./configuration.js";
import type { RecommendationPerformanceStats, RecommendationReport, EngineStatus } from "./types.js";

export type RecommendationEngineBundle = {
  uiStateMapper: UiStateMapperEngine;
  navigationMapping: NavigationMappingEngine;
  uxRuleEngine: UxRuleEngine;
  designSystemIntelligence: DesignSystemIntelligenceEngine;
  executiveStyleLearning: ExecutiveStyleLearningEngine;
  layoutEvaluation: LayoutEvaluationEngine;
  workflowOptimization: WorkflowOptimizationEngine;
  accessibilityIntelligence: AccessibilityIntelligenceEngine;
  visualConsistency: VisualConsistencyEngine;
  uxScoring: UxScoringEngine;
};

export class IntelligenceController {
  private config: RecommendationEngineConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: RecommendationReport | null = null;
  private readonly manager = new RecommendationEngineManager();
  private readonly executiveGenerator = new ExecutivePreferenceAlignmentGenerator();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: RecommendationPerformanceStats = {
    totalReports: 0,
    successfulReports: 0,
    failedReports: 0,
    totalProposalsGenerated: 0,
    averageProposalsPerReport: 0,
    averageReportDurationMs: 0,
    peakReportDurationMs: 0,
  };

  constructor(
    private readonly engines: RecommendationEngineBundle,
    config: RecommendationEngineConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendRecommendationLog({
      event: "recommendation_engine_initialized",
      level: "info",
      details: "Recommendation Engine started",
    });
  }

  stop(): void {
    this.status = "stopped";
    appendRecommendationLog({
      event: "recommendation_engine_stop",
      level: "info",
      details: "Recommendation Engine stopped",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): RecommendationEngineConfiguration {
    return this.config;
  }

  updateConfiguration(config: RecommendationEngineConfiguration): void {
    this.config = config;
  }

  getLatestReport(): RecommendationReport | null {
    return this.latestReport;
  }

  getLatestRecord() {
    return this.manager.getLatestRecord();
  }

  getPerformance(): RecommendationPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  generateRecommendations(): RecommendationReport {
    const started = Date.now();
    this.status = "generating";

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
      const uxScore = this.engines.uxScoring.getLatestRecord();

      if (!uxScore && !uxRules && !accessibility && !consistency) {
        appendRecommendationLog({
          event: "partial_recommendations",
          level: "warn",
          details: "Limited upstream UX intelligence — partial recommendations",
        });
      }

      const execGaps = this.executiveGenerator.detectGaps(executiveStyle, layoutEvaluation);
      if (execGaps.length > 0) {
        appendRecommendationLog({
          event: "executive_alignment_detection",
          level: "info",
          details: `Found ${execGaps.length} executive preference gaps`,
        });
      }

      const report = this.manager.generateReport({
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
        uxScore,
      });

      this.latestReport = report;
      this.status = "idle";
      this.performance.totalReports += 1;
      this.performance.totalProposalsGenerated += report.record.proposals.length;
      this.performance.averageProposalsPerReport = Math.round(
        this.performance.totalProposalsGenerated / this.performance.totalReports,
      );
      this.performance.peakReportDurationMs = Math.max(
        this.performance.peakReportDurationMs,
        report.durationMs,
      );
      this.performance.averageReportDurationMs = Math.round(
        (this.performance.averageReportDurationMs * (this.performance.totalReports - 1) +
          report.durationMs) /
          this.performance.totalReports,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulReports += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedReports += 1;
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

      this.healthMonitor.recordReport(
        Date.now() - started,
        success,
        report.validation.decision,
      );

      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Recommendation generation failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.totalReports += 1;
      this.performance.failedReports += 1;
      appendRecommendationLog({
        event: "recommendation_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }
}
