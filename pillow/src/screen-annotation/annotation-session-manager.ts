/** T4-03 — Annotation session lifecycle management. */

import type { AnnotationSession, PointAndEditIntent, ProcessingStatus, ScreenAnnotationRecord } from "./types.js";
import { AnnotationMetadataGenerator } from "./annotation-metadata-generator.js";
import { appendAnnotationLog } from "./annotation-logging.js";

export class AnnotationSessionManager {
  private readonly metadata = new AnnotationMetadataGenerator();
  private sessions = new Map<string, AnnotationSession>();
  private activeSessionId: string | null = null;

  startSession(existingSessionId?: string): AnnotationSession {
    if (existingSessionId && this.sessions.has(existingSessionId)) {
      const existing = this.sessions.get(existingSessionId)!;
      this.activeSessionId = existing.sessionId;
      appendAnnotationLog({
        event: "screen_annotation_session_start",
        level: "info",
        details: `Resumed session ${existing.sessionId}`,
      });
      return existing;
    }

    const session: AnnotationSession = {
      sessionId: this.metadata.buildSessionId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      annotations: [],
      intents: [],
      status: "received",
    };
    this.sessions.set(session.sessionId, session);
    this.activeSessionId = session.sessionId;
    appendAnnotationLog({
      event: "screen_annotation_session_start",
      level: "info",
      details: `Started session ${session.sessionId}`,
    });
    return session;
  }

  getSession(sessionId: string): AnnotationSession | null {
    return this.sessions.get(sessionId) ?? null;
  }

  getActiveSession(): AnnotationSession | null {
    if (!this.activeSessionId) return null;
    return this.sessions.get(this.activeSessionId) ?? null;
  }

  appendAnnotation(sessionId: string, annotation: ScreenAnnotationRecord, intent: PointAndEditIntent | null): AnnotationSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Annotation session ${sessionId} not found`);
    session.annotations.push(annotation);
    if (intent) session.intents.push(intent);
    session.updatedAt = new Date().toISOString();
    session.status = annotation.processingStatus;
    this.sessions.set(sessionId, session);
    return session;
  }

  trimHistory(session: AnnotationSession, maxAnnotations: number): AnnotationSession {
    if (session.annotations.length <= maxAnnotations) return session;
    return {
      ...session,
      annotations: session.annotations.slice(-maxAnnotations),
      intents: session.intents.slice(-maxAnnotations),
      updatedAt: new Date().toISOString(),
    };
  }

  updateStatus(sessionId: string, status: ProcessingStatus): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    session.status = status;
    session.updatedAt = new Date().toISOString();
  }

  getActiveSessionCount(): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (
        session.status === "received" ||
        session.status === "captured" ||
        session.status === "mapped" ||
        session.status === "linked" ||
        session.status === "intent_generated" ||
        session.status === "awaiting_clarification"
      ) {
        count += 1;
      }
    }
    return count;
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    if (session.status !== "completed" && session.status !== "failed") {
      session.status = "completed";
      session.updatedAt = new Date().toISOString();
    }
    if (this.activeSessionId === sessionId) this.activeSessionId = null;
    appendAnnotationLog({
      event: "screen_annotation_session_end",
      level: "info",
      details: `Ended session ${sessionId}`,
    });
  }

  resetForTesting(): void {
    this.sessions.clear();
    this.activeSessionId = null;
  }
}
