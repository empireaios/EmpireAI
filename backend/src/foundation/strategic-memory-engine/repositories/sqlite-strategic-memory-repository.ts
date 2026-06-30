import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import type {
  StrategicMemoryEntry,
  StrategicMemoryLifecycleRecord,
} from "../models/strategic-memory.js";
import type { StrategicMemoryRepository } from "../repositories/strategic-memory-repository.js";

function mapMemoryRow(row: Record<string, unknown>): StrategicMemoryEntry {
  return JSON.parse(String(row.memory_json)) as StrategicMemoryEntry;
}

function mapLifecycleRow(row: Record<string, unknown>): StrategicMemoryLifecycleRecord {
  return {
    lifecycleId: String(row.lifecycle_id),
    memoryId: String(row.memory_id),
    workspaceId: String(row.workspace_id),
    event: row.event as StrategicMemoryLifecycleRecord["event"],
    summary: String(row.summary),
    actor: String(row.actor),
    correlationId: row.correlation_id ? String(row.correlation_id) : undefined,
    metadata: JSON.parse(String(row.metadata_json)),
    createdAt: String(row.created_at),
  };
}

let repositoryInstance: SqliteStrategicMemoryRepository | null = null;

export function getStrategicMemoryRepository(): SqliteStrategicMemoryRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteStrategicMemoryRepository();
  }
  return repositoryInstance;
}

export function resetStrategicMemoryRepository(): void {
  repositoryInstance = null;
}

/** SQLite persistence — strategic memories are never deleted, only archived or superseded. */
export class SqliteStrategicMemoryRepository implements StrategicMemoryRepository {
  saveMemory(entry: StrategicMemoryEntry): StrategicMemoryEntry {
    const db = getDatabase();
    const record = { ...entry, updatedAt: new Date().toISOString() };
    db.prepare(
      `INSERT INTO strategic_memories
        (memory_id, workspace_id, category, status, memory_json, created_at, updated_at)
       VALUES
        (@memoryId, @workspaceId, @category, @status, @memoryJson, @createdAt, @updatedAt)
       ON CONFLICT(memory_id) DO UPDATE SET
         category = excluded.category,
         status = excluded.status,
         memory_json = excluded.memory_json,
         updated_at = excluded.updated_at`,
    ).run({
      memoryId: record.memoryId,
      workspaceId: record.workspaceId,
      category: record.category,
      status: record.status,
      memoryJson: JSON.stringify(record),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
    return record;
  }

  getMemoryById(memoryId: string): StrategicMemoryEntry | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT memory_json FROM strategic_memories WHERE memory_id = @memoryId`)
      .get({ memoryId });
    return row ? mapMemoryRow(row as Record<string, unknown>) : null;
  }

  listMemories(workspaceId: string, category?: string, status?: string): StrategicMemoryEntry[] {
    const db = getDatabase();
    let query = `SELECT memory_json FROM strategic_memories WHERE workspace_id = @workspaceId`;
    const params: Record<string, unknown> = { workspaceId };

    if (category) {
      query += ` AND category = @category`;
      params.category = category;
    }
    if (status) {
      query += ` AND status = @status`;
      params.status = status;
    }
    query += ` ORDER BY memory_id ASC`;

    const rows = db.prepare(query).all(params);
    return (rows as Record<string, unknown>[]).map(mapMemoryRow);
  }

  appendLifecycle(record: StrategicMemoryLifecycleRecord): StrategicMemoryLifecycleRecord {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO strategic_memory_lifecycle
        (lifecycle_id, memory_id, workspace_id, event, summary, actor, correlation_id, metadata_json, created_at)
       VALUES
        (@lifecycleId, @memoryId, @workspaceId, @event, @summary, @actor, @correlationId, @metadataJson, @createdAt)`,
    ).run({
      lifecycleId: record.lifecycleId,
      memoryId: record.memoryId,
      workspaceId: record.workspaceId,
      event: record.event,
      summary: record.summary,
      actor: record.actor,
      correlationId: record.correlationId ?? null,
      metadataJson: JSON.stringify(record.metadata),
      createdAt: record.createdAt,
    });
    return record;
  }

  listLifecycle(memoryId: string, limit = 100): StrategicMemoryLifecycleRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM strategic_memory_lifecycle
         WHERE memory_id = @memoryId ORDER BY created_at DESC LIMIT @limit`,
      )
      .all({ memoryId, limit });
    return (rows as Record<string, unknown>[]).map(mapLifecycleRow);
  }

  listWorkspaceLifecycle(workspaceId: string, limit = 100): StrategicMemoryLifecycleRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM strategic_memory_lifecycle
         WHERE workspace_id = @workspaceId ORDER BY created_at DESC LIMIT @limit`,
      )
      .all({ workspaceId, limit });
    return (rows as Record<string, unknown>[]).map(mapLifecycleRow);
  }
}

export function createStrategicMemoryLifecycleRecord(
  input: Omit<StrategicMemoryLifecycleRecord, "lifecycleId" | "createdAt">,
): StrategicMemoryLifecycleRecord {
  return {
    lifecycleId: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };
}
