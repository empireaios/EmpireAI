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

  get(workspaceId: string, sessionId: string): WorkspaceSession | null {
    return this.sessions.get(this.key(workspaceId, sessionId)) ?? null;
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
