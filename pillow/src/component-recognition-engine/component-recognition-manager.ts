/** T1-03 — Recognition session lifecycle. */

import type { RecognitionSessionState, RecognitionStatus } from "./types.js";

export class ComponentRecognitionManager {
  private session: RecognitionSessionState | null = null;

  startSession(): RecognitionSessionState {
    const sessionId = `cre-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.session = {
      sessionId,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: "recognizing",
      recognitionsCompleted: 0,
      recognitionsFailed: 0,
      lastRecognitionAt: null,
      lastSourceStateId: null,
    };
    return { ...this.session };
  }

  endSession(status: RecognitionStatus = "stopped"): RecognitionSessionState | null {
    if (!this.session) return null;
    this.session.endedAt = new Date().toISOString();
    this.session.status = status;
    const ended = { ...this.session };
    this.session = null;
    return ended;
  }

  recordRecognition(success: boolean, sourceStateId: string | null): RecognitionSessionState | null {
    if (!this.session) return null;
    if (success) {
      this.session.recognitionsCompleted += 1;
      this.session.lastRecognitionAt = new Date().toISOString();
      if (sourceStateId) this.session.lastSourceStateId = sourceStateId;
    } else {
      this.session.recognitionsFailed += 1;
    }
    return { ...this.session };
  }

  setStatus(status: RecognitionStatus): void {
    if (this.session) this.session.status = status;
  }

  getSession(): RecognitionSessionState | null {
    return this.session ? { ...this.session } : null;
  }
}
