/** T4-01 — Conversation session lifecycle management. */

import type { ConversationContext, ConversationSession, ConversationStatus, ConversationTurn } from "./types.js";
import { ConversationMetadataGenerator } from "./conversation-metadata-generator.js";
import { appendConversationLog } from "./conversation-logging.js";

function emptyContext(): ConversationContext {
  return {
    priorTurnCount: 0,
    activeTopics: [],
    lastIntentCategory: null,
    referencedScreenIds: [],
    referencedLayoutIds: [],
    referencedComponentIds: [],
    referencedWorkflowIds: [],
    notes: [],
  };
}

export class ConversationSessionManager {
  private readonly metadata = new ConversationMetadataGenerator();
  private sessions = new Map<string, ConversationSession>();
  private activeSessionId: string | null = null;

  startSession(existingSessionId?: string): ConversationSession {
    if (existingSessionId && this.sessions.has(existingSessionId)) {
      const existing = this.sessions.get(existingSessionId)!;
      this.activeSessionId = existing.sessionId;
      appendConversationLog({
        event: "conversation_start",
        level: "info",
        details: `Resumed session ${existing.sessionId}`,
      });
      return existing;
    }

    const session: ConversationSession = {
      sessionId: this.metadata.buildSessionId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      turns: [],
      status: "active",
      context: emptyContext(),
    };
    this.sessions.set(session.sessionId, session);
    this.activeSessionId = session.sessionId;
    appendConversationLog({
      event: "conversation_start",
      level: "info",
      details: `Started session ${session.sessionId}`,
    });
    return session;
  }

  getSession(sessionId: string): ConversationSession | null {
    return this.sessions.get(sessionId) ?? null;
  }

  getActiveSession(): ConversationSession | null {
    if (!this.activeSessionId) return null;
    return this.sessions.get(this.activeSessionId) ?? null;
  }

  appendTurn(sessionId: string, turn: ConversationTurn): ConversationSession {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Conversation session ${sessionId} not found`);
    }
    session.turns.push(turn);
    session.updatedAt = new Date().toISOString();
    session.status = turn.conversationStatus;
    session.context = turn.conversationContext;
    this.sessions.set(sessionId, session);
    return session;
  }

  updateStatus(sessionId: string, status: ConversationStatus): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.status = status;
    session.updatedAt = new Date().toISOString();
  }

  getActiveSessionCount(): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.status === "active" || session.status === "awaiting_clarification") {
        count += 1;
      }
    }
    return count;
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    if (session.status === "active" || session.status === "awaiting_clarification") {
      session.status = "completed";
      session.updatedAt = new Date().toISOString();
    }
    if (this.activeSessionId === sessionId) this.activeSessionId = null;
    appendConversationLog({
      event: "conversation_end",
      level: "info",
      details: `Ended session ${sessionId}`,
    });
  }

  resetForTesting(): void {
    this.sessions.clear();
    this.activeSessionId = null;
  }
}
