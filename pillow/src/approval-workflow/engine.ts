import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { MultiProposalGeneratorEngine } from "../multi-proposal-generator/engine.js";
import type { SideBySideComparisonEngine } from "../side-by-side-comparison/engine.js";
import type { ExplainDecisionsEngine } from "../explain-decisions/engine.js";
import type { AutonomousBuilderCertificationEngine } from "../autonomous-builder-certification-engine/engine.js";
import {
  appendApprovalLog,
  getApprovalLogs,
  resetApprovalLogsForTesting,
} from "./approval-logging.js";
import { ApprovalWorkflowController } from "./approval-workflow-controller.js";
import { ApprovalWorkflowManager } from "./approval-workflow-manager.js";
import {
  buildApprovalWorkflowConfiguration,
  type ApprovalWorkflowConfiguration,
} from "./configuration.js";
import { APPROVAL_WORKFLOW_SYSTEM_PATH } from "./paths.js";
import type {
  ApprovalInput,
  ApprovalPresentationInput,
  ApprovalRunReport,
  ApprovalWorkflowCockpitSnapshot,
  ApprovalWorkflowState,
} from "./types.js";

export interface ApprovalWorkflowOptions {
  configuration?: Partial<ApprovalWorkflowConfiguration>;
}

/**
 * Approval Workflow (PILLOW-AW-001 / T4-07).
 * Grand King approval governance for UX proposals.
 * Safety: never approves or applies changes automatically.
 */
export class ApprovalWorkflowEngine {
  private initializedAt: string | null = null;
  private readonly controller: ApprovalWorkflowController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    multiProposalGenerator: MultiProposalGeneratorEngine,
    sideBySideComparison: SideBySideComparisonEngine,
    explainDecisions: ExplainDecisionsEngine,
    autonomousBuilderCertification: AutonomousBuilderCertificationEngine | null,
    options: ApprovalWorkflowOptions = {},
  ) {
    const config = buildApprovalWorkflowConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new ApprovalWorkflowController(
      {
        multiProposalGenerator,
        sideBySideComparison,
        explainDecisions,
        autonomousBuilderCertification,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ApprovalWorkflowState> {
    const doc = await this.reader.readText(APPROVAL_WORKFLOW_SYSTEM_PATH);
    if (!doc?.includes("Approval Workflow")) {
      throw new Error(
        `${APPROVAL_WORKFLOW_SYSTEM_PATH} missing — Approval Workflow requires T4-07 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendApprovalLog({
      event: "approval_workflow_ready",
      level: "info",
      details: "Approval Workflow initialized",
    });
    return this.getState();
  }

  getState(): ApprovalWorkflowState {
    if (!this.initializedAt) {
      throw new Error("Approval Workflow not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      approvalsCompleted: performance.totalApprovals,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
      activeSessions: this.controller.getManager().getActiveSessionCount(),
    });

    return {
      engineVersion: "PILLOW-AW-001",
      missionId: "T4-07",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      latestPresentation: this.controller.getLatestPresentation(),
      health,
      performance,
    };
  }

  present(input: ApprovalPresentationInput = {}): ReturnType<ApprovalWorkflowController["present"]> {
    return this.controller.present(input);
  }

  submitApproval(input: ApprovalInput): ApprovalRunReport {
    return this.controller.submitApproval(input);
  }

  getLatestReport(): ApprovalRunReport | null {
    return this.controller.getLatestReport();
  }

  endSession(sessionId: string): ApprovalWorkflowState {
    this.controller.getManager().endSession(sessionId);
    return this.getState();
  }

  stopApprovalWorkflow(): ApprovalWorkflowState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<ApprovalWorkflowConfiguration>,
  ): ApprovalWorkflowState {
    const next = buildApprovalWorkflowConfiguration(this.bootstrap.repositoryRoot, {
      ...this.controller.getConfiguration(),
      ...overrides,
    });
    this.controller.updateConfiguration(next);
    return this.getState();
  }

  validateForSupervisorSync(): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
  } {
    const state = this.getState();
    const report = state.latestReport;
    const score = report
      ? report.validation.decision === "pass"
        ? 100
        : report.validation.decision === "partial"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Engine status: ${state.status}`,
        `Approvals completed: ${state.performance.totalApprovals}`,
        report
          ? `Last run: ${report.validation.decision} · ${report.approval.approvalDecision}`
          : "No approvals yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ApprovalWorkflowCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      activeSessions: state.health.activeSessions,
      totalApprovals: state.performance.totalApprovals,
      approvedCount: state.performance.approvedCount,
      blockedActions: state.performance.blockedActions,
      dispatchedActions: state.performance.dispatchedActions,
      confidenceScore: Math.round((report?.approval.confidenceScore ?? 0) * 100),
      recentLogs: getApprovalLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createApprovalWorkflow(
  bootstrap: EmpireBootstrapContext,
  multiProposalGenerator: MultiProposalGeneratorEngine,
  sideBySideComparison: SideBySideComparisonEngine,
  explainDecisions: ExplainDecisionsEngine,
  autonomousBuilderCertification: AutonomousBuilderCertificationEngine | null,
  options?: ApprovalWorkflowOptions,
): ApprovalWorkflowEngine {
  return new ApprovalWorkflowEngine(
    bootstrap,
    multiProposalGenerator,
    sideBySideComparison,
    explainDecisions,
    autonomousBuilderCertification,
    options,
  );
}

export function resetApprovalWorkflowForTesting(): void {
  resetApprovalLogsForTesting();
  new ApprovalWorkflowManager().resetForTesting();
}
