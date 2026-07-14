/** T4-06 — Explanation session lifecycle. */

import type { ExplanationRecord, ExplanationSession, ExplanationStatus } from "./types.js";
import { ExplanationMetadataGenerator } from "./explanation-metadata-generator.js";

export class ExplanationSessionManager {
  private sessions = new Map<string, ExplanationSession>();

  startSession(sessionId?: string): ExplanationSession {
    const metadata = new ExplanationMetadataGenerator();
    const id = sessionId ?? metadata.buildSessionId();
    const existing = this.sessions.get(id);
    if (existing) return existing;

    const session: ExplanationSession = {
      sessionId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      explanations: [],
      status: "received",
    };
    this.sessions.set(id, session);
    return session;
  }

  appendExplanation(
    sessionId: string,
    explanation: ExplanationRecord,
    status: ExplanationStatus,
  ): ExplanationSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Explanation session not found: ${sessionId}`);
    const updated: ExplanationSession = {
      ...session,
      updatedAt: new Date().toISOString(),
      explanations: [...session.explanations, explanation],
      status,
    };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    this.sessions.set(sessionId, { ...session, status: "completed" });
  }

  trimHistory(session: ExplanationSession, max: number): ExplanationSession {
    if (session.explanations.length <= max) return session;
    return {
      ...session,
      explanations: session.explanations.slice(-max),
    };
  }

  getActiveSessionCount(): number {
    let count = 0;
    for (const s of this.sessions.values()) {
      if (s.status !== "completed" && s.status !== "failed") count += 1;
    }
    return count;
  }

  resetForTesting(): void {
    this.sessions.clear();
  }
}
