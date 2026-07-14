/** T5-08 — Workspace optimization session lifecycle. */

import { randomUUID } from "node:crypto";
import type { EngineStatus, WorkspaceSessionRecord } from "./types.js";

export class WorkspaceSessionManager {
  private activeSession: WorkspaceSessionRecord | null = null;

  startSession(sessionId?: string): WorkspaceSessionRecord {
    const session: WorkspaceSessionRecord = {
      workspaceSessionId: sessionId ?? `ewi-session-${randomUUID()}`,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: "optimizing",
      optimizationCyclesRecorded: 0,
      optimizationCyclesFailed: 0,
      recommendationsGenerated: 0,
      lastOptimizationAt: null,
      lastMissionContext: null,
      continuousOptimizationActive: false,
    };
    this.activeSession = session;
    return session;
  }

  getActiveSession(): WorkspaceSessionRecord | null {
    return this.activeSession;
  }

  getActiveSessionCount(): number {
    return this.activeSession ? 1 : 0;
  }

  recordOptimization(
    missionContext: string | null,
    success: boolean,
    recommendationCount: number,
  ): void {
    if (!this.activeSession) return;
    this.activeSession.optimizationCyclesRecorded += 1;
    if (!success) this.activeSession.optimizationCyclesFailed += 1;
    this.activeSession.recommendationsGenerated += recommendationCount;
    this.activeSession.lastOptimizationAt = new Date().toISOString();
    this.activeSession.lastMissionContext = missionContext;
  }

  setContinuousOptimizationActive(active: boolean): void {
    if (this.activeSession) this.activeSession.continuousOptimizationActive = active;
  }

  endSession(sessionId: string): void {
    if (this.activeSession?.workspaceSessionId === sessionId) {
      this.activeSession.endedAt = new Date().toISOString();
      this.activeSession.status = "stopped" as EngineStatus;
      this.activeSession = null;
    }
  }

  resetForTesting(): void {
    this.activeSession = null;
  }
}
