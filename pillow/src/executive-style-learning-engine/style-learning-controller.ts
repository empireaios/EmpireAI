/** T2-03 — Executive Style Learning controller. */

import type { DesignSystemIntelligenceEngine } from "../design-system-intelligence-engine/engine.js";
import { appendExecutiveStyleLog } from "./executive-style-logging.js";
import { ExecutiveStyleLearningManager } from "./executive-style-learning-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ExecutiveStyleLearningConfiguration } from "./configuration.js";
import type {
  ExecutiveStyleLearningReport,
  LearningPerformanceStats,
  LearningStatus,
  PreferenceLearningEvent,
  PreferenceRecord,
} from "./types.js";

export class StyleLearningController {
  private config: ExecutiveStyleLearningConfiguration;
  private status: LearningStatus = "idle";
  private latestReport: ExecutiveStyleLearningReport | null = null;
  private readonly manager = new ExecutiveStyleLearningManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: LearningPerformanceStats = {
    totalLearningRuns: 0,
    successfulLearningRuns: 0,
    failedLearningRuns: 0,
    totalApprovals: 0,
    totalRejections: 0,
    totalPreferencesLearned: 0,
    averageLearningDurationMs: 0,
    peakLearningDurationMs: 0,
  };

  constructor(
    private readonly designSystemIntelligence: DesignSystemIntelligenceEngine,
    config: ExecutiveStyleLearningConfiguration,
  ) {
    this.config = config;
    this.manager.setConfiguration(config);
  }

  initialize(): void {
    appendExecutiveStyleLog({
      event: "executive_style_learning_start",
      level: "info",
      details: "Executive Style Learning engine started",
    });
  }

  stop(): void {
    this.status = "stopped";
    appendExecutiveStyleLog({
      event: "executive_style_learning_stop",
      level: "info",
      details: "Executive Style Learning engine stopped",
    });
  }

  getStatus(): LearningStatus {
    return this.status;
  }

  getConfiguration(): ExecutiveStyleLearningConfiguration {
    return this.config;
  }

  updateConfiguration(config: ExecutiveStyleLearningConfiguration): void {
    this.config = config;
    this.manager.setConfiguration(config);
  }

  getLatestReport(): ExecutiveStyleLearningReport | null {
    return this.latestReport;
  }

  getLatestModel() {
    return this.manager.getLatestModel();
  }

  getPreferences(): PreferenceRecord[] {
    return this.manager.getPreferences();
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

  getManager(): ExecutiveStyleLearningManager {
    return this.manager;
  }

  preferencesLearned(): number {
    return this.manager.getPreferences().filter((p) => p.currentStatus === "active").length;
  }

  recordApproval(
    input: Omit<PreferenceLearningEvent, "eventType" | "eventId" | "timestamp"> & {
      eventId?: string;
      timestamp?: string;
    },
  ): PreferenceRecord | null {
    const event: PreferenceLearningEvent = {
      eventId: input.eventId ?? `approval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      eventType: "approval",
      category: input.category,
      description: input.description,
      value: input.value,
      referenceId: input.referenceId,
      timestamp: input.timestamp ?? new Date().toISOString(),
    };
    this.manager.setConfiguration(this.config);
    const result = this.manager.recordApproval(event, this.config);
    if (result) this.performance.totalApprovals += 1;
    return result;
  }

  recordRejection(
    input: Omit<PreferenceLearningEvent, "eventType" | "eventId" | "timestamp"> & {
      eventId?: string;
      timestamp?: string;
    },
  ): PreferenceRecord | null {
    const event: PreferenceLearningEvent = {
      eventId: input.eventId ?? `rejection-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      eventType: "rejection",
      category: input.category,
      description: input.description,
      value: input.value,
      referenceId: input.referenceId,
      timestamp: input.timestamp ?? new Date().toISOString(),
    };
    this.manager.setConfiguration(this.config);
    const result = this.manager.recordRejection(event, this.config);
    if (result) this.performance.totalRejections += 1;
    return result;
  }

  runLearning(): ExecutiveStyleLearningReport {
    const started = Date.now();
    this.status = "learning";

    try {
      const designSystem = this.designSystemIntelligence.getLatestModel();
      this.manager.setConfiguration(this.config);
      const report = this.manager.runLearning(designSystem);

      this.latestReport = report;
      this.status = "idle";
      this.performance.totalLearningRuns += 1;
      this.performance.totalPreferencesLearned = report.preferences.filter(
        (p) => p.currentStatus === "active",
      ).length;
      this.performance.peakLearningDurationMs = Math.max(
        this.performance.peakLearningDurationMs,
        report.durationMs,
      );
      this.performance.averageLearningDurationMs = Math.round(
        (this.performance.averageLearningDurationMs * (this.performance.totalLearningRuns - 1) +
          report.durationMs) /
          this.performance.totalLearningRuns,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulLearningRuns += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedLearningRuns += 1;
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

      this.healthMonitor.recordLearning(
        Date.now() - started,
        success,
        report.validation.decision,
      );

      appendExecutiveStyleLog({
        event: "preference_update",
        level: "info",
        details: `Model v${report.model.preferenceModelVersion} · ${report.preferencesUpdated} preferences updated`,
      });

      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Learning failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.totalLearningRuns += 1;
      this.performance.failedLearningRuns += 1;
      appendExecutiveStyleLog({
        event: "learning_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }
}
