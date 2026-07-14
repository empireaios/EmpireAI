/** T5-09 — UX learning session lifecycle. */

import { randomUUID } from "node:crypto";
import type { EngineStatus, LearningSessionRecord } from "./types.js";

export class LearningSessionManager {
  private activeSession: LearningSessionRecord | null = null;

  startSession(sessionId?: string): LearningSessionRecord {
    const session: LearningSessionRecord = {
      learningSessionId: sessionId ?? `siux-session-${randomUUID()}`,
      startedAt: new Date().toISOString(),
      endedAt: null,
      status: "learning",
      learningCyclesRecorded: 0,
      learningCyclesFailed: 0,
      insightsGenerated: 0,
      lastLearningAt: null,
      continuousLearningActive: false,
    };
    this.activeSession = session;
    return session;
  }

  getActiveSession(): LearningSessionRecord | null {
    return this.activeSession;
  }

  getActiveSessionCount(): number {
    return this.activeSession ? 1 : 0;
  }

  recordLearning(success: boolean, insightCount: number): void {
    if (!this.activeSession) return;
    this.activeSession.learningCyclesRecorded += 1;
    if (!success) this.activeSession.learningCyclesFailed += 1;
    this.activeSession.insightsGenerated += insightCount;
    this.activeSession.lastLearningAt = new Date().toISOString();
  }

  setContinuousLearningActive(active: boolean): void {
    if (this.activeSession) this.activeSession.continuousLearningActive = active;
  }

  endSession(sessionId: string): void {
    if (this.activeSession?.learningSessionId === sessionId) {
      this.activeSession.endedAt = new Date().toISOString();
      this.activeSession.status = "stopped" as EngineStatus;
      this.activeSession = null;
    }
  }

  resetForTesting(): void {
    this.activeSession = null;
  }
}
