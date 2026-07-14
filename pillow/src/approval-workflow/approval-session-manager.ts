/** T4-07 — Approval session lifecycle. */

import type { ApprovalRecord, ApprovalSession, ApprovalStatus } from "./types.js";
import { ApprovalMetadataGenerator } from "./approval-metadata-generator.js";

export class ApprovalSessionManager {
  private sessions = new Map<string, ApprovalSession>();

  startSession(sessionId?: string): ApprovalSession {
    const metadata = new ApprovalMetadataGenerator();
    const id = sessionId ?? metadata.buildSessionId();
    const existing = this.sessions.get(id);
    if (existing) return existing;

    const session: ApprovalSession = {
      sessionId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      approvals: [],
      status: "pending",
    };
    this.sessions.set(id, session);
    return session;
  }

  appendApproval(
    sessionId: string,
    approval: ApprovalRecord,
    status: ApprovalStatus,
  ): ApprovalSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Approval session not found: ${sessionId}`);
    const updated: ApprovalSession = {
      ...session,
      updatedAt: new Date().toISOString(),
      approvals: [...session.approvals, approval],
      status,
    };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    this.sessions.set(sessionId, { ...session, status: "completed" });
  }

  trimHistory(session: ApprovalSession, max: number): ApprovalSession {
    if (session.approvals.length <= max) return session;
    return { ...session, approvals: session.approvals.slice(-max) };
  }

  getActiveSessionCount(): number {
    let count = 0;
    for (const s of this.sessions.values()) {
      if (s.status !== "completed" && s.status !== "failed") count += 1;
    }
    return count;
  }

  resetForTesting(): void {
    this.sessions.clear();
  }
}
