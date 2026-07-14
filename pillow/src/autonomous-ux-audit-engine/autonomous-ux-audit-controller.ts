/** T5-02 — Autonomous UX Audit orchestration controller. */

import { appendAuditLog } from "./audit-logging.js";
import { AutonomousUxAuditManager } from "./autonomous-ux-audit-manager.js";
import type { AutonomousUxAuditConfiguration } from "./configuration.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type {
  AutonomousUxAuditEngineBundle,
  AutonomousUxAuditInput,
  AutonomousUxAuditPerformanceStats,
  AutonomousUxAuditRunReport,
  EngineStatus,
  UxIssueCategory,
} from "./types.js";

function countByCategory(
  issues: { category: UxIssueCategory }[],
  categories: UxIssueCategory[],
): number {
  return issues.filter((i) => categories.includes(i.category)).length;
}

export class AutonomousUxAuditController {
  private config: AutonomousUxAuditConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: AutonomousUxAuditRunReport | null = null;
  private readonly manager = new AutonomousUxAuditManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private continuousAuditActive = false;
  private auditTimer: ReturnType<typeof setInterval> | null = null;
  private readonly performance: AutonomousUxAuditPerformanceStats = {
    totalAudits: 0,
    successfulAudits: 0,
    failedAudits: 0,
    totalIssuesDetected: 0,
    layoutIssuesDetected: 0,
    componentIssuesDetected: 0,
    navigationIssuesDetected: 0,
    workflowIssuesDetected: 0,
    accessibilityIssuesDetected: 0,
    consistencyIssuesDetected: 0,
    stateIssuesDetected: 0,
    averageAuditDurationMs: 0,
    peakAuditDurationMs: 0,
    skippedCycles: 0,
  };

  constructor(
    private readonly engines: AutonomousUxAuditEngineBundle,
    config: AutonomousUxAuditConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendAuditLog({
      event: "autonomous_ux_audit_initialized",
      level: "info",
      details: "Autonomous UX Audit engine ready (audit-only)",
    });
    if (this.config.continuousAuditEnabled && this.config.enabled) {
      this.startContinuousAudit();
    }
  }

  stop(): void {
    this.stopContinuousAudit();
    this.status = "stopped";
    appendAuditLog({
      event: "autonomous_ux_audit_stop",
      level: "info",
      details: "Autonomous UX Audit stopped",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  isContinuousAuditActive(): boolean {
    return this.continuousAuditActive;
  }

  getConfiguration(): AutonomousUxAuditConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: AutonomousUxAuditConfiguration): void {
    const wasActive = this.continuousAuditActive;
    if (wasActive) this.stopContinuousAudit();
    this.config = config;
    if (config.continuousAuditEnabled && config.enabled) {
      this.startContinuousAudit();
    }
  }

  getLatestReport(): AutonomousUxAuditRunReport | null {
    return this.latestReport;
  }

  getLatestAudit() {
    return this.manager.getLatestAudit();
  }

  getActiveSession() {
    return this.manager.getSessionManager().getActiveSession();
  }

  getPerformance(): AutonomousUxAuditPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getManager(): AutonomousUxAuditManager {
    return this.manager;
  }

  startContinuousAudit(): void {
    if (!this.config.enabled || this.auditTimer) return;
    this.continuousAuditActive = true;
    this.status = "auditing";
    this.manager.getSessionManager().setContinuousAuditActive(true);
    appendAuditLog({
      event: "autonomous_ux_audit_start",
      level: "info",
      details: "Proactive quality assurance activated",
    });
    this.auditTimer = setInterval(() => {
      try {
        this.audit({});
      } catch {
        this.performance.skippedCycles += 1;
      }
    }, this.config.auditFrequencyMs);
  }

  stopContinuousAudit(): void {
    if (this.auditTimer) {
      clearInterval(this.auditTimer);
      this.auditTimer = null;
    }
    this.continuousAuditActive = false;
    this.manager.getSessionManager().setContinuousAuditActive(false);
    const session = this.manager.getSessionManager().getActiveSession();
    if (session) {
      this.manager.getSessionManager().endSession(session.auditSessionId);
    }
    appendAuditLog({
      event: "autonomous_ux_audit_end",
      level: "info",
      details: "Proactive quality assurance deactivated",
    });
  }

  audit(input: AutonomousUxAuditInput = {}): AutonomousUxAuditRunReport {
    if (!this.config.enabled) {
      throw new Error("Autonomous UX Audit is disabled by configuration");
    }
    if (!this.config.auditOnlyMode) {
      throw new Error("Autonomous UX Audit must remain audit-only");
    }

    this.status = "detecting_issues";

    try {
      this.status = "recording";
      const report = this.manager.audit({
        auditInput: input,
        config: this.config,
        engines: this.engines,
      });

      this.status = "validating";
      this.latestReport = report;
      this.performance.totalAudits += 1;
      this.performance.totalIssuesDetected += report.audit.detectedUxIssues.length;

      const issues = report.audit.detectedUxIssues;
      this.performance.layoutIssuesDetected += countByCategory(issues, [
        "layout_issue",
        "spacing_issue",
        "alignment_issue",
        "hierarchy_issue",
        "readability_issue",
      ]);
      this.performance.componentIssuesDetected += countByCategory(issues, ["component_issue"]);
      this.performance.navigationIssuesDetected += countByCategory(issues, ["navigation_issue"]);
      this.performance.workflowIssuesDetected += countByCategory(issues, ["workflow_issue"]);
      this.performance.accessibilityIssuesDetected += countByCategory(issues, [
        "accessibility_issue",
        "feedback_issue",
      ]);
      this.performance.consistencyIssuesDetected += countByCategory(issues, [
        "visual_consistency_issue",
      ]);
      this.performance.stateIssuesDetected += countByCategory(issues, [
        "loading_state_issue",
        "empty_state_issue",
        "error_state_issue",
      ]);

      this.performance.peakAuditDurationMs = Math.max(
        this.performance.peakAuditDurationMs,
        report.durationMs,
      );
      this.performance.averageAuditDurationMs = Math.round(
        (this.performance.averageAuditDurationMs * (this.performance.totalAudits - 1) +
          report.durationMs) /
          this.performance.totalAudits,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulAudits += 1;
        this.recoveryManager.recordSuccess();
        this.healthMonitor.recordAudit(true, report.validation.decision);
        this.status = this.continuousAuditActive ? "auditing" : "idle";
      } else {
        this.performance.failedAudits += 1;
        this.recoveryManager.recordFailure("Validation failed", this.config);
        this.healthMonitor.recordAudit(false, report.validation.decision);
        this.status = "failed";
      }

      return report;
    } catch (error) {
      this.status = "failed";
      this.performance.failedAudits += 1;
      const message = error instanceof Error ? error.message : "Audit failed";
      this.recoveryManager.recordFailure(message, this.config);
      throw error;
    }
  }
}
