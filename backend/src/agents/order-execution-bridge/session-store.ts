import { randomUUID } from "node:crypto";

import type { OrderExecutionSession } from "./types.js";

type SessionKey = string;

function sessionKey(workspaceId: string, companyId?: string): SessionKey {
  return companyId ? `${workspaceId}:${companyId}` : workspaceId;
}

/** In-memory store for M075/M076 fulfillment sessions keyed by workspace. */
export class OrderExecutionSessionStore {
  private readonly sessions = new Map<SessionKey, OrderExecutionSession>();
  private readonly latestByWorkspace = new Map<string, SessionKey>();

  save(session: OrderExecutionSession): void {
    const key = sessionKey(session.workspaceId, session.companyId);
    this.sessions.set(key, session);
    this.latestByWorkspace.set(session.workspaceId, key);
  }

  get(workspaceId: string, companyId?: string): OrderExecutionSession | null {
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

export const orderExecutionSessionStore = new OrderExecutionSessionStore();

export function createOrderExecutionSessionId(): string {
  return randomUUID();
}
