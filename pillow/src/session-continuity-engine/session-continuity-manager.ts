/** T1-09 — Session continuity session lifecycle. */

import type { ContinuitySessionState, ContinuityStatus, SessionEventType } from "./types.js";

export class SessionContinuityManager {
  private session: ContinuitySessionState | null = null;

  startSession(sessionId?: string): ContinuitySessionState {
    this.session = {
      sessionId: sessionId ?? `sce-session-${Date.now()}`,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: "active",
      updatesApplied: 0,
      updatesFailed: 0,
      recoveriesAttempted: 0,
      lastUpdateAt: null,
      lastScreenId: null,
      lastEvent: "session_start",
    };
    return this.session;
  }

  getSession(): ContinuitySessionState | null {
    return this.session ? { ...this.session } : null;
  }

  setStatus(status: ContinuityStatus): void {
    if (this.session) this.session.status = status;
  }

  recordEvent(event: SessionEventType): void {
    if (this.session) this.session.lastEvent = event;
  }

  recordUpdate(success: boolean, screenId: string | null): void {
    if (!this.session) return;
    if (success) {
      this.session.updatesApplied += 1;
      this.session.lastUpdateAt = new Date().toISOString();
      if (screenId) this.session.lastScreenId = screenId;
    } else {
      this.session.updatesFailed += 1;
    }
  }

  recordRecoveryAttempt(): void {
    if (this.session) this.session.recoveriesAttempted += 1;
  }

  endSession(status: ContinuityStatus): void {
    if (this.session) {
      this.session.endedAt = new Date().toISOString();
      this.session.status = status;
    }
  }
}
