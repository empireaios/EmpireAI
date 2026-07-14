/** T5-01 — Observation session lifecycle. */

import { randomUUID } from "node:crypto";
import type { ObservationSessionRecord } from "./types.js";

export class ObservationSessionManager {
  private activeSession: ObservationSessionRecord | null = null;

  startSession(sessionId?: string): ObservationSessionRecord {
    const session: ObservationSessionRecord = {
      observationSessionId: sessionId ?? randomUUID(),
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: "observing",
      observationsRecorded: 0,
      observationsFailed: 0,
      lastObservationAt: null,
      lastScreenId: null,
      lastRouteId: null,
      continuousMonitoringActive: true,
    };
    this.activeSession = session;
    return session;
  }

  restoreSession(record: ObservationSessionRecord): ObservationSessionRecord {
    this.activeSession = {
      ...record,
      endedAt: null,
      status: "observing",
      continuousMonitoringActive: true,
    };
    return this.activeSession;
  }

  getActiveSession(): ObservationSessionRecord | null {
    return this.activeSession ? { ...this.activeSession } : null;
  }

  recordObservation(screenId: string | null, routeId: string | null, success: boolean): void {
    if (!this.activeSession) return;
    if (success) {
      this.activeSession.observationsRecorded += 1;
    } else {
      this.activeSession.observationsFailed += 1;
    }
    this.activeSession.lastObservationAt = new Date().toISOString();
    this.activeSession.lastScreenId = screenId;
    this.activeSession.lastRouteId = routeId;
  }

  endSession(sessionId: string): void {
    if (!this.activeSession || this.activeSession.observationSessionId !== sessionId) return;
    this.activeSession.endedAt = new Date().toISOString();
    this.activeSession.status = "stopped";
    this.activeSession.continuousMonitoringActive = false;
    this.activeSession = null;
  }

  getActiveSessionCount(): number {
    return this.activeSession ? 1 : 0;
  }

  resetForTesting(): void {
    this.activeSession = null;
  }
}
