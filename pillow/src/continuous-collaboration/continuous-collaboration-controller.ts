/** T4-09 — Continuous Collaboration orchestration controller. */

import { appendCollaborationLog } from "./collaboration-logging.js";
import {
  ContinuousCollaborationManager,
} from "./continuous-collaboration-manager.js";
import type { ContinuousCollaborationEngineBundle } from "./types.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ContinuousCollaborationConfiguration } from "./configuration.js";
import type {
  ContinuousCollaborationInput,
  ContinuousCollaborationPerformanceStats,
  ContinuousCollaborationRunReport,
  EngineStatus,
} from "./types.js";

export class ContinuousCollaborationController {
  private config: ContinuousCollaborationConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ContinuousCollaborationRunReport | null = null;
  private readonly manager = new ContinuousCollaborationManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ContinuousCollaborationPerformanceStats = {
    totalSynchronizations: 0,
    successfulSynchronizations: 0,
    failedSynchronizations: 0,
    sessionsRestored: 0,
    discussionsUpdated: 0,
    proposalsTracked: 0,
    approvalsTracked: 0,
    preferencesApplied: 0,
    averageSynchronizationDurationMs: 0,
    peakSynchronizationDurationMs: 0,
  };

  constructor(
    private readonly engines: ContinuousCollaborationEngineBundle,
    config: ContinuousCollaborationConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendCollaborationLog({
      event: "continuous_collaboration_initialized",
      level: "info",
      details: "Continuous Collaboration started",
    });
    try {
      void this.engines.preferenceLearning?.getState();
      void this.engines.approvalWorkflow?.getState();
    } catch {
      appendCollaborationLog({
        event: "partial_collaboration_input",
        level: "warn",
        details: "Upstream engine state unavailable at init",
      });
    }
  }

  stop(): void {
    this.status = "stopped";
    appendCollaborationLog({
      event: "continuous_collaboration_stop",
      level: "info",
      details: "Continuous Collaboration stopped",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ContinuousCollaborationConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ContinuousCollaborationConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ContinuousCollaborationRunReport | null {
    return this.latestReport;
  }

  getActiveSession() {
    return this.manager.getActiveSession();
  }

  getPerformance(): ContinuousCollaborationPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getManager(): ContinuousCollaborationManager {
    return this.manager;
  }

  synchronize(input: ContinuousCollaborationInput = {}): ContinuousCollaborationRunReport {
    if (!this.config.enabled) {
      throw new Error("Continuous Collaboration is disabled by configuration");
    }

    this.status = "loading";

    try {
      this.status = "synchronizing";
      const report = this.manager.synchronize({
        collaborationInput: input,
        config: this.config,
        engines: this.engines,
      });

      this.status = "tracking";
      this.status = "applying_preferences";
      this.status = "validating";
      this.latestReport = report;

      this.performance.totalSynchronizations += 1;
      this.performance.discussionsUpdated += report.session.activeDiscussionTopics.length;
      this.performance.proposalsTracked += report.session.pendingProposalIds.length;
      this.performance.approvalsTracked += report.session.pendingApprovalIds.length;
      this.performance.preferencesApplied +=
        report.session.appliedCollaborationPreferences.length;
      if (report.session.sessionStatus === "restored") {
        this.performance.sessionsRestored += 1;
      }
      this.performance.peakSynchronizationDurationMs = Math.max(
        this.performance.peakSynchronizationDurationMs,
        report.durationMs,
      );
      this.performance.averageSynchronizationDurationMs = Math.round(
        (this.performance.averageSynchronizationDurationMs *
          (this.performance.totalSynchronizations - 1) +
          report.durationMs) /
          this.performance.totalSynchronizations,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulSynchronizations += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedSynchronizations += 1;
        const shouldRecover = this.recoveryManager.recordFailure(
          `Synchronization decision: ${report.validation.decision}`,
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "idle";
        }
      }

      this.healthMonitor.recordSynchronization(success, report.validation.decision);
      this.status = "idle";
      return report;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Continuous collaboration failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.failedSynchronizations += 1;
      appendCollaborationLog({
        event: "collaboration_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }
}
