/** T4-09 — Continuous Collaboration Manager — core synchronization pipeline. */

import type { ContinuousCollaborationConfiguration } from "./configuration.js";
import type {
  ContinuousCollaborationEngineBundle,
  ContinuousCollaborationInput,
  ContinuousCollaborationRunReport,
  CollaborationSessionRecord,
} from "./types.js";
import { CollaborationSessionManager } from "./collaboration-session-manager.js";
import { CollaborationContextManager } from "./collaboration-context-manager.js";
import { ActiveDiscussionTracker } from "./active-discussion-tracker.js";
import { PendingProposalTracker } from "./pending-proposal-tracker.js";
import { PendingApprovalTracker } from "./pending-approval-tracker.js";
import { CollaborationMemoryManager } from "./collaboration-memory-manager.js";
import { PreferenceApplicationEngine } from "./preference-application-engine.js";
import { CollaborationValidator } from "./collaboration-validator.js";
import { CollaborationMetadataGenerator } from "./collaboration-metadata-generator.js";
import { appendCollaborationLog } from "./collaboration-logging.js";
import { COLLABORATION_METADATA_VERSION } from "./paths.js";

export class ContinuousCollaborationManager {
  private readonly sessions = new CollaborationSessionManager();
  private readonly contextManager = new CollaborationContextManager();
  private readonly discussionTracker = new ActiveDiscussionTracker();
  private readonly proposalTracker = new PendingProposalTracker();
  private readonly approvalTracker = new PendingApprovalTracker();
  private readonly memory = new CollaborationMemoryManager();
  private readonly preferenceEngine = new PreferenceApplicationEngine();
  private readonly validator = new CollaborationValidator();
  private readonly metadata = new CollaborationMetadataGenerator();

  synchronize(input: {
    collaborationInput: ContinuousCollaborationInput;
    config: ContinuousCollaborationConfiguration;
    engines: ContinuousCollaborationEngineBundle;
  }): ContinuousCollaborationRunReport {
    const started = Date.now();
    appendCollaborationLog({
      event: "collaboration_session_start",
      level: "info",
      details: "Starting collaboration synchronization",
    });

    let session: CollaborationSessionRecord;
    if (input.collaborationInput.restoreContext && input.config.contextRetentionRulesEnabled) {
      const recalled = this.memory.recall(input.config);
      session = recalled
        ? this.sessions.restoreSession(recalled)
        : this.sessions.startSession(input.collaborationInput.sessionId);
    } else if (this.sessions.getActiveSession()) {
      session = this.sessions.getActiveSession()!;
    } else {
      session = this.sessions.startSession(input.collaborationInput.sessionId);
    }

    const context = this.contextManager.buildContext({
      engines: input.engines,
      config: input.config,
    });

    const approvedProposalIds = this.proposalTracker.getApprovedProposalIds(input.engines);
    const pendingProposals = this.proposalTracker.track({
      engines: input.engines,
      config: input.config,
      approvedProposalIds,
    });

    const pendingApprovals = this.approvalTracker.track({
      engines: input.engines,
      config: input.config,
    });

    const pendingComparisons = this.collectPendingComparisons(input.engines);
    const clarifications = this.collectClarifications(input.engines);
    const discussions = this.discussionTracker.track({
      engines: input.engines,
      config: input.config,
      existing: session.activeDiscussionTopics,
    });

    const appliedPreferences =
      input.collaborationInput.applyPreferences !== false
        ? this.preferenceEngine.apply({ engines: input.engines, config: input.config })
        : session.appliedCollaborationPreferences;

    const approvedDirection = this.approvalTracker.getApprovedDirection(input.engines);

    const updatedSession: CollaborationSessionRecord = {
      ...session,
      timestamp: new Date().toISOString(),
      sessionStatus: "active",
      activeDiscussionTopics: discussions,
      pendingProposalIds: pendingProposals,
      pendingComparisonIds: pendingComparisons,
      pendingApprovalIds: pendingApprovals,
      activeUxGoals: context.activeUxGoals,
      activeDesignDirection: approvedDirection ?? context.activeDesignDirection,
      collaborationContextSummary: context.summary,
      appliedCollaborationPreferences: appliedPreferences,
      outstandingClarificationItems: clarifications,
      confidenceScore: context.confidenceScore,
      metadataVersion: COLLABORATION_METADATA_VERSION,
    };

    this.sessions.updateSession(updatedSession);
    this.memory.remember(updatedSession, input.config);

    const validation = this.validator.validate(updatedSession, input.config, {
      autoApproved: false,
      autoExecuted: false,
    });

    appendCollaborationLog({
      event: "collaboration_session_end",
      level: validation.decision === "pass" ? "info" : "warn",
      details: `Synchronized session ${updatedSession.collaborationSessionId}`,
    });

    return {
      collaborationRunReportId: this.metadata.buildRunReportId(),
      runTimestamp: new Date().toISOString(),
      session: updatedSession,
      validation,
      durationMs: Date.now() - started,
      metadataVersion: COLLABORATION_METADATA_VERSION,
    };
  }

  getActiveSession(): CollaborationSessionRecord | null {
    return this.sessions.getActiveSession();
  }

  getActiveSessionCount(): number {
    return this.sessions.getActiveSessionCount();
  }

  endSession(sessionId: string): void {
    this.sessions.endSession(sessionId);
  }

  resetForTesting(): void {
    this.sessions.resetForTesting();
    this.memory.resetForTesting();
  }

  private collectPendingComparisons(engines: ContinuousCollaborationEngineBundle): string[] {
    try {
      const report = engines.sideBySideComparison?.getLatestReport?.() ?? null;
      const comparison = report?.comparison ?? null;
      return comparison ? [comparison.comparisonId] : [];
    } catch {
      return [];
    }
  }

  private collectClarifications(engines: ContinuousCollaborationEngineBundle): string[] {
    try {
      const report = engines.naturalUxConversation?.getLatestReport?.() ?? null;
      const turn = report?.latestTurn ?? null;
      if (!turn || turn.clarificationStatus !== "pending") return [];
      return turn.clarificationQuestions.map((q) => q.question);
    } catch {
      return [];
    }
  }
}
