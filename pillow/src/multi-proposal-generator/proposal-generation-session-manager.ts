/** T4-04 — Proposal generation session lifecycle. */

import type { GenerationStatus, ProposalGenerationSession, RedesignProposalRecord } from "./types.js";
import { ProposalMetadataGenerator } from "./proposal-metadata-generator.js";
import { appendProposalLog } from "./proposal-logging.js";

export class ProposalGenerationSessionManager {
  private readonly metadata = new ProposalMetadataGenerator();
  private sessions = new Map<string, ProposalGenerationSession>();
  private activeSessionId: string | null = null;

  startSession(existingSessionId?: string): ProposalGenerationSession {
    if (existingSessionId && this.sessions.has(existingSessionId)) {
      const existing = this.sessions.get(existingSessionId)!;
      this.activeSessionId = existing.sessionId;
      return existing;
    }

    const session: ProposalGenerationSession = {
      sessionId: this.metadata.buildSessionId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      proposals: [],
      status: "received",
    };
    this.sessions.set(session.sessionId, session);
    this.activeSessionId = session.sessionId;
    appendProposalLog({
      event: "multi_proposal_generation_start",
      level: "info",
      details: `Started session ${session.sessionId}`,
    });
    return session;
  }

  getSession(sessionId: string): ProposalGenerationSession | null {
    return this.sessions.get(sessionId) ?? null;
  }

  getActiveSessionCount(): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.status !== "completed" && session.status !== "failed") count += 1;
    }
    return count;
  }

  appendProposals(
    sessionId: string,
    proposals: RedesignProposalRecord[],
    status: GenerationStatus,
  ): ProposalGenerationSession {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Proposal session ${sessionId} not found`);
    session.proposals.push(...proposals);
    session.updatedAt = new Date().toISOString();
    session.status = status;
    this.sessions.set(sessionId, session);
    return session;
  }

  trimHistory(session: ProposalGenerationSession, maxProposals: number): ProposalGenerationSession {
    if (session.proposals.length <= maxProposals) return session;
    return {
      ...session,
      proposals: session.proposals.slice(-maxProposals),
      updatedAt: new Date().toISOString(),
    };
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    if (session.status !== "completed" && session.status !== "failed") {
      session.status = "completed";
      session.updatedAt = new Date().toISOString();
    }
    if (this.activeSessionId === sessionId) this.activeSessionId = null;
    appendProposalLog({
      event: "multi_proposal_generation_end",
      level: "info",
      details: `Ended session ${sessionId}`,
    });
  }

  resetForTesting(): void {
    this.sessions.clear();
    this.activeSessionId = null;
  }
}
