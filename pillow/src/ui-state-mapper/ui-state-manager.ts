/** T1-02 — Mapping session lifecycle. */

import type { MappingSessionState, MappingStatus } from "./types.js";

export class UiStateManager {
  private session: MappingSessionState | null = null;

  startSession(): MappingSessionState {
    const sessionId = `usm-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.session = {
      sessionId,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: "mapping",
      statesGenerated: 0,
      statesFailed: 0,
      lastStateAt: null,
      lastSourceFrameNumber: null,
    };
    return { ...this.session };
  }

  endSession(status: MappingStatus = "stopped"): MappingSessionState | null {
    if (!this.session) return null;
    this.session.endedAt = new Date().toISOString();
    this.session.status = status;
    const ended = { ...this.session };
    this.session = null;
    return ended;
  }

  recordState(success: boolean, frameNumber: number | null): MappingSessionState | null {
    if (!this.session) return null;
    if (success) {
      this.session.statesGenerated += 1;
      this.session.lastStateAt = new Date().toISOString();
      if (frameNumber !== null) this.session.lastSourceFrameNumber = frameNumber;
    } else {
      this.session.statesFailed += 1;
    }
    return { ...this.session };
  }

  setStatus(status: MappingStatus): void {
    if (this.session) this.session.status = status;
  }

  getSession(): MappingSessionState | null {
    return this.session ? { ...this.session } : null;
  }
}
