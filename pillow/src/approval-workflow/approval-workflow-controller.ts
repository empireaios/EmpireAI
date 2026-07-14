/** T4-07 — Approval Workflow orchestration controller. */

import { appendApprovalLog } from "./approval-logging.js";
import {
  ApprovalWorkflowManager,
  type ApprovalWorkflowEngineBundle,
} from "./approval-workflow-manager.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryManager } from "./recovery-manager.js";
import type { ApprovalWorkflowConfiguration } from "./configuration.js";
import type {
  ApprovalInput,
  ApprovalPerformanceStats,
  ApprovalPresentation,
  ApprovalPresentationInput,
  ApprovalRunReport,
  EngineStatus,
} from "./types.js";

export class ApprovalWorkflowController {
  private config: ApprovalWorkflowConfiguration;
  private status: EngineStatus = "idle";
  private latestReport: ApprovalRunReport | null = null;
  private latestPresentation: ApprovalPresentation | null = null;
  private readonly manager = new ApprovalWorkflowManager();
  private readonly healthMonitor = new HealthMonitor();
  private readonly recoveryManager = new RecoveryManager();
  private readonly performance: ApprovalPerformanceStats = {
    totalApprovals: 0,
    successfulApprovals: 0,
    failedApprovals: 0,
    approvedCount: 0,
    rejectedCount: 0,
    deferredCount: 0,
    changesRequestedCount: 0,
    blockedActions: 0,
    dispatchedActions: 0,
    averageApprovalDurationMs: 0,
    peakApprovalDurationMs: 0,
  };

  constructor(
    private readonly engines: ApprovalWorkflowEngineBundle,
    config: ApprovalWorkflowConfiguration,
  ) {
    this.config = config;
  }

  initialize(): void {
    appendApprovalLog({
      event: "approval_workflow_initialized",
      level: "info",
      details: "Approval Workflow started",
    });
    try {
      void this.engines.multiProposalGenerator?.getState();
      void this.engines.explainDecisions?.getState();
    } catch {
      appendApprovalLog({
        event: "partial_approval_input",
        level: "warn",
        details: "Upstream engine state unavailable at init",
      });
    }
  }

  stop(): void {
    this.status = "stopped";
    appendApprovalLog({
      event: "approval_workflow_stop",
      level: "info",
      details: "Approval Workflow stopped",
    });
  }

  getStatus(): EngineStatus {
    return this.status;
  }

  getConfiguration(): ApprovalWorkflowConfiguration {
    return { ...this.config };
  }

  updateConfiguration(config: ApprovalWorkflowConfiguration): void {
    this.config = config;
  }

  getLatestReport(): ApprovalRunReport | null {
    return this.latestReport;
  }

  getLatestPresentation(): ApprovalPresentation | null {
    return this.latestPresentation ?? this.manager.getLatestPresentation();
  }

  getPerformance(): ApprovalPerformanceStats {
    return { ...this.performance };
  }

  getHealthMonitor(): HealthMonitor {
    return this.healthMonitor;
  }

  getRecoveryManager(): RecoveryManager {
    return this.recoveryManager;
  }

  getManager(): ApprovalWorkflowManager {
    return this.manager;
  }

  present(input: ApprovalPresentationInput): ApprovalPresentation {
    if (!this.config.enabled) {
      throw new Error("Approval Workflow is disabled by configuration");
    }
    this.status = "presenting";
    const presentation = this.manager.present({
      presentationInput: input,
      config: this.config,
      engines: this.engines,
    });
    this.latestPresentation = presentation;
    this.status = "idle";
    return presentation;
  }

  submitApproval(input: ApprovalInput): ApprovalRunReport {
    if (!this.config.enabled) {
      throw new Error("Approval Workflow is disabled by configuration");
    }
    if (!this.config.supportedApprovalDecisions.includes(input.approvalDecision)) {
      throw new Error(`Unsupported approval decision: ${input.approvalDecision}`);
    }

    this.status = "loading";

    try {
      this.status = "deciding";
      const report = this.manager.submitApproval({
        approvalInput: input,
        config: this.config,
        engines: this.engines,
      });

      this.status = "gatekeeping";
      this.status = "dispatching";
      this.status = "validating";
      this.latestReport = report;
      this.latestPresentation = report.presentation;

      this.performance.totalApprovals += 1;
      this.updateDecisionCounts(input.approvalDecision);
      if (report.gatekeeperResult.blocked) this.performance.blockedActions += 1;
      if (report.dispatchResult.dispatched) this.performance.dispatchedActions += 1;
      this.performance.peakApprovalDurationMs = Math.max(
        this.performance.peakApprovalDurationMs,
        report.durationMs,
      );
      this.performance.averageApprovalDurationMs = Math.round(
        (this.performance.averageApprovalDurationMs * (this.performance.totalApprovals - 1) +
          report.durationMs) /
          this.performance.totalApprovals,
      );

      const success =
        report.validation.decision === "pass" || report.validation.decision === "partial";
      if (success) {
        this.performance.successfulApprovals += 1;
        this.recoveryManager.recordSuccess();
      } else {
        this.performance.failedApprovals += 1;
        const shouldRecover = this.recoveryManager.recordFailure(
          `Approval decision: ${report.validation.decision}`,
          this.config,
        );
        if (shouldRecover) {
          this.status = "recovering";
          this.status = "idle";
        }
      }

      this.healthMonitor.recordApproval(success, report.validation.decision);
      this.status = "idle";
      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Approval failed";
      this.status = "failed";
      this.recoveryManager.recordFailure(message, this.config);
      this.performance.failedApprovals += 1;
      appendApprovalLog({
        event: "approval_workflow_failure",
        level: "error",
        details: message,
      });
      throw error;
    }
  }

  private updateDecisionCounts(decision: ApprovalInput["approvalDecision"]): void {
    switch (decision) {
      case "approve":
        this.performance.approvedCount += 1;
        break;
      case "reject":
        this.performance.rejectedCount += 1;
        break;
      case "defer":
        this.performance.deferredCount += 1;
        break;
      case "request_changes":
        this.performance.changesRequestedCount += 1;
        break;
      default:
        break;
    }
  }
}
