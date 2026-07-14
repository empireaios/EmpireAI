/** T5-04 — Productivity Intelligence orchestration controller. */

import { appendProductivityLog } from "./productivity-logging.js";
import type { ProductivityIntelligenceConfiguration } from "./configuration.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type {
  EngineStatus,
  ProductivityCategory,
  ProductivityLearningRunReport,
  ProductivityIntelligenceEngineBundle,
  ProductivityIntelligenceInput,
  ProductivityPerformanceStats,
} from "./types.js";
import { ProductivityIntelligenceManager } from "./productivity-intelligence-manager.js";

function countCategory(
  records: { productivityObservations: ProductivityCategory[] }[],
  categories: ProductivityCategory[],
): number {
  return records.filter((r) =>
    r.productivityObservations.some((c) => categories.includes(c)),
  ).length;
}

export class ProductivityIntelligenceController {
  private config: ProductivityIntelligenceConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ProductivityLearningRunReport | null = null;
  private readonly manager = new ProductivityIntelligenceManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private continuousLearningActive = false;
  private learningTimer: ReturnType<typeof setInterval> | null = null;
  private readonly performance: ProductivityPerformanceStats = {
    totalLearningCycles: 0,
    successfulLearningCycles: 0,
    failedLearningCycles: 0,
    totalPatternsLearned: 0,
    workflowPatterns: 0,
    navigationPatterns: 0,
    bottleneckPatterns: 0,
    repetitionPatterns: 0,
    trendPatterns: 0,
    duplicatesSkipped: 0,
    averageLearningDurationMs: 0,
    peakLearningDurationMs: 0,
    skippedCycles: 0,
  };

  constructor(
    private readonly engines: ProductivityIntelligenceEngineBundle,
    config: ProductivityIntelligenceConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendProductivityLog({
      event: "productivity_intelligence_initialized",
      level: "info",
      details: "Productivity Intelligence engine ready (learn-only)",
    });
    if (this.config.continuousLearningEnabled && this.config.enabled) {
      this.startContinuousLearning();
    }
  }

  stop(): void {
    this.stopContinuousLearning();
    this.status = "stopped";
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  isContinuousLearningActive(): boolean {
    return this.continuousLearningActive;
  }

  getConfiguration(): ProductivityIntelligenceConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ProductivityIntelligenceConfiguration): void {
    const wasActive = this.continuousLearningActive;
    if (wasActive) this.stopContinuousLearning();
    this.config = config;
    if (config.continuousLearningEnabled && config.enabled) {
      this.startContinuousLearning();
    }
  }

  getLatestReport(): ProductivityLearningRunReport | null {
    return this.latestReport;
  }

  getTopPatterns() {
    return this.manager.getTopPatterns();
  }

  getActiveSession() {
    return this.manager.getSessionManager().getActiveSession();
  }

  getPerformance(): ProductivityPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getManager(): ProductivityIntelligenceManager {
    return this.manager;
  }

  startContinuousLearning(): void {
    if (!this.config.enabled || this.learningTimer) return;
    this.continuousLearningActive = true;
    this.status = "learning";
    this.manager.getSessionManager().setContinuousLearningActive(true);
    appendProductivityLog({
      event: "productivity_learning_start",
      level: "info",
      details: "Continuous workflow intelligence activated",
    });
    this.learningTimer = setInterval(() => {
      try {
        this.learn({});
      } catch {
        this.performance.skippedCycles += 1;
      }
    }, this.config.learningFrequencyMs);
  }

  stopContinuousLearning(): void {
    if (this.learningTimer) {
      clearInterval(this.learningTimer);
      this.learningTimer = null;
    }
    this.continuousLearningActive = false;
    this.manager.getSessionManager().setContinuousLearningActive(false);
    const session = this.manager.getSessionManager().getActiveSession();
    if (session) {
      this.manager.getSessionManager().endSession(session.learningSessionId);
    }
    appendProductivityLog({
      event: "productivity_learning_end",
      level: "info",
      details: "Continuous workflow intelligence deactivated",
    });
  }

  learn(input: ProductivityIntelligenceInput = {}): ProductivityLearningRunReport {
    if (!this.config.enabled) {
      throw new Error("Productivity Intelligence is disabled by configuration");
    }
    if (!this.config.learnOnlyMode) {
      throw new Error("Productivity Intelligence must remain learn-only");
    }

    this.status = "detecting_patterns";

    try {
      this.status = "analyzing_trends";
      const report = this.manager.learn({
        learningInput: input,
        config: this.config,
        engines: this.engines,
      });

      this.status = "validating";
      this.latestReport = report;
      this.performance.totalLearningCycles += 1;
      this.performance.totalPatternsLearned += report.records.length;

      const records = report.records;
      this.performance.workflowPatterns += countCategory(records, [
        "workflow_pattern",
        "task_completion_flow",
      ]);
      this.performance.navigationPatterns += countCategory(records, [
        "navigation_pattern",
        "screen_transition_pattern",
      ]);
      this.performance.bottleneckPatterns += countCategory(records, [
        "workflow_bottleneck",
        "time_utilization",
      ]);
      this.performance.repetitionPatterns += countCategory(records, ["task_repetition"]);
      this.performance.trendPatterns += countCategory(records, [
        "productivity_trend",
        "context_switching",
      ]);

      this.performance.peakLearningDurationMs = Math.max(
        this.performance.peakLearningDurationMs,
        report.durationMs,
      );
      this.performance.averageLearningDurationMs = Math.round(
        (this.performance.averageLearningDurationMs *
          (this.performance.totalLearningCycles - 1) +
          report.durationMs) /
          this.performance.totalLearningCycles,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulLearningCycles += 1;
        this.recoveryManager.recordSuccess();
        this.healthMonitor.recordLearning(true, report.validation.decision);
        this.status = this.continuousLearningActive ? "learning" : "idle";
      } else {
        this.performance.failedLearningCycles += 1;
        this.recoveryManager.recordFailure("Validation failed", this.config);
        this.healthMonitor.recordLearning(false, report.validation.decision);
        this.status = "failed";
      }

      return report;
    } catch (error) {
      this.status = "failed";
      this.performance.failedLearningCycles += 1;
      const message = error instanceof Error ? error.message : "Learning failed";
      this.recoveryManager.recordFailure(message, this.config);
      throw error;
    }
  }
}
