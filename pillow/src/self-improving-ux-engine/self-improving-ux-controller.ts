/** T5-09 — Self-Improving UX orchestration controller. */

import { appendLearningLog } from "./siux-logging.js";
import type { SelfImprovingUxConfiguration } from "./configuration.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type {
  EngineStatus,
  LearningCategory,
  LearningPerformanceStats,
  SelfImprovingUxEngineBundle,
  SelfImprovingUxInput,
  SelfImprovingUxRunReport,
  UxLearningRecord,
} from "./types.js";
import { SelfImprovingUxManager } from "./self-improving-ux-manager.js";

function countCategory(
  records: { learningCategory: LearningCategory }[],
  categories: LearningCategory[],
): number {
  return records.filter((r) => categories.includes(r.learningCategory)).length;
}

export class SelfImprovingUxController {
  private config: SelfImprovingUxConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: SelfImprovingUxRunReport | null = null;
  private readonly manager = new SelfImprovingUxManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private continuousLearningActive = false;
  private learningTimer: ReturnType<typeof setInterval> | null = null;
  private readonly performance: LearningPerformanceStats = {
    totalLearningCycles: 0,
    successfulLearningCycles: 0,
    failedLearningCycles: 0,
    totalInsights: 0,
    redesignLearnings: 0,
    approvalLearnings: 0,
    deploymentLearnings: 0,
    recommendationImprovements: 0,
    prioritizationImprovements: 0,
    knowledgeBaseUpdates: 0,
    duplicatesSkipped: 0,
    averageLearningDurationMs: 0,
    peakLearningDurationMs: 0,
    skippedCycles: 0,
  };

  constructor(
    private readonly engines: SelfImprovingUxEngineBundle,
    config: SelfImprovingUxConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendLearningLog({
      event: "self_improving_ux_initialized",
      level: "info",
      details: "Self-Improving UX engine ready (learn-only)",
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

  getConfiguration(): SelfImprovingUxConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: SelfImprovingUxConfiguration): void {
    const wasActive = this.continuousLearningActive;
    if (wasActive) this.stopContinuousLearning();
    this.config = config;
    if (config.continuousLearningEnabled && config.enabled) {
      this.startContinuousLearning();
    }
  }

  getLatestReport(): SelfImprovingUxRunReport | null {
    return this.latestReport;
  }

  getTopLearnings(): UxLearningRecord[] {
    return this.manager.getTopLearnings();
  }

  getActiveSession() {
    return this.manager.getSessionManager().getActiveSession();
  }

  getKnowledgeBase() {
    return this.manager.getKnowledgeBase().getEntries();
  }

  getPerformance(): LearningPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getManager(): SelfImprovingUxManager {
    return this.manager;
  }

  startContinuousLearning(): void {
    if (!this.config.enabled || this.learningTimer) return;
    this.continuousLearningActive = true;
    this.status = "learning";
    this.manager.getSessionManager().setContinuousLearningActive(true);
    appendLearningLog({
      event: "ux_learning_start",
      level: "info",
      details: "Continuous UX learning activated",
    });
    this.learningTimer = setInterval(() => {
      try {
        this.learnUx({});
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
    appendLearningLog({
      event: "ux_learning_end",
      level: "info",
      details: "Continuous UX learning deactivated",
    });
  }

  learnUx(input: SelfImprovingUxInput = {}): SelfImprovingUxRunReport {
    if (!this.config.enabled) {
      throw new Error("Self-Improving UX Engine is disabled by configuration");
    }
    if (!this.config.learnOnlyMode) {
      throw new Error("Self-Improving UX Engine must remain learn-only");
    }

    this.status = "analyzing_outcomes";

    try {
      this.status = "improving_recommendations";
      const report = this.manager.learnUx({
        learningInput: input,
        config: this.config,
        engines: this.engines,
      });

      this.status = "validating";
      this.latestReport = report;
      this.performance.totalLearningCycles += 1;
      this.performance.totalInsights += report.records.length;
      this.performance.knowledgeBaseUpdates += report.knowledgeEntries.length;

      const records = report.records;
      this.performance.redesignLearnings += countCategory(records, [
        "redesign_learning",
        "layout_learning",
        "component_learning",
      ]);
      this.performance.approvalLearnings += countCategory(records, [
        "approval_learning",
        "executive_preference_learning",
      ]);
      this.performance.deploymentLearnings += countCategory(records, ["deployment_learning"]);
      this.performance.recommendationImprovements += records.filter(
        (r) => r.recommendationImprovement.length > 0,
      ).length;
      this.performance.prioritizationImprovements += records.filter(
        (r) => r.prioritizationImprovement.length > 0,
      ).length;

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
