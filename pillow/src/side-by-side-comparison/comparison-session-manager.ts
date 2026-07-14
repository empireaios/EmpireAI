/** T4-05 — Comparison session lifecycle management. */

import type { ComparisonSession, ComparisonStatus, SideBySideComparisonRecord } from "./types.js";
import { ComparisonMetadataGenerator } from "./comparison-metadata-generator.js";
import { appendComparisonLog } from "./comparison-logging.js";

export class ComparisonSessionManager {
  private readonly metadata = new ComparisonMetadataGenerator();
  private sessions = new Map<string, ComparisonSession>();
  private activeSessionId: string | null = null;

  startSession(existingSessionId?: string): ComparisonSession {
    if (existingSessionId && this.sessions.has(existingSessionId)) {
      const existing = this.sessions.get(existingSessionId)!;
      this.activeSessionId = existing.sessionId;
      return existing;
    }

    const session: ComparisonSession = {
      sessionId: this.metadata.buildSessionId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comparisons: [],
      status: "received",
    };
    this.sessions.set(session.sessionId, session);
    this.activeSessionId = session.sessionId;
    appendComparisonLog({
      event: "side_by_side_comparison_start",
      level: "info",
      details: `Started session ${session.sessionId}`,
    });
    return session;
  }

  appendComparison(
    sessionId: string,
    comparison: SideBySideComparisonRecord,
    status: ComparisonStatus,
  ): ComparisonSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Comparison session ${sessionId} not found`);
    session.comparisons.push(comparison);
    session.updatedAt = new Date().toISOString();
    session.status = status;
    this.sessions.set(sessionId, session);
    return session;
  }

  trimHistory(session: ComparisonSession, maxComparisons: number): ComparisonSession {
    if (session.comparisons.length <= maxComparisons) return session;
    return {
      ...session,
      comparisons: session.comparisons.slice(-maxComparisons),
      updatedAt: new Date().toISOString(),
    };
  }

  getActiveSessionCount(): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.status !== "completed" && session.status !== "failed") count += 1;
    }
    return count;
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    if (session.status !== "completed" && session.status !== "failed") {
      session.status = "completed";
      session.updatedAt = new Date().toISOString();
    }
    if (this.activeSessionId === sessionId) this.activeSessionId = null;
    appendComparisonLog({
      event: "side_by_side_comparison_end",
      level: "info",
      details: `Ended session ${sessionId}`,
    });
  }

  resetForTesting(): void {
    this.sessions.clear();
    this.activeSessionId = null;
  }
}
