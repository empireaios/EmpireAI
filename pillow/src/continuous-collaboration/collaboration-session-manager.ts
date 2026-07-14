/** T4-09 — Collaboration session lifecycle management. */

import type { CollaborationSessionRecord, SessionStatus } from "./types.js";
import { CollaborationMetadataGenerator } from "./collaboration-metadata-generator.js";
import { appendCollaborationLog } from "./collaboration-logging.js";
import { COLLABORATION_METADATA_VERSION } from "./paths.js";

export class CollaborationSessionManager {
  private readonly metadata = new CollaborationMetadataGenerator();
  private activeSession: CollaborationSessionRecord | null = null;
  private history: CollaborationSessionRecord[] = [];

  startSession(sessionId?: string): CollaborationSessionRecord {
    const session: CollaborationSessionRecord = {
      collaborationSessionId: sessionId ?? this.metadata.buildSessionId(),
      timestamp: new Date().toISOString(),
      sessionStatus: "active",
      activeDiscussionTopics: [],
      pendingProposalIds: [],
      pendingComparisonIds: [],
      pendingApprovalIds: [],
      activeUxGoals: [],
      activeDesignDirection: null,
      collaborationContextSummary: "Collaboration session started",
      appliedCollaborationPreferences: [],
      outstandingClarificationItems: [],
      confidenceScore: 0.5,
      metadataVersion: COLLABORATION_METADATA_VERSION,
    };
    this.activeSession = session;
    appendCollaborationLog({
      event: "collaboration_session_start",
      level: "info",
      details: `Session ${session.collaborationSessionId} started`,
    });
    return session;
  }

  restoreSession(session: CollaborationSessionRecord): CollaborationSessionRecord {
    const restored = { ...session, sessionStatus: "restored" as SessionStatus };
    this.activeSession = restored;
    appendCollaborationLog({
      event: "context_restoration",
      level: "info",
      details: `Restored session ${restored.collaborationSessionId}`,
    });
    return restored;
  }

  updateSession(session: CollaborationSessionRecord): CollaborationSessionRecord {
    this.activeSession = session;
    return session;
  }

  endSession(sessionId: string): void {
    if (this.activeSession?.collaborationSessionId === sessionId) {
      this.activeSession = {
        ...this.activeSession,
        sessionStatus: "completed",
      };
      if (this.activeSession) this.history.push(this.activeSession);
      appendCollaborationLog({
        event: "collaboration_session_end",
        level: "info",
        details: `Session ${sessionId} ended`,
      });
      this.activeSession = null;
    }
  }

  getActiveSession(): CollaborationSessionRecord | null {
    return this.activeSession ? { ...this.activeSession } : null;
  }

  getActiveSessionCount(): number {
    return this.activeSession ? 1 : 0;
  }

  getHistory(): CollaborationSessionRecord[] {
    return [...this.history];
  }

  resetForTesting(): void {
    this.activeSession = null;
    this.history = [];
  }
}
