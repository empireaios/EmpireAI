import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type { SoulRuntimeEvent } from "../models/soul-runtime-event.js";
import type { SoulRuntimeRepository } from "./soul-runtime-repository.js";

function mapEventRow(row: Record<string, unknown>): SoulRuntimeEvent {
  return {
    eventId: String(row.event_id),
    workspaceId: String(row.workspace_id),
    memoryKey: row.memory_key as SoulRuntimeEvent["memoryKey"],
    title: String(row.title),
    summary: String(row.summary),
    source: row.source as SoulRuntimeEvent["source"],
    correlationId: row.correlation_id ? String(row.correlation_id) : undefined,
    auditAction: row.audit_action ? String(row.audit_action) : undefined,
    payload: JSON.parse(String(row.payload_json)),
    soulFileVersion: row.soul_file_version ? Number(row.soul_file_version) : undefined,
    recordedAt: String(row.recorded_at),
  };
}

let repositoryInstance: SqliteSoulRuntimeRepository | null = null;

export function getSoulRuntimeRepository(): SqliteSoulRuntimeRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteSoulRuntimeRepository();
  }
  return repositoryInstance;
}

export function resetSoulRuntimeRepository(): void {
  repositoryInstance = null;
}

/** SQLite persistence for Soul Runtime event log. */
export class SqliteSoulRuntimeRepository implements SoulRuntimeRepository {
  saveEvent(event: SoulRuntimeEvent): SoulRuntimeEvent {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO soul_runtime_events
        (event_id, workspace_id, memory_key, title, summary, source, correlation_id,
         audit_action, payload_json, soul_file_version, recorded_at)
       VALUES
        (@eventId, @workspaceId, @memoryKey, @title, @summary, @source, @correlationId,
         @auditAction, @payloadJson, @soulFileVersion, @recordedAt)
       ON CONFLICT(event_id) DO UPDATE SET
         soul_file_version = excluded.soul_file_version`,
    ).run({
      eventId: event.eventId,
      workspaceId: event.workspaceId,
      memoryKey: event.memoryKey,
      title: event.title,
      summary: event.summary,
      source: event.source,
      correlationId: event.correlationId ?? null,
      auditAction: event.auditAction ?? null,
      payloadJson: JSON.stringify(event.payload),
      soulFileVersion: event.soulFileVersion ?? null,
      recordedAt: event.recordedAt,
    });
    return event;
  }

  listEvents(workspaceId: string, limit = 100): SoulRuntimeEvent[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM soul_runtime_events
         WHERE workspace_id = @workspaceId
         ORDER BY recorded_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, limit });
    return (rows as Record<string, unknown>[]).map(mapEventRow);
  }

  getEventById(eventId: string): SoulRuntimeEvent | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT * FROM soul_runtime_events WHERE event_id = @eventId`)
      .get({ eventId });
    return row ? mapEventRow(row as Record<string, unknown>) : null;
  }
}

export function createSoulRuntimeEvent(
  input: Omit<SoulRuntimeEvent, "eventId" | "recordedAt"> & { eventId?: string },
): SoulRuntimeEvent {
  return {
    eventId: input.eventId ?? randomUUID(),
    workspaceId: input.workspaceId,
    memoryKey: input.memoryKey,
    title: input.title,
    summary: input.summary,
    source: input.source,
    correlationId: input.correlationId,
    auditAction: input.auditAction,
    payload: input.payload,
    soulFileVersion: input.soulFileVersion,
    recordedAt: new Date().toISOString(),
  };
}
