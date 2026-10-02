import { productionReasoningState, type ReasoningState } from "./reasoning-state.js";
import { randomUUID } from "node:crypto";

import type { WorkspaceSession } from "./types.js";

function emptyTokenUsage(): WorkspaceSession["tokenUsage"] {
  return {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    requestCount: 0,
  };
}

/** In-memory workspace session store (PILLOW-016 — ephemeral chat state). */
export class PillowSessionStore {
  constructor(private readonly durable: () => ReasoningState | null = productionReasoningState) {}

  persist(session: WorkspaceSession): void { this.durable()?.save(session); }

  private readonly sessions = new Map<string, WorkspaceSession>();

  private key(workspaceId: string, sessionId: string): string {
    return `${workspaceId}:${sessionId}`;
  }

  create(
    workspaceId: string,
    options?: {
      repositoryFingerprint?: string;
      currentMission?: string | null;
    },
  ): WorkspaceSession {
    const now = new Date().toISOString();
    const session: WorkspaceSession = {
      sessionId: randomUUID(),
      workspaceId,
      conversationHistory: [],
      approvalState: "none",
      repositoryFingerprint: options?.repositoryFingerprint ?? "",
      currentMission: options?.currentMission ?? null,
      tokenUsage: emptyTokenUsage(),
      createdAt: now,
      updatedAt: now,
      lastActivityAt: now,
    };
    this.sessions.set(this.key(workspaceId, session.sessionId), session);
    return session;
  }

  /**
   * Reuse the newest non-stale workspace session when present.
   * Prevents Cockpit bootstrap stampedes from allocating unbounded sessions.
   */
  getOrCreate(
    workspaceId: string,
    options?: {
      repositoryFingerprint?: string;
      currentMission?: string | null;
      maxAgeMs?: number;
    },
  ): { session: WorkspaceSession; reused: boolean } {
    const durable = this.durable();
    if (durable) {
      const candidate = randomUUID();
      const canonicalId = durable.canonical(workspaceId, candidate);
      const session = this.get(workspaceId, canonicalId);
      if (!session) throw new Error('Canonical conversation unavailable');
      return {session, reused: canonicalId !== candidate};
    }
    const maxAgeMs = options?.maxAgeMs ?? Number(process.env.PILLOW_SESSION_REUSE_MAX_AGE_MS ?? 30 * 60_000);
    const durableId = this.durable()?.latest(workspaceId, maxAgeMs);
    if (durableId) this.get(workspaceId, durableId);
    const existing = this.listForWorkspace(workspaceId)
      .slice()
      .sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt))[0];
    if (existing) {
      const ageMs = Date.now() - Date.parse(existing.lastActivityAt);
      if (Number.isFinite(ageMs) && ageMs >= 0 && ageMs <= maxAgeMs) {
        existing.lastActivityAt = new Date().toISOString();
        existing.updatedAt = existing.lastActivityAt;
        return { session: existing, reused: true };
      }
    }
    return { session: this.create(workspaceId, options), reused: false };
  }

  get(workspaceId: string, sessionId: string): WorkspaceSession | null {
    const cached = this.sessions.get(this.key(workspaceId, sessionId));
    if (cached) return cached;
    const turns = this.durable()?.load(workspaceId, sessionId);
    if (!turns) return null;
    const restored = this.create(workspaceId);
    this.sessions.delete(this.key(workspaceId, restored.sessionId));
    restored.sessionId = sessionId;
    restored.conversationHistory = turns;
    // No approval, mission authority or provider permissions are imported.
    restored.approvalState = "none";
    this.sessions.set(this.key(workspaceId, sessionId), restored);
    return restored;
  }

  listForWorkspace(workspaceId: string): WorkspaceSession[] {
    return [...this.sessions.values()].filter(
      (session) => session.workspaceId === workspaceId,
    );
  }

  destroy(workspaceId: string, sessionId: string): boolean {
    return this.sessions.delete(this.key(workspaceId, sessionId));
  }

  destroyAllForWorkspace(workspaceId: string): number {
    let removed = 0;
    for (const session of this.listForWorkspace(workspaceId)) {
      if (this.destroy(workspaceId, session.sessionId)) removed++;
    }
    return removed;
  }

  count(): number {
    return this.sessions.size;
  }

  clear(): void {
    this.sessions.clear();
  }
}
