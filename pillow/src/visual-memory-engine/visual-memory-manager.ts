/** T1-08 — Visual memory session lifecycle. */

import type { MemorySessionState, MemoryStatus } from "./types.js";

export class VisualMemoryManager {
  private session: MemorySessionState | null = null;

  startSession(): MemorySessionState {
    this.session = {
      sessionId: `vme-session-${Date.now()}`,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: "recording",
      recordsStored: 0,
      recordsFailed: 0,
      lastRecordAt: null,
      lastScreenId: null,
    };
    return this.session;
  }

  getSession(): MemorySessionState | null {
    return this.session ? { ...this.session } : null;
  }

  setStatus(status: MemoryStatus): void {
    if (this.session) this.session.status = status;
  }

  recordStored(success: boolean, screenId: string | null): void {
    if (!this.session) return;
    if (success) {
      this.session.recordsStored += 1;
      this.session.lastRecordAt = new Date().toISOString();
      if (screenId) this.session.lastScreenId = screenId;
    } else {
      this.session.recordsFailed += 1;
    }
  }

  endSession(status: MemoryStatus): void {
    if (this.session) {
      this.session.endedAt = new Date().toISOString();
      this.session.status = status;
    }
  }
}
