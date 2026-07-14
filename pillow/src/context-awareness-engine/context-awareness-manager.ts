/** T1-07 — Context awareness session lifecycle. */

import type { AwarenessStatus, ContextSessionState } from "./types.js";

export class ContextAwarenessManager {
  private session: ContextSessionState | null = null;

  startSession(): ContextSessionState {
    const sessionId = `cae-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.session = {
      sessionId,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: "aware",
      contextsGenerated: 0,
      contextsFailed: 0,
      lastContextAt: null,
      lastScreenId: null,
    };
    return { ...this.session };
  }

  endSession(status: AwarenessStatus = "stopped"): ContextSessionState | null {
    if (!this.session) return null;
    this.session.endedAt = new Date().toISOString();
    this.session.status = status;
    const ended = { ...this.session };
    this.session = null;
    return ended;
  }

  recordContext(success: boolean, screenId: string | null): ContextSessionState | null {
    if (!this.session) return null;
    if (success) {
      this.session.contextsGenerated += 1;
      this.session.lastContextAt = new Date().toISOString();
      if (screenId) this.session.lastScreenId = screenId;
    } else {
      this.session.contextsFailed += 1;
    }
    return { ...this.session };
  }

  setStatus(status: AwarenessStatus): void {
    if (this.session) this.session.status = status;
  }

  getSession(): ContextSessionState | null {
    return this.session ? { ...this.session } : null;
  }
}
