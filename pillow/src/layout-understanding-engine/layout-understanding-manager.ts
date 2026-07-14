/** T1-04 — Layout session lifecycle. */

import type { LayoutSessionState, LayoutStatus } from "./types.js";

export class LayoutUnderstandingManager {
  private session: LayoutSessionState | null = null;

  startSession(): LayoutSessionState {
    const sessionId = `lue-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.session = {
      sessionId,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: "analyzing",
      layoutsGenerated: 0,
      layoutsFailed: 0,
      lastLayoutAt: null,
      lastSourceStateId: null,
    };
    return { ...this.session };
  }

  endSession(status: LayoutStatus = "stopped"): LayoutSessionState | null {
    if (!this.session) return null;
    this.session.endedAt = new Date().toISOString();
    this.session.status = status;
    const ended = { ...this.session };
    this.session = null;
    return ended;
  }

  recordLayout(success: boolean, sourceStateId: string | null): LayoutSessionState | null {
    if (!this.session) return null;
    if (success) {
      this.session.layoutsGenerated += 1;
      this.session.lastLayoutAt = new Date().toISOString();
      if (sourceStateId) this.session.lastSourceStateId = sourceStateId;
    } else {
      this.session.layoutsFailed += 1;
    }
    return { ...this.session };
  }

  setStatus(status: LayoutStatus): void {
    if (this.session) this.session.status = status;
  }

  getSession(): LayoutSessionState | null {
    return this.session ? { ...this.session } : null;
  }
}
