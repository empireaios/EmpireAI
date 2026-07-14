/** T5-06 — Adaptation session lifecycle. */

import { randomUUID } from "node:crypto";
import type { AdaptationSessionRecord, EngineStatus } from "./types.js";

export class AdaptationSessionManager {
  private activeSession: AdaptationSessionRecord | null = null;

  startSession(sessionId?: string): AdaptationSessionRecord {
    const session: AdaptationSessionRecord = {
      adaptationSessionId: sessionId ?? `aie-session-${randomUUID()}`,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: "adapting",
      adaptationCyclesRecorded: 0,
      adaptationCyclesFailed: 0,
      adaptationsGenerated: 0,
      lastAdaptationAt: null,
      lastScreenId: null,
      lastRouteId: null,
      continuousAdaptationActive: false,
    };
    this.activeSession = session;
    return session;
  }

  getActiveSession(): AdaptationSessionRecord | null {
    return this.activeSession;
  }

  getActiveSessionCount(): number {
    return this.activeSession ? 1 : 0;
  }

  recordAdaptation(
    screenId: string | null,
    routeId: string | null,
    success: boolean,
    adaptationCount: number,
  ): void {
    if (!this.activeSession) return;
    this.activeSession.adaptationCyclesRecorded += 1;
    if (!success) this.activeSession.adaptationCyclesFailed += 1;
    this.activeSession.adaptationsGenerated += adaptationCount;
    this.activeSession.lastAdaptationAt = new Date().toISOString();
    this.activeSession.lastScreenId = screenId;
    this.activeSession.lastRouteId = routeId;
  }

  setContinuousAdaptationActive(active: boolean): void {
    if (this.activeSession) this.activeSession.continuousAdaptationActive = active;
  }

  endSession(sessionId: string): void {
    if (this.activeSession?.adaptationSessionId === sessionId) {
      this.activeSession.endedAt = new Date().toISOString();
      this.activeSession.status = "stopped" as EngineStatus;
      this.activeSession = null;
    }
  }

  resetForTesting(): void {
    this.activeSession = null;
  }
}
