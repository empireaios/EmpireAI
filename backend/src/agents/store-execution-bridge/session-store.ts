import { randomUUID } from "node:crypto";

import type { StoreExecutionSession } from "./types.js";

type SessionKey = string;

function sessionKey(workspaceId: string, companyId?: string): SessionKey {
  return companyId ? `${workspaceId}:${companyId}` : workspaceId;
}

/** In-memory store for M046–M056 pipeline results keyed by workspace (and optional company). */
export class StoreExecutionSessionStore {
  private readonly sessions = new Map<SessionKey, StoreExecutionSession>();
  private readonly latestByWorkspace = new Map<string, SessionKey>();

  save(session: StoreExecutionSession): void {
    const key = sessionKey(session.workspaceId, session.companyId);
    this.sessions.set(key, session);
    this.latestByWorkspace.set(session.workspaceId, key);
  }

  get(workspaceId: string, companyId?: string): StoreExecutionSession | null {
    if (companyId) {
      return this.sessions.get(sessionKey(workspaceId, companyId)) ?? null;
    }

    const latestKey = this.latestByWorkspace.get(workspaceId);
    if (!latestKey) return null;
    return this.sessions.get(latestKey) ?? null;
  }

  clear(): void {
    this.sessions.clear();
    this.latestByWorkspace.clear();
  }
}

export const storeExecutionSessionStore = new StoreExecutionSessionStore();

export function createPipelineSessionId(): string {
  return randomUUID();
}
