/** T5-03 — Discovery session lifecycle. */

import { randomUUID } from "node:crypto";
import type { DiscoverySessionRecord, EngineStatus } from "./types.js";

export class OpportunitySessionManager {
  private activeSession: DiscoverySessionRecord | null = null;

  startSession(sessionId?: string): DiscoverySessionRecord {
    const session: DiscoverySessionRecord = {
      discoverySessionId: sessionId ?? `uod-session-${randomUUID()}`,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: "discovering",
      discoveriesRecorded: 0,
      discoveriesFailed: 0,
      opportunitiesDiscovered: 0,
      lastDiscoveryAt: null,
      lastScreenId: null,
      lastRouteId: null,
      continuousDiscoveryActive: false,
    };
    this.activeSession = session;
    return session;
  }

  getActiveSession(): DiscoverySessionRecord | null {
    return this.activeSession;
  }

  getActiveSessionCount(): number {
    return this.activeSession ? 1 : 0;
  }

  recordDiscovery(
    screenId: string | null,
    routeId: string | null,
    success: boolean,
    opportunityCount: number,
  ): void {
    if (!this.activeSession) return;
    this.activeSession.discoveriesRecorded += 1;
    if (!success) this.activeSession.discoveriesFailed += 1;
    this.activeSession.opportunitiesDiscovered += opportunityCount;
    this.activeSession.lastDiscoveryAt = new Date().toISOString();
    this.activeSession.lastScreenId = screenId;
    this.activeSession.lastRouteId = routeId;
  }

  setContinuousDiscoveryActive(active: boolean): void {
    if (this.activeSession) this.activeSession.continuousDiscoveryActive = active;
  }

  endSession(sessionId: string): void {
    if (this.activeSession?.discoverySessionId === sessionId) {
      this.activeSession.endedAt = new Date().toISOString();
      this.activeSession.status = "stopped" as EngineStatus;
      this.activeSession = null;
    }
  }

  resetForTesting(): void {
    this.activeSession = null;
  }
}
