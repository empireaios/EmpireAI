/** T2-06 — Accessibility Intelligence controller. */

import type { UiStateMapperEngine } from "../ui-state-mapper/engine.js";
import type { ComponentRecognitionEngine } from "../component-recognition-engine/engine.js";
import type { LayoutUnderstandingEngine } from "../layout-understanding-engine/engine.js";
import type { NavigationMappingEngine } from "../navigation-mapping-engine/engine.js";
import type { InteractionTrackingEngine } from "../interaction-tracking-engine/engine.js";
import type { ContextAwarenessEngine } from "../context-awareness-engine/engine.js";
import type { WorkflowOptimizationEngine } from "../workflow-optimization-engine/engine.js";
import { appendAccessibilityLog } from "./accessibility-intelligence-logging.js";
import { AccessibilityIntelligenceManager } from "./accessibility-intelligence-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { AccessibilityIntelligenceConfiguration } from "./configuration.js";
import type {
  AccessibilityPerformanceStats,
  AccessibilityReviewReport,
  ReviewStatus,
} from "./types.js";

export type AccessibilityEngineBundle = {
  uiStateMapper: UiStateMapperEngine;
  componentRecognition: ComponentRecognitionEngine;
  layoutUnderstanding: LayoutUnderstandingEngine;
  navigationMapping: NavigationMappingEngine;
  interactionTracking: InteractionTrackingEngine;
  contextAwareness: ContextAwarenessEngine;
  workflowOptimization: WorkflowOptimizationEngine;
};

export class IntelligenceController {
  private config: AccessibilityIntelligenceConfiguration;
  private status: ReviewStatus = "idle";
  private latestReport: AccessibilityReviewReport | null = null;
  private readonly manager = new AccessibilityIntelligenceManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: AccessibilityPerformanceStats = {
    totalReviews: 0,
    successfulReviews: 0,
    failedReviews: 0,
    totalFindingsDetected: 0,
    totalStrengthsIdentified: 0,
    averageReviewDurationMs: 0,
    peakReviewDurationMs: 0,
  };

  constructor(
    private readonly engines: AccessibilityEngineBundle,
    config: AccessibilityIntelligenceConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendAccessibilityLog({
      event: "accessibility_intelligence_start",
      level: "info",
      details: "Accessibility Intelligence engine started",
    });
  }

  stop(): void {
    this.status = "stopped";
    appendAccessibilityLog({
      event: "accessibility_intelligence_stop",
      level: "info",
      details: "Accessibility Intelligence engine stopped",
    });
  }

  getStatus(): ReviewStatus {
    return this.status;
  }

  getConfiguration(): AccessibilityIntelligenceConfiguration {
    return this.config;
  }

  updateConfiguration(config: AccessibilityIntelligenceConfiguration): void {
    this.config = config;
  }

  getLatestReport(): AccessibilityReviewReport | null {
    return this.latestReport;
  }

  getLatestRecord() {
    return this.manager.getLatestRecord();
  }

  getPerformance(): AccessibilityPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  runReview(): AccessibilityReviewReport {
    const started = Date.now();
    this.status = "reviewing";

    try {
      const uiState = this.engines.uiStateMapper.getLatestState();
      const recognition = this.engines.componentRecognition.getLatestResult();
      const layout = this.engines.layoutUnderstanding.getLatestLayout();
      const navigation = this.engines.navigationMapping.getLatestGraph();
      const events = this.engines.interactionTracking.getRecentEvents(50);
      const context = this.engines.contextAwareness.getLatestContext();
      const workflowOptimization = this.engines.workflowOptimization.getLatestRecord();

      if (!uiState && !recognition) {
        appendAccessibilityLog({
          event: "partial_review",
          level: "warn",
          details: "No UI state or component data — partial accessibility review",
        });
      }

      const report = this.manager.runReview({
        config: this.config,
        uiState,
        recognition,
        layout,
        navigation,
        events,
        context,
        workflowOptimization,
      });

      this.latestReport = report;
      this.status = "idle";
      this.performance.totalReviews += 1;
      this.performance.totalFindingsDetected = report.record.accessibilityFindings.length;
      this.performance.totalStrengthsIdentified = report.record.accessibilityStrengths.length;
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
      appendAccessibilityLog({
        event: "accessibility_review_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }
}
