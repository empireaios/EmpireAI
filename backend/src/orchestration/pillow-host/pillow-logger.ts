import { randomUUID } from "node:crypto";

import type { AuditLogger } from "../../brain/audit/audit-logger.js";
import type { PillowRequestLogEntry } from "./types.js";

const MAX_LOG_ENTRIES = 500;

/** Structured Pillow request logging — session, latency, provider, tokens. */
export class PillowRequestLogger {
  private readonly entries: PillowRequestLogEntry[] = [];

  constructor(private readonly auditLogger?: AuditLogger) {}

  log(entry: Omit<PillowRequestLogEntry, "timestamp"> & { actor?: string }): PillowRequestLogEntry {
    const record: PillowRequestLogEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    this.entries.push(record);
    if (this.entries.length > MAX_LOG_ENTRIES) {
      this.entries.shift();
    }

    this.auditLogger?.write({
      action: "pillow.request",
      actor: entry.actor ?? "pillow-host",
      workspaceId: entry.workspaceId,
      correlationId: entry.requestId,
      metadata: {
        sessionId: entry.sessionId,
        action: entry.action,
        latencyMs: entry.latencyMs,
        provider: entry.provider,
        tokens: entry.tokens,
        result: entry.result,
        error: entry.error,
      },
    });

    return record;
  }

  list(filters?: {
    workspaceId?: string;
    sessionId?: string;
    limit?: number;
  }): PillowRequestLogEntry[] {
    let rows = [...this.entries];
    if (filters?.workspaceId) {
      rows = rows.filter((row) => row.workspaceId === filters.workspaceId);
    }
    if (filters?.sessionId) {
      rows = rows.filter((row) => row.sessionId === filters.sessionId);
    }
    rows.reverse();
    const limit = filters?.limit ?? 100;
    return rows.slice(0, limit);
  }

  clear(): void {
    this.entries.length = 0;
  }
}

export function newPillowRequestId(): string {
  return randomUUID();
}
