/** T1-01 — Capture session lifecycle. */

import type { CaptureSessionState, CaptureStatus } from "./types.js";

export class CaptureSessionManager {
  private session: CaptureSessionState | null = null;

  startSession(): CaptureSessionState {
    const sessionId = `vce-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.session = {
      sessionId,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: "capturing",
      framesCaptured: 0,
      framesFailed: 0,
      lastFrameAt: null,
    };
    return { ...this.session };
  }

  endSession(status: CaptureStatus = "stopped"): CaptureSessionState | null {
    if (!this.session) return null;
    this.session.endedAt = new Date().toISOString();
    this.session.status = status;
    const ended = { ...this.session };
    this.session = null;
    return ended;
  }

  recordFrame(success: boolean): CaptureSessionState | null {
    if (!this.session) return null;
    if (success) {
      this.session.framesCaptured += 1;
      this.session.lastFrameAt = new Date().toISOString();
    } else {
      this.session.framesFailed += 1;
    }
    return { ...this.session };
  }

  setStatus(status: CaptureStatus): void {
    if (this.session) this.session.status = status;
  }

  getSession(): CaptureSessionState | null {
    return this.session ? { ...this.session } : null;
  }
}
