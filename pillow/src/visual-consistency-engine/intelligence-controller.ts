/** T2-07 — Visual Consistency controller. */

import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import type { ExecutiveStyleLearningEngine } from "../executive-style-learning-engine/engine.js";
import type { LayoutEvaluationEngine } from "../layout-evaluation-engine/engine.js";
import type { AccessibilityIntelligenceEngine } from "../accessibility-intelligence-engine/engine.js";
import { appendConsistencyLog } from "./visual-consistency-logging.js";
import { VisualConsistencyManager } from "./visual-consistency-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { VisualConsistencyConfiguration } from "./configuration.js";
import type {
  ConsistencyPerformanceStats,
  ConsistencyReviewReport,
  ReviewStatus,
} from "./types.js";

export type VisualConsistencyEngineBundle = {
  uiStateMapper: UiStateMapperEngine;
  componentRecognition: ComponentRecognitionEngine;
  layoutUnderstanding: LayoutUnderstandingEngine;
  navigationMapping: NavigationMappingEngine;
  designSystemIntelligence: DesignSystemIntelligenceEngine;
  executiveStyleLearning: ExecutiveStyleLearningEngine;
  layoutEvaluation: LayoutEvaluationEngine;
  accessibilityIntelligence: AccessibilityIntelligenceEngine;
};

export class IntelligenceController {
  private config: VisualConsistencyConfiguration;
  private status: ReviewStatus = "idle";
  private latestReport: ConsistencyReviewReport | null = null;
  private readonly manager = new VisualConsistencyManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ConsistencyPerformanceStats = {
    totalReviews: 0,
    successfulReviews: 0,
    failedReviews: 0,
    totalFindingsDetected: 0,
    totalStrengthsIdentified: 0,
    averageReviewDurationMs: 0,
    peakReviewDurationMs: 0,
  };

  constructor(
    private readonly engines: VisualConsistencyEngineBundle,
    config: VisualConsistencyConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendConsistencyLog({
      event: "visual_consistency_start",
      level: "info",
      details: "Visual Consistency engine started",
    });
  }

  stop(): void {
    this.status = "stopped";
    appendConsistencyLog({
      event: "visual_consistency_stop",
      level: "info",
      details: "Visual Consistency engine stopped",
    });
  }

  getStatus(): ReviewStatus {
    return this.status;
  }

  getConfiguration(): VisualConsistencyConfiguration {
    return this.config;
  }

  updateConfiguration(config: VisualConsistencyConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ConsistencyReviewReport | null {
    return this.latestReport;
  }

  getLatestRecord() {
    return this.manager.getLatestRecord();
  }

  getPerformance(): ConsistencyPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  runReview(): ConsistencyReviewReport {
    const started = Date.now();
    this.status = "reviewing";

    try {
      const uiState = this.engines.uiStateMapper.getLatestState();
      const recognition = this.engines.componentRecognition.getLatestResult();
      const layout = this.engines.layoutUnderstanding.getLatestLayout();
      const navigation = this.engines.navigationMapping.getLatestGraph();
      const designSystem = this.engines.designSystemIntelligence.getLatestModel();
      const executiveStyle = this.engines.executiveStyleLearning.getLatestModel();
      const layoutEvaluation = this.engines.layoutEvaluation.getLatestModel();
      const accessibilityReview = this.engines.accessibilityIntelligence.getLatestRecord();

      if (!uiState && !recognition) {
        appendConsistencyLog({
          event: "partial_review",
          level: "warn",
          details: "No UI state or component data — partial consistency review",
        });
      }

      const report = this.manager.runReview({
        config: this.config,
        uiState,
        recognition,
        layout,
        navigation,
        designSystem,
        executiveStyle,
        layoutEvaluation,
        accessibilityReview,
      });

      this.latestReport = report;
      this.status = "idle";
      this.performance.totalReviews += 1;
      this.performance.totalFindingsDetected = report.record.consistencyFindings.length;
      this.performance.totalStrengthsIdentified = report.record.consistencyStrengths.length;
      this.performance.peakReviewDurationMs = Math.max(
        this.performance.peakReviewDurationMs,
        report.durationMs,
      );
      this.performance.averageReviewDurationMs = Math.round(
        (this.performance.averageReviewDurationMs * (this.performance.totalReviews - 1) +
          report.durationMs) /
          this.performance.totalReviews,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulReviews += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedReviews += 1;
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

      this.healthMonitor.recordReview(
        Date.now() - started,
        success,
        report.validation.decision,
      );

      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Review failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.totalReviews += 1;
      this.performance.failedReviews += 1;
      appendConsistencyLog({
        event: "consistency_review_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }
}
