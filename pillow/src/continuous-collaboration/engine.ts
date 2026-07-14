import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { NaturalUxConversationEngine } from "../natural-ux-conversation/engine.js";
import type { VoiceUxCommandsEngine } from "../voice-ux-commands/engine.js";
import type { ScreenAnnotationEngine } from "../screen-annotation/engine.js";
import type { MultiProposalGeneratorEngine } from "../multi-proposal-generator/engine.js";
import type { SideBySideComparisonEngine } from "../side-by-side-comparison/engine.js";
import type { ExplainDecisionsEngine } from "../explain-decisions/engine.js";
import type { ApprovalWorkflowEngine } from "../approval-workflow/engine.js";
import type { PreferenceLearningEngine } from "../preference-learning/engine.js";
import {
  appendCollaborationLog,
  getCollaborationLogs,
  resetCollaborationLogsForTesting,
} from "./collaboration-logging.js";
import { ContinuousCollaborationController } from "./continuous-collaboration-controller.js";
import { ContinuousCollaborationManager } from "./continuous-collaboration-manager.js";
import {
  buildContinuousCollaborationConfiguration,
  type ContinuousCollaborationConfiguration,
} from "./configuration.js";
import { CONTINUOUS_COLLABORATION_SYSTEM_PATH } from "./paths.js";
import type {
  ContinuousCollaborationInput,
  ContinuousCollaborationRunReport,
  ContinuousCollaborationCockpitSnapshot,
  ContinuousCollaborationState,
} from "./types.js";

export interface ContinuousCollaborationOptions {
  configuration?: Partial<ContinuousCollaborationConfiguration>;
}

/**
 * Continuous Collaboration (PILLOW-CC-001 / T4-09).
 * Persistent UX partnership for the Grand King.
 * Safety: never approves, executes, or overrides explicit instructions.
 */
export class ContinuousCollaborationEngine {
  private initializedAt: string | null = null;
  private readonly controller: ContinuousCollaborationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    naturalUxConversation: NaturalUxConversationEngine,
    voiceUxCommands: VoiceUxCommandsEngine,
    screenAnnotation: ScreenAnnotationEngine,
    multiProposalGenerator: MultiProposalGeneratorEngine,
    sideBySideComparison: SideBySideComparisonEngine,
    explainDecisions: ExplainDecisionsEngine,
    approvalWorkflow: ApprovalWorkflowEngine,
    preferenceLearning: PreferenceLearningEngine,
    options: ContinuousCollaborationOptions = {},
  ) {
    const config = buildContinuousCollaborationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new ContinuousCollaborationController(
      {
        naturalUxConversation,
        voiceUxCommands,
        screenAnnotation,
        multiProposalGenerator,
        sideBySideComparison,
        explainDecisions,
        approvalWorkflow,
        preferenceLearning,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<ContinuousCollaborationState> {
    const doc = await this.reader.readText(CONTINUOUS_COLLABORATION_SYSTEM_PATH);
    if (!doc?.includes("Continuous Collaboration")) {
      throw new Error(
        `${CONTINUOUS_COLLABORATION_SYSTEM_PATH} missing — Continuous Collaboration requires T4-09 system doc.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    appendCollaborationLog({
      event: "continuous_collaboration_ready",
      level: "info",
      details: "Continuous Collaboration initialized",
    });
    return this.getState();
  }

  getState(): ContinuousCollaborationState {
    if (!this.initializedAt) {
      throw new Error("Continuous Collaboration not initialized. Call initialize() first.");
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      performance,
      sessionsSynchronized: performance.totalSynchronizations,
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
      activeSessions: this.controller.getManager().getActiveSessionCount(),
    });

    return {
      engineVersion: "PILLOW-CC-001",
      missionId: "T4-09",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      activeSession: this.controller.getActiveSession(),
      health,
      performance,
    };
  }

  synchronize(input: ContinuousCollaborationInput = {}): ContinuousCollaborationRunReport {
    return this.controller.synchronize(input);
  }

  getLatestReport(): ContinuousCollaborationRunReport | null {
    return this.controller.getLatestReport();
  }

  getActiveSession() {
    return this.controller.getActiveSession();
  }

  endSession(sessionId: string): ContinuousCollaborationState {
    this.controller.getManager().endSession(sessionId);
    return this.getState();
  }

  stopContinuousCollaboration(): ContinuousCollaborationState {
    this.controller.stop();
    return this.getState();
  }

  updateConfiguration(
    overrides: Partial<ContinuousCollaborationConfiguration>,
  ): ContinuousCollaborationState {
    const next = buildContinuousCollaborationConfiguration(this.bootstrap.repositoryRoot, {
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
        `Synchronizations: ${state.performance.totalSynchronizations}`,
        `Active discussions: ${state.activeSession?.activeDiscussionTopics.length ?? 0}`,
        report
          ? `Last run: ${report.validation.decision} · ${report.session.pendingProposalIds.length} pending proposals`
          : "No synchronization runs yet",
        ...state.health.notes,
      ],
    };
  }

  getCockpitSnapshot(): ContinuousCollaborationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const session = state.activeSession;

    return {
      engineStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.validation.decision ?? state.health.lastValidationDecision,
      activeSessions: state.health.activeSessions,
      totalSynchronizations: state.performance.totalSynchronizations,
      activeDiscussions: session?.activeDiscussionTopics.length ?? 0,
      pendingProposals: session?.pendingProposalIds.length ?? 0,
      pendingApprovals: session?.pendingApprovalIds.length ?? 0,
      confidenceScore: Math.round((session?.confidenceScore ?? 0) * 100),
      recentLogs: getCollaborationLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createContinuousCollaboration(
  bootstrap: EmpireBootstrapContext,
  naturalUxConversation: NaturalUxConversationEngine,
  voiceUxCommands: VoiceUxCommandsEngine,
  screenAnnotation: ScreenAnnotationEngine,
  multiProposalGenerator: MultiProposalGeneratorEngine,
  sideBySideComparison: SideBySideComparisonEngine,
  explainDecisions: ExplainDecisionsEngine,
  approvalWorkflow: ApprovalWorkflowEngine,
  preferenceLearning: PreferenceLearningEngine,
  options?: ContinuousCollaborationOptions,
): ContinuousCollaborationEngine {
  return new ContinuousCollaborationEngine(
    bootstrap,
    naturalUxConversation,
    voiceUxCommands,
    screenAnnotation,
    multiProposalGenerator,
    sideBySideComparison,
    explainDecisions,
    approvalWorkflow,
    preferenceLearning,
    options,
  );
}

export function resetContinuousCollaborationForTesting(): void {
  resetCollaborationLogsForTesting();
  new ContinuousCollaborationManager().resetForTesting();
}
