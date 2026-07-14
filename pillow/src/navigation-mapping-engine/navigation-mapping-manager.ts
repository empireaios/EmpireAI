/** T1-05 — Navigation mapping session lifecycle. */

import type { MappingStatus, NavigationSessionState } from "./types.js";

export class NavigationMappingManager {
  private session: NavigationSessionState | null = null;

  startSession(): NavigationSessionState {
    const sessionId = `nme-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.session = {
      sessionId,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: "mapping",
      graphsGenerated: 0,
      graphsFailed: 0,
      lastGraphAt: null,
      lastSourceLayoutId: null,
      lastScreenId: null,
    };
    return { ...this.session };
  }

  endSession(status: MappingStatus = "stopped"): NavigationSessionState | null {
    if (!this.session) return null;
    this.session.endedAt = new Date().toISOString();
    this.session.status = status;
    const ended = { ...this.session };
    this.session = null;
    return ended;
  }

  recordGraph(success: boolean, sourceLayoutId: string | null, screenId: string | null): NavigationSessionState | null {
    if (!this.session) return null;
    if (success) {
      this.session.graphsGenerated += 1;
      this.session.lastGraphAt = new Date().toISOString();
      if (sourceLayoutId) this.session.lastSourceLayoutId = sourceLayoutId;
      if (screenId) this.session.lastScreenId = screenId;
    } else {
      this.session.graphsFailed += 1;
    }
    return { ...this.session };
  }

  setStatus(status: MappingStatus): void {
    if (this.session) this.session.status = status;
  }

  getSession(): NavigationSessionState | null {
    return this.session ? { ...this.session } : null;
  }
}
