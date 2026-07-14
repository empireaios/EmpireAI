/** T5-02 — Audit session lifecycle. */

import { randomUUID } from "node:crypto";
import type { AuditSessionRecord, EngineStatus } from "./types.js";

export class AuditSessionManager {
  private activeSession: AuditSessionRecord | null = null;

  startSession(sessionId?: string): AuditSessionRecord {
    const session: AuditSessionRecord = {
      auditSessionId: sessionId ?? `aua-session-${randomUUID()}`,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: "auditing",
      auditsRecorded: 0,
      auditsFailed: 0,
      issuesDetected: 0,
      lastAuditAt: null,
      lastScreenId: null,
      lastRouteId: null,
      continuousAuditActive: false,
    };
    this.activeSession = session;
    return session;
  }

  getActiveSession(): AuditSessionRecord | null {
    return this.activeSession;
  }

  getActiveSessionCount(): number {
    return this.activeSession ? 1 : 0;
  }

  recordAudit(
    screenId: string | null,
    routeId: string | null,
    success: boolean,
    issuesCount: number,
  ): void {
    if (!this.activeSession) return;
    this.activeSession.auditsRecorded += 1;
    if (!success) this.activeSession.auditsFailed += 1;
    this.activeSession.issuesDetected += issuesCount;
    this.activeSession.lastAuditAt = new Date().toISOString();
    this.activeSession.lastScreenId = screenId;
    this.activeSession.lastRouteId = routeId;
  }

  setContinuousAuditActive(active: boolean): void {
    if (this.activeSession) this.activeSession.continuousAuditActive = active;
  }

  endSession(sessionId: string): void {
    if (this.activeSession?.auditSessionId === sessionId) {
      this.activeSession.endedAt = new Date().toISOString();
      this.activeSession.status = "stopped" as EngineStatus;
      this.activeSession = null;
    }
  }

  resetForTesting(): void {
    this.activeSession = null;
  }
}
