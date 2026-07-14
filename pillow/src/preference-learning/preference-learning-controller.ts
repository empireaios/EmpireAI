/** T4-08 — Preference Learning orchestration controller. */

import { appendPreferenceLog } from "./preference-logging.js";
import {
  PreferenceLearningManager,
  type PreferenceLearningEngineBundle,
} from "./preference-learning-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { PreferenceLearningConfiguration } from "./configuration.js";
import type {
  EngineStatus,
  PreferenceLearningInput,
  PreferenceLearningPerformanceStats,
  PreferenceLearningRunReport,
} from "./types.js";

export class PreferenceLearningController {
  private config: PreferenceLearningConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: PreferenceLearningRunReport | null = null;
  private readonly manager = new PreferenceLearningManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: PreferenceLearningPerformanceStats = {
    totalLearningSessions: 0,
    successfulSessions: 0,
    failedSessions: 0,
    totalPreferencesLearned: 0,
    preferencesUpdated: 0,
    approvalSignalsProcessed: 0,
    conversationSignalsProcessed: 0,
    averageLearningDurationMs: 0,
    peakLearningDurationMs: 0,
  };

  constructor(
    private readonly engines: PreferenceLearningEngineBundle,
    config: PreferenceLearningConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendPreferenceLog({
      event: "preference_learning_initialized",
      level: "info",
      details: "Preference Learning started",
    });
    try {
      void this.engines.approvalWorkflow?.getState();
      void this.engines.multiProposalGenerator?.getState();
    } catch {
      appendPreferenceLog({
        event: "partial_learning_input",
        level: "warn",
        details: "Upstream engine state unavailable at init",
      });
    }
  }

  stop(): void {
    this.status = "stopped";
    appendPreferenceLog({
      event: "preference_learning_stop",
      level: "info",
      details: "Preference Learning stopped",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): PreferenceLearningConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: PreferenceLearningConfiguration): void {
    this.config = config;
  }

  getLatestReport(): PreferenceLearningRunReport | null {
    return this.latestReport;
  }

  getLearnedPreferences() {
    return this.manager.getLearnedPreferences();
  }

  getPerformance(): PreferenceLearningPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getManager(): PreferenceLearningManager {
    return this.manager;
  }

  learn(input: PreferenceLearningInput = {}): PreferenceLearningRunReport {
    if (!this.config.enabled) {
      throw new Error("Preference Learning is disabled by configuration");
    }

    this.status = "loading";

    try {
      this.status = "learning";
      const report = this.manager.learn({
        learningInput: input,
        config: this.config,
        engines: this.engines,
      });

      this.status = "analyzing";
      this.status = "versioning";
      this.status = "validating";
      this.latestReport = report;

      this.performance.totalLearningSessions += 1;
      this.performance.totalPreferencesLearned += report.preferences.length;
      this.performance.preferencesUpdated += report.validation.preferencesUpdated;
      this.performance.approvalSignalsProcessed += report.preferences.filter(
        (p) => p.sourceApprovalIds.length > 0,
      ).length;
      this.performance.conversationSignalsProcessed += report.preferences.filter(
        (p) => p.sourceConversationIds.length > 0,
      ).length;
      this.performance.peakLearningDurationMs = Math.max(
        this.performance.peakLearningDurationMs,
        report.durationMs,
      );
      this.performance.averageLearningDurationMs = Math.round(
        (this.performance.averageLearningDurationMs *
          (this.performance.totalLearningSessions - 1) +
          report.durationMs) /
          this.performance.totalLearningSessions,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulSessions += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedSessions += 1;
        const shouldRecover = this.recoveryManager.recordFailure(
          `Learning decision: ${report.validation.decision}`,
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "idle";
        }
      }

      this.healthMonitor.recordLearning(success, report.validation.decision);
      this.status = "idle";
      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Preference learning failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.failedSessions += 1;
      appendPreferenceLog({
        event: "learning_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }
}
