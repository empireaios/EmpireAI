/** T1-06 — Interaction tracking session lifecycle. */

import type { InteractionSessionState, TrackingStatus } from "./types.js";

export class InteractionTrackingManager {
  private session: InteractionSessionState | null = null;

  startSession(): InteractionSessionState {
    const sessionId = `ite-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.session = {
      sessionId,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: "tracking",
      eventsRecorded: 0,
      eventsFailed: 0,
      lastEventAt: null,
      listenersAttached: 1,
    };
    return { ...this.session };
  }

  endSession(status: TrackingStatus = "stopped"): InteractionSessionState | null {
    if (!this.session) return null;
    this.session.endedAt = new Date().toISOString();
    this.session.status = status;
    this.session.listenersAttached = 0;
    const ended = { ...this.session };
    this.session = null;
    return ended;
  }

  recordEvent(success: boolean): InteractionSessionState | null {
    if (!this.session) return null;
    if (success) {
      this.session.eventsRecorded += 1;
      this.session.lastEventAt = new Date().toISOString();
    } else {
      this.session.eventsFailed += 1;
    }
    return { ...this.session };
  }

  setStatus(status: TrackingStatus): void {
    if (this.session) this.session.status = status;
  }

  getSession(): InteractionSessionState | null {
    return this.session ? { ...this.session } : null;
  }
}
