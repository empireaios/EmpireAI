/** T5-05 — Workflow evolution session lifecycle. */

import { randomUUID } from "node:crypto";
import type { EngineStatus, EvolutionSessionRecord } from "./types.js";

export class WorkflowSessionManager {
  private activeSession: EvolutionSessionRecord | null = null;

  startSession(sessionId?: string): EvolutionSessionRecord {
    const session: EvolutionSessionRecord = {
      evolutionSessionId: sessionId ?? `wfe-session-${randomUUID()}`,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: "evolving",
      evolutionCyclesRecorded: 0,
      evolutionCyclesFailed: 0,
      recommendationsGenerated: 0,
      lastEvolutionAt: null,
      lastScreenId: null,
      lastRouteId: null,
      continuousEvolutionActive: false,
    };
    this.activeSession = session;
    return session;
  }

  getActiveSession(): EvolutionSessionRecord | null {
    return this.activeSession;
  }

  getActiveSessionCount(): number {
    return this.activeSession ? 1 : 0;
  }

  recordEvolution(
    screenId: string | null,
    routeId: string | null,
    success: boolean,
    recommendationCount: number,
  ): void {
    if (!this.activeSession) return;
    this.activeSession.evolutionCyclesRecorded += 1;
    if (!success) this.activeSession.evolutionCyclesFailed += 1;
    this.activeSession.recommendationsGenerated += recommendationCount;
    this.activeSession.lastEvolutionAt = new Date().toISOString();
    this.activeSession.lastScreenId = screenId;
    this.activeSession.lastRouteId = routeId;
  }

  setContinuousEvolutionActive(active: boolean): void {
    if (this.activeSession) this.activeSession.continuousEvolutionActive = active;
  }

  endSession(sessionId: string): void {
    if (this.activeSession?.evolutionSessionId === sessionId) {
      this.activeSession.endedAt = new Date().toISOString();
      this.activeSession.status = "stopped" as EngineStatus;
      this.activeSession = null;
    }
  }

  resetForTesting(): void {
    this.activeSession = null;
  }
}
